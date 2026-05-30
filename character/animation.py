# Animation system - handles spritesheet loading and frame animation
# Optimized for reduced RAM usage with lazy frame caching
from PySide6.QtGui import QPixmap, QImage, QPainter, QColor
from PySide6.QtCore import QRect
import os
from typing import Dict, List, Tuple, Optional
from utils.logger import setup_logger
from utils.memory_profiler import log_memory

logger = setup_logger(__name__)

# Global frame cache with size limit to prevent excessive RAM usage
_FRAME_CACHE = {}
_MAX_CACHE_SIZE = 100  # Reduced from 150 to 100 frames
_ANIMATION_INSTANCES = {}  # Track animation instances for cleanup
_ACTIVE_ANIMATIONS = set()  # Track currently active animations
_CACHE_ACCESS_ORDER = []  # Track access order for LRU eviction


def _add_to_cache(key: str, value: QPixmap):
    """Add item to cache with LRU eviction when full"""
    global _FRAME_CACHE, _CACHE_ACCESS_ORDER
    
    if key in _FRAME_CACHE:
        # Update access order
        _CACHE_ACCESS_ORDER.remove(key)
    
    _FRAME_CACHE[key] = value
    _CACHE_ACCESS_ORDER.append(key)
    
    # Evict oldest items if cache is too full
    if len(_FRAME_CACHE) > _MAX_CACHE_SIZE * 1.1:  # Allow 10% overage before evicting
        # Remove 20% of cache (oldest items)
        num_to_remove = max(1, len(_FRAME_CACHE) // 5)
        for _ in range(num_to_remove):
            if _CACHE_ACCESS_ORDER:
                old_key = _CACHE_ACCESS_ORDER.pop(0)
                if old_key in _FRAME_CACHE:
                    del _FRAME_CACHE[old_key]
                    logger.debug(f"Evicted cache entry: {old_key} (cache size: {len(_FRAME_CACHE)})")


class Animation:
    """Represents a single animation sequence"""
    
    def __init__(self, name: str, pixmap: QPixmap, frame_width: int, frame_height: int, 
                 num_frames: int, fps: int = 10):
        self.name = name
        self.pixmap = pixmap
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.num_frames = num_frames
        self.fps = fps
        self.frame_duration = 1000 // fps  # milliseconds
        self.frames: List[QPixmap] = self._extract_frames()
        logger.debug(f"Animation '{name}' created: {num_frames} frames, {fps} fps")
    
    def _extract_frames(self) -> List[QPixmap]:
        """Extract individual frames from spritesheet"""
        frames = []
        for i in range(self.num_frames):
            x = i * self.frame_width
            y = 0
            
            # Crop frame from spritesheet
            frame_pixmap = self.pixmap.copy(x, y, self.frame_width, self.frame_height)
            frames.append(frame_pixmap)
        
        return frames
    
    def get_frame(self, frame_index: int) -> QPixmap:
        """Get frame at index"""
        if frame_index < 0 or frame_index >= len(self.frames):
            frame_index = frame_index % len(self.frames)
        return self.frames[frame_index]


class FrameSequenceAnimation:
    """Animation loaded from individual frame files (like Happy/Neutral sprites)"""
    
    def __init__(self, name: str, frame_files: List[str], fps: int = 7):
        """
        Create animation from individual frame files
        
        Args:
            name: Name of animation
            frame_files: List of image file paths in sequence order
            fps: Frames per second
        """
        self.name = name
        self.fps = fps
        self.frame_duration = 1000 // fps  # milliseconds
        self.num_frames = len(frame_files)
        self.frames: List[QPixmap] = []
        self.frame_files = frame_files  # Keep file references for lazy loading
        
        # Load all frames with cache optimization
        for i, frame_path in enumerate(frame_files):
            if not os.path.exists(frame_path):
                logger.warning(f"Frame file not found: {frame_path}")
                continue
            
            # Check cache first
            cache_key = f"{name}_{i}"
            if cache_key in _FRAME_CACHE:
                pixmap = _FRAME_CACHE[cache_key]
            else:
                pixmap = QPixmap(frame_path)
                if pixmap.isNull():
                    logger.warning(f"Failed to load frame: {frame_path}")
                    continue
                
                # Add to cache with LRU eviction
                _add_to_cache(cache_key, pixmap)
            
            self.frames.append(pixmap)
            logger.debug(f"Loaded frame {i+1}/{self.num_frames}: {frame_path}")
        
        if not self.frames:
            logger.error(f"No valid frames loaded for animation: {name}")
        else:
            logger.info(f"FrameSequenceAnimation '{name}' created: {len(self.frames)} frames at {fps} fps (cache size: {len(_FRAME_CACHE)})")
    
    def get_frame(self, frame_index: int) -> QPixmap:
        """Get frame at index"""
        if not self.frames:
            return None
        
        if frame_index < 0 or frame_index >= len(self.frames):
            frame_index = frame_index % len(self.frames)
        return self.frames[frame_index]


class AnimationController:
    """Manages character animations and frame updates"""
    
    def __init__(self, width: int = 256, height: int = 256):
        self.width = width
        self.height = height
        self.animations: Dict[str, Animation] = {}
        self.current_animation: Animation = None
        self.current_frame_index = 0
        self.elapsed_time = 0  # Track time in milliseconds
        self.last_animation: Optional[str] = None  # Track previous animation
        logger.info("AnimationController initialized")
        log_memory("AnimationController.init")
    
    def add_animation(self, animation: Animation):
        """Add animation to controller"""
        self.animations[animation.name] = animation
        if self.current_animation is None:
            self.set_animation(animation.name)
    
    def set_animation(self, animation_name: str) -> bool:
        """Switch to different animation with automatic cleanup"""
        if animation_name not in self.animations:
            logger.warning(f"Animation '{animation_name}' not found")
            return False
        
        # Clean up previous animation if switching
        if self.current_animation and self.last_animation != animation_name:
            self._cleanup_old_animation()
        
        self.current_animation = self.animations[animation_name]
        self.current_frame_index = 0
        self.elapsed_time = 0
        self.last_animation = animation_name
        _ACTIVE_ANIMATIONS.add(animation_name)
        
        log_memory(f"AnimationController.set_animation.{animation_name}")
        logger.debug(f"Animation switched to: {animation_name}")
        return True
    
    def _cleanup_old_animation(self):
        """Cleanup and unload old animation to free memory"""
        if self.last_animation and self.last_animation in _ACTIVE_ANIMATIONS:
            _ACTIVE_ANIMATIONS.discard(self.last_animation)
            logger.debug(f"Cleaned up animation: {self.last_animation}")
            # Note: We keep the animation in self.animations for quick re-switching
            # but its frame cache will be evicted when new animations load
    
    def cleanup_all(self):
        """Clear all animations from memory"""
        _ACTIVE_ANIMATIONS.clear()
        self.animations.clear()
        self.current_animation = None
        logger.debug("All animations cleared")
    
    def get_animation_count(self) -> int:
        """Get number of loaded animations"""
        return len(self.animations)
    
    def get_cache_size(self) -> int:
        """Get current frame cache size"""
        return len(_FRAME_CACHE)
    
    def update_frame(self, delta_time: int = 150) -> QPixmap:
        """
        Update and return current frame
        
        Args:
            delta_time: Time since last update in milliseconds (default 150ms)
        """
        if self.current_animation is None:
            return None
        
        self.elapsed_time += delta_time
        
        # Get frame duration (works for both Animation and FrameSequenceAnimation)
        frame_duration = self.current_animation.frame_duration
        frames_to_advance = self.elapsed_time // frame_duration
        
        if frames_to_advance > 0:
            self.elapsed_time %= frame_duration
            num_frames = self.current_animation.num_frames
            self.current_frame_index = (self.current_frame_index + frames_to_advance) % num_frames
        
        return self.current_animation.get_frame(self.current_frame_index)
    
    def get_current_frame(self) -> QPixmap:
        """Get current frame without advancing"""
        if self.current_animation is None:
            return None
        return self.current_animation.get_frame(self.current_frame_index)
    
    def load_sprite_image(self, image_path: str) -> QPixmap:
        """Load sprite image from file"""
        if not os.path.exists(image_path):
            logger.error(f"Sprite file not found: {image_path}")
            return None
        
        pixmap = QPixmap(image_path)
        if pixmap.isNull():
            logger.error(f"Failed to load sprite: {image_path}")
            return None
        
        logger.info(f"Sprite loaded: {image_path} ({pixmap.width()}x{pixmap.height()})")
        return pixmap
    
    def create_placeholder_animation(self, name: str, color: str = "#FF0000") -> bool:
        """Create a placeholder animation (colored square)"""
        # Create a spritesheet-like pixmap with 4 frames (64x256 each)
        full_pixmap = QPixmap(256, 256)
        full_pixmap.fill(QColor(0, 0, 0, 0))  # Transparent background
        
        # Draw 4 colored squares as frames
        painter = QPainter(full_pixmap)
        frame_colors = ["#FF0000", "#FF6600", "#FF0000", "#FF6600"]  # Red and orange alternating
        
        for i in range(4):
            x = i * 64
            painter.fillRect(x + 8, 8, 48, 240, QColor(frame_colors[i]))
            painter.drawRect(x + 8, 8, 48, 240)
        
        painter.end()
        
        # Create animation from the spritesheet
        animation = Animation(name, full_pixmap, 64, 256, 4, fps=10)
        self.add_animation(animation)
        logger.info(f"Placeholder animation created: {name}")
        return True
    
    def load_frame_sequence(self, animation_name: str, frame_files, fps: int = 7) -> bool:
        """
        Load animation from individual frame files
        
        Args:
            animation_name: Name for the animation
            frame_files: Either a folder path (str) or list of file paths
            fps: Frames per second for animation
            
        Returns:
            True if successfully loaded, False otherwise
        """
        # Handle both folder path (string) and list of file paths
        if isinstance(frame_files, str):
            # It's a folder path - load all images from folder
            folder_path = frame_files
            if not os.path.exists(folder_path):
                logger.error(f"Frame sequence folder not found: {folder_path}")
                return False
            
            # Find all image files in folder
            image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
            files = []
            
            try:
                all_files = sorted(os.listdir(folder_path))
                for filename in all_files:
                    if any(filename.lower().endswith(ext) for ext in image_extensions):
                        full_path = os.path.join(folder_path, filename)
                        files.append(full_path)
                
                if not files:
                    logger.warning(f"No image files found in: {folder_path}")
                    return False
                
                frame_files = files
            except Exception as e:
                logger.error(f"Error reading folder {folder_path}: {e}")
                return False
        
        # frame_files is now a list of file paths
        if not frame_files:
            logger.error(f"No frame files provided for animation: {animation_name}")
            return False
        
        # Create animation from frame sequence
        animation = FrameSequenceAnimation(animation_name, frame_files, fps=fps)
        
        if animation.frames:
            self.animations[animation_name] = animation
            if self.current_animation is None:
                self.set_animation(animation_name)
            logger.info(f"Frame sequence animation loaded: {animation_name} ({len(animation.frames)} frames)")
            return True
        else:
            logger.error(f"Failed to load frames for: {animation_name}")
            return False
