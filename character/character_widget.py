# Character Widget - main display for character sprite
from PySide6.QtWidgets import QWidget
from PySide6.QtGui import QPainter, QPixmap, QColor
from PySide6.QtCore import Qt, QTimer, Signal, QPoint
from character.animation import AnimationController
from config.config import WINDOW_WIDTH, WINDOW_HEIGHT, ANIMATION_FRAME_INTERVAL, CHARACTER_SIZE, CHARACTER_MIN_SIZE, CHARACTER_MAX_SIZE
from utils.logger import setup_logger

logger = setup_logger(__name__)


class CharacterWidget(QWidget):
    """
    Main character display widget
    Handles rendering and frame updates
    """
    
    position_changed = Signal(int, int)
    size_changed = Signal(int)  # Size percentage
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Set widget size to match window
        self.setFixedSize(WINDOW_WIDTH, WINDOW_HEIGHT)
        
        # Character size settings
        self.character_size_percent = CHARACTER_SIZE  # 100 = normal
        self.character_min_size = CHARACTER_MIN_SIZE
        self.character_max_size = CHARACTER_MAX_SIZE
        
        self.animation_controller = AnimationController(WINDOW_WIDTH, WINDOW_HEIGHT)
        self.is_dragging = False
        self.drag_offset = QPoint(0, 0)
        
        # Animation timer
        self.animation_timer = QTimer()
        self.animation_timer.timeout.connect(self.update_animation)
        self.animation_timer.start(ANIMATION_FRAME_INTERVAL)
        
        logger.info(f"CharacterWidget initialized - size: {self.character_size_percent}%")
    
    def update_animation(self):
        """Update animation frame"""
        try:
            # Pass delta time to animation controller (ANIMATION_FRAME_INTERVAL is in ms)
            self.animation_controller.update_frame(delta_time=ANIMATION_FRAME_INTERVAL)
            self.update()  # Trigger repaint
        except KeyboardInterrupt:
            # Suppress KeyboardInterrupt during animation frame updates
            pass
        except Exception as e:
            logger.error(f"Error updating animation: {e}")
    
    def paintEvent(self, event):
        """Paint character sprite"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)
        
        # Clear background (transparent)
        painter.fillRect(event.rect(), QColor(0, 0, 0, 0))
        
        # Get current frame
        frame = self.animation_controller.get_current_frame()
        
        if frame is not None and not frame.isNull():
            # Calculate scaled size based on character_size_percent
            scale_factor = self.character_size_percent / 100.0
            target_height = int(self.height() * scale_factor)
            
            # Scale frame if needed to fit widget
            scaled_frame = frame.scaledToHeight(target_height, Qt.SmoothTransformation)
            
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
    
    def create_placeholder_animations(self):
        """Create placeholder animations as fallback"""
        logger.info("Creating placeholder animations...")
        self.animation_controller.create_placeholder_animation("idle")
        self.animation_controller.create_placeholder_animation("walk_left")
        self.animation_controller.create_placeholder_animation("walk_right")
        self.animation_controller.set_animation("idle")

