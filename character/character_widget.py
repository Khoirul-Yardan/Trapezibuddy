# Character Widget - main display for character sprite
# Optimized for reduced RAM usage with scaled frame caching
from PySide6.QtWidgets import QWidget
from PySide6.QtGui import QPainter, QPixmap, QColor
from PySide6.QtCore import Qt, QTimer, Signal, QPoint
from character.animation import AnimationController
from config.config import WINDOW_WIDTH, WINDOW_HEIGHT, ANIMATION_FRAME_INTERVAL, CHARACTER_SIZE, CHARACTER_MIN_SIZE, CHARACTER_MAX_SIZE
from utils.logger import setup_logger
from utils.memory_profiler import log_memory

logger = setup_logger(__name__)

# Global scaled frame cache to prevent redundant rescaling
_SCALED_FRAME_CACHE = {}
_MAX_SCALED_CACHE = 50
_SCALED_CACHE_ACCESS_ORDER = []  # Track access order for LRU eviction


def _add_to_scaled_cache(key, value):
    """Add item to scaled frame cache with LRU eviction"""
    global _SCALED_FRAME_CACHE, _SCALED_CACHE_ACCESS_ORDER
    
    if key in _SCALED_FRAME_CACHE:
        # Update access order
        _SCALED_CACHE_ACCESS_ORDER.remove(key)
    
    _SCALED_FRAME_CACHE[key] = value
    _SCALED_CACHE_ACCESS_ORDER.append(key)
    
    # Evict oldest items if cache is too full
    if len(_SCALED_FRAME_CACHE) > _MAX_SCALED_CACHE * 1.2:  # Allow 20% overage
        num_to_remove = max(1, len(_SCALED_FRAME_CACHE) // 5)
        for _ in range(num_to_remove):
            if _SCALED_CACHE_ACCESS_ORDER:
                old_key = _SCALED_CACHE_ACCESS_ORDER.pop(0)
                if old_key in _SCALED_FRAME_CACHE:
                    del _SCALED_FRAME_CACHE[old_key]


class CharacterWidget(QWidget):
    """
    Main character display widget
    Handles rendering and frame updates
    Optimized: Caches scaled frames to reduce memory allocation per frame
    """
    
    position_changed = Signal(int, int)
    size_changed = Signal(int)  # Size percentage
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Ensure widget background is transparent (avoid gray border artifacts)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setAttribute(Qt.WA_NoSystemBackground)
        self.setStyleSheet("background: transparent; border: none; margin: 0px; padding: 0px;")

        # Set widget size to match window
        self.setFixedSize(WINDOW_WIDTH, WINDOW_HEIGHT)
        
        # Character size settings
        self.character_size_percent = CHARACTER_SIZE  # 100 = normal
        self.character_min_size = CHARACTER_MIN_SIZE
        self.character_max_size = CHARACTER_MAX_SIZE
        self.last_scale_factor = 0  # Track last scale for cache key
        
        self.animation_controller = AnimationController(WINDOW_WIDTH, WINDOW_HEIGHT)
        self.is_dragging = False
        self.drag_offset = QPoint(0, 0)
        
        # Animation timer - reduced update frequency from 60fps to 30fps for lower CPU/RAM usage
        self.animation_timer = QTimer()
        self.animation_timer.timeout.connect(self.update_animation)
        # Double the interval from ANIMATION_FRAME_INTERVAL to reduce CPU/RAM pressure
        timer_interval = max(16, ANIMATION_FRAME_INTERVAL * 2)  # min 16ms (60fps), typically 33ms (30fps)
        self.animation_timer.start(timer_interval)
        
        # Cache monitoring timer - log cache stats every 5 seconds
        self.cache_monitor_timer = QTimer()
        self.cache_monitor_timer.timeout.connect(self._monitor_cache)
        self.cache_monitor_timer.start(5000)  # 5 seconds
        
        self.frame_count = 0
        
        logger.info(f"CharacterWidget initialized - size: {self.character_size_percent}%, update interval: {timer_interval}ms")
        log_memory("CharacterWidget.init")
    
    def update_animation(self):
        """Update animation frame"""
        try:
            # Pass delta time to animation controller
            self.animation_controller.update_frame(delta_time=ANIMATION_FRAME_INTERVAL)
            self.frame_count += 1
            
            # Log memory every 100 frames to track usage patterns
            if self.frame_count % 100 == 0:
                log_memory(f"CharacterWidget.frame_{self.frame_count}")
            
            self.update()  # Trigger repaint
        except KeyboardInterrupt:
            pass
        except Exception as e:
            logger.error(f"Error updating animation: {e}")
    
    def _monitor_cache(self):
        """Monitor cache sizes and log stats"""
        scaled_cache_size = len(_SCALED_FRAME_CACHE)
        anim_count = self.animation_controller.get_animation_count()
        logger.debug(f"Cache Monitor - Scaled frames: {scaled_cache_size}/{_MAX_SCALED_CACHE}, Animations: {anim_count}, Total frames: {self.frame_count}")
    
    def paintEvent(self, event):
        """Paint character sprite with optimized caching"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)
        
        # Clear background completely (fully transparent)
        painter.fillRect(event.rect(), QColor(0, 0, 0, 0))
        
        # Get current frame
        frame = self.animation_controller.get_current_frame()
        
        if frame is not None and not frame.isNull():
            # Calculate scaled size based on character_size_percent
            scale_factor = self.character_size_percent / 100.0
            target_height = int(self.height() * scale_factor)
            
            # Use cache to avoid repeated rescaling of the same frame
            cache_key = (id(frame), target_height)
            if cache_key in _SCALED_FRAME_CACHE:
                scaled_frame = _SCALED_FRAME_CACHE[cache_key]
            else:
                # Only scale if needed
                if target_height != frame.height():
                    scaled_frame = frame.scaledToHeight(target_height, Qt.SmoothTransformation)
                else:
                    scaled_frame = frame
                
                # Add to cache with LRU eviction
                _add_to_scaled_cache(cache_key, scaled_frame)
            
            # Draw frame centered in widget
            x = (self.width() - scaled_frame.width()) // 2
            y = (self.height() - scaled_frame.height()) // 2
            
            painter.drawPixmap(x, y, scaled_frame)
        else:
            # Draw debug info if no frame
            painter.setPen(QColor(255, 0, 0))
            painter.drawRect(10, 10, self.width()-20, self.height()-20)
            painter.drawText(self.rect(), Qt.AlignCenter, "No Frame")
        
        painter.end()
    
    def set_character_size(self, size_percent: int):
        """
        Set character size as percentage
        
        Args:
            size_percent: Size as percentage (100 = normal, 50 = half, 150 = 1.5x)
        """
        # Clamp to min/max
        size_percent = max(self.character_min_size, min(self.character_max_size, size_percent))
        
        if size_percent != self.character_size_percent:
            self.character_size_percent = size_percent
            self.size_changed.emit(size_percent)
            self.update()  # Trigger repaint with new size
            logger.debug(f"Character size changed to: {size_percent}%")
    
    def get_character_size(self) -> int:
        """Get current character size percentage"""
        return self.character_size_percent
    
    def increase_size(self, percent: int = 10):
        """Increase character size"""
        self.set_character_size(self.character_size_percent + percent)
    
    def decrease_size(self, percent: int = 10):
        """Decrease character size"""
        self.set_character_size(self.character_size_percent - percent)
    
    def set_animation(self, animation_name: str):
        """Switch animation"""
        self.animation_controller.set_animation(animation_name)
    
    def load_spritesheet(self, animation_name: str, sprite_path: str, 
                         frame_width: int, frame_height: int, 
                         num_frames: int, fps: int = 10, sprite_type: str = "spritesheet"):
        """
        Load animation from sprite image
        
        Args:
            animation_name: Name of the animation
            sprite_path: Path to sprite image file
            frame_width: Width of each frame (if spritesheet)
            frame_height: Height of each frame (if spritesheet)
            num_frames: Number of frames
            fps: Frames per second for animation
            sprite_type: "spritesheet" (multiple frames arranged horizontally) or "single_frame"
        """
        pixmap = self.animation_controller.load_sprite_image(sprite_path)
        if pixmap is None:
            logger.warning(f"Failed to load sprite: {sprite_path}")
            return False
        
        # Handle single-frame images (like from gugu folder)
        if sprite_type == "single_frame" or num_frames == 1:
            # Create a single-frame animation from the image
            from character.animation import Animation
            animation = Animation(animation_name, pixmap, pixmap.width(), pixmap.height(), 1, fps)
            self.animation_controller.add_animation(animation)
        else:
            # Handle traditional spritesheet with multiple frames arranged horizontally
            from character.animation import Animation
            animation = Animation(animation_name, pixmap, frame_width, frame_height, num_frames, fps)
            self.animation_controller.add_animation(animation)
        
        return True
    
    def load_frame_sequence(self, animation_name: str, frame_files: list, fps: int = 7):
        """
        Load animation from a sequence of individual frame files
        
        Args:
            animation_name: Name of the animation
            frame_files: List of image file paths in sequence order
            fps: Frames per second for animation
            
        Returns:
            True if successfully loaded, False otherwise
        """
        return self.animation_controller.load_frame_sequence(animation_name, frame_files, fps=fps)
        
        logger.info(f"Spritesheet loaded: {animation_name}")
        return True
    
    def mousePressEvent(self, event):
        """Handle mouse press for dragging"""
        if event.button() == Qt.LeftButton:
            self.is_dragging = True
            global_pos = event.globalPosition().toPoint()
            # Get parent window's position, not widget's position
            if self.parent():
                parent_window = self.parent()
                parent_pos = parent_window.pos()
                self.drag_offset = global_pos - parent_pos
            else:
                self.drag_offset = QPoint(0, 0)
            logger.debug(f"Drag started at {global_pos}")
        elif event.button() == Qt.RightButton:
            # Right click to show size menu (future feature)
            logger.debug(f"Right-clicked at {event.globalPosition().toPoint()}")
    
    def mouseMoveEvent(self, event):
        """Handle mouse move for dragging"""
        if self.is_dragging and self.parent():
            global_pos = event.globalPosition().toPoint()
            # Calculate new parent window position (not widget position)
            new_window_pos = global_pos - self.drag_offset
            # Emit position change - parent window will handle the movement
            self.position_changed.emit(int(new_window_pos.x()), int(new_window_pos.y()))
            logger.debug(f"Dragging to window position: {new_window_pos}")
    
    def mouseReleaseEvent(self, event):
        """Handle mouse release"""
        if event.button() == Qt.LeftButton:
            self.is_dragging = False
            logger.debug(f"Drag ended at {event.globalPosition().toPoint()}")
    
    def wheelEvent(self, event):
        """Handle mouse wheel for size adjustment"""
        if event.angleDelta().y() > 0:
            # Scroll up - increase size
            self.increase_size(5)
        else:
            # Scroll down - decrease size
            self.decrease_size(5)
        logger.debug(f"Mouse wheel - new size: {self.character_size_percent}%")
    
    def cleanup(self):
        """Cleanup resources"""
        self.animation_timer.stop()
        self.cache_monitor_timer.stop()
        self.animation_controller.cleanup_all()
        # Clear scaled frame cache
        global _SCALED_FRAME_CACHE, _SCALED_CACHE_ACCESS_ORDER
        _SCALED_FRAME_CACHE.clear()
        _SCALED_CACHE_ACCESS_ORDER.clear()
        logger.info("CharacterWidget cleanup complete")
    
    def create_placeholder_animations(self):
        """Create placeholder animations as fallback"""
        logger.info("Creating placeholder animations...")
        self.animation_controller.create_placeholder_animation("idle")
        self.animation_controller.create_placeholder_animation("walk_left")
        self.animation_controller.create_placeholder_animation("walk_right")
        self.animation_controller.set_animation("idle")

