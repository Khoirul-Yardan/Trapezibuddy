# Animation system - handles spritesheet loading and frame animation
from PySide6.QtGui import QPixmap, QImage, QPainter, QColor
from PySide6.QtCore import QRect
import os
from typing import Dict, List, Tuple
from utils.logger import setup_logger

logger = setup_logger(__name__)


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


class AnimationController:
    """Manages character animations and frame updates"""
    
    def __init__(self, width: int = 256, height: int = 256):
        self.width = width
        self.height = height
        self.animations: Dict[str, Animation] = {}
        self.current_animation: Animation = None
        self.current_frame_index = 0
        self.elapsed_time = 0  # Track time in milliseconds
        logger.info("AnimationController initialized")
    
    def add_animation(self, animation: Animation):
        """Add animation to controller"""
        self.animations[animation.name] = animation
        if self.current_animation is None:
            self.set_animation(animation.name)
    
    def set_animation(self, animation_name: str) -> bool:
        """Switch to different animation"""
        if animation_name not in self.animations:
            logger.warning(f"Animation '{animation_name}' not found")
            return False
        
        self.current_animation = self.animations[animation_name]
        self.current_frame_index = 0
        self.elapsed_time = 0
        logger.debug(f"Animation switched to: {animation_name}")
        return True
    
    def update_frame(self, delta_time: int = 150) -> QPixmap:
        """
        Update and return current frame
        
        Args:
            delta_time: Time since last update in milliseconds (default 150ms)
        """
        if self.current_animation is None:
            return None
        
        self.elapsed_time += delta_time
        
        # Check if it's time to advance frame based on frame duration
        frame_duration = self.current_animation.frame_duration
        frames_to_advance = self.elapsed_time // frame_duration
        
        if frames_to_advance > 0:
            self.elapsed_time %= frame_duration
            self.current_frame_index = (self.current_frame_index + frames_to_advance) % self.current_animation.num_frames
        
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
