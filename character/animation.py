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
        
        # Load all frames
        for i, frame_path in enumerate(frame_files):
            if not os.path.exists(frame_path):
                logger.warning(f"Frame file not found: {frame_path}")
                continue
            
            pixmap = QPixmap(frame_path)
            if pixmap.isNull():
                logger.warning(f"Failed to load frame: {frame_path}")
                continue
            
            self.frames.append(pixmap)
            logger.debug(f"Loaded frame {i+1}/{self.num_frames}: {frame_path}")
        
        if not self.frames:
            logger.error(f"No valid frames loaded for animation: {name}")
        else:
            logger.info(f"FrameSequenceAnimation '{name}' created: {len(self.frames)} frames at {fps} fps")
    
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
