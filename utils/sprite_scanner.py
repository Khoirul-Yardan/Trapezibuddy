#!/usr/bin/env python3
"""
Automatic Sprite Generator
Scans assets folder and creates sprites from PNG files
Supports individual frames or spritesheet generation
"""

import os
import glob
from pathlib import Path
from PIL import Image
from utils.logger import setup_logger

logger = setup_logger(__name__)


class SpriteScanner:
    """Automatically scan and generate sprites from PNG files"""
    
    def __init__(self, assets_dir: str, sprites_dir: str):
        self.assets_dir = Path(assets_dir)
        self.sprites_dir = Path(sprites_dir)
        
        if not self.assets_dir.exists():
            logger.warning(f"Assets directory not found: {assets_dir}")
        if not self.sprites_dir.exists():
            logger.warning(f"Sprites directory not found: {sprites_dir}")
    
    def scan_for_sprites(self) -> dict:
        """
        Scan assets and sprites folders for PNG files
        Returns dict of animation_name -> [image_paths]
        """
        sprites = {}
        
        # Scan assets directory
        if self.assets_dir.exists():
            for subfolder in self.assets_dir.iterdir():
                if subfolder.is_dir():
                    anim_name = subfolder.name.lower()
                    png_files = sorted(glob.glob(str(subfolder / "*.png")))
                    
                    if png_files:
                        sprites[anim_name] = png_files
                        logger.info(f"Found animation '{anim_name}': {len(png_files)} frames")
        
        # Scan sprites directory for character folders
        if self.sprites_dir.exists():
            for char_folder in self.sprites_dir.iterdir():
                if char_folder.is_dir():
                    char_name = char_folder.name.lower()
                    
                    # Scan for animation subfolders
                    for anim_folder in char_folder.iterdir():
                        if anim_folder.is_dir():
                            anim_name = f"{char_name}_{anim_folder.name}".lower()
                            png_files = sorted(glob.glob(str(anim_folder / "*.png")))
                            
                            if png_files and anim_name not in sprites:
                                sprites[anim_name] = png_files
                                logger.info(f"Found character animation '{anim_name}': {len(png_files)} frames")
        
        return sprites
    
    def get_animation_config(self) -> dict:
        """
        Generate animation config from scanned sprites
        Returns dict suitable for load_character_sprites
        """
        sprites = self.scan_for_sprites()
        config = {}
        
        for anim_name, png_files in sprites.items():
            if not png_files:
                continue
            
            # Get first image to determine frame dimensions
            try:
                img = Image.open(png_files[0])
                width, height = img.size
                num_frames = len(png_files)
                
                # Determine if single frame or animation
                if num_frames == 1:
                    # Single frame - might be spritesheet or single sprite
                    config[anim_name] = {
                        'path': png_files[0],
                        'frame_width': width,
                        'frame_height': height,
                        'num_frames': 1,
                        'fps': 10,
                        'type': 'single'
                    }
                else:
                    # Multiple frames - treat as animation
                    config[anim_name] = {
                        'path': png_files[0],  # First frame path (for reference)
                        'frame_width': width,
                        'frame_height': height,
                        'num_frames': num_frames,
                        'fps': 10,
                        'type': 'sequence',
                        'frames': png_files  # All frame paths
                    }
                
                logger.info(f"Animation config created for '{anim_name}': {num_frames} frames @ {width}x{height}")
                
            except Exception as e:
                logger.error(f"Failed to process {png_files[0]}: {e}")
                continue
        
        return config
    
    def generate_basic_sprites(self) -> dict:
        """
        Generate sprite config with sensible defaults
        Maps found images to animation names
        """
        config = {}
        sprites = self.scan_for_sprites()
        
        # Map common animation names
        animation_map = {
            'idle': ['idle', 'stand', 'default'],
            'walk': ['walk', 'move', 'run'],
            'walk_left': ['walk_left', 'walk_left', 'move_left'],
            'walk_right': ['walk_right', 'walk_right', 'move_right'],
            'interact': ['interact', 'talk', 'action'],
            'jump': ['jump', 'bounce'],
            'happy': ['happy', 'smile', 'celebrate'],
        }
        
        # Try to map found sprites to standard animations
        for std_anim, variants in animation_map.items():
            for sprite_name, frames in sprites.items():
                if any(variant.lower() in sprite_name.lower() for variant in variants):
                    if frames and std_anim not in config:
                        img = Image.open(frames[0])
                        w, h = img.size
                        config[std_anim] = {
                            'path': frames[0],
                            'frame_width': w,
                            'frame_height': h,
                            'num_frames': len(frames),
                            'fps': 10,
                            'type': 'sequence' if len(frames) > 1 else 'single',
                            'frames': frames
                        }
                        logger.info(f"Mapped '{sprite_name}' -> '{std_anim}'")
                        break
        
        return config


class FrameSequenceLoader:
    """Load animation from sequence of PNG frames"""
    
    @staticmethod
    def load_frames(frame_paths: list) -> list:
        """
        Load sequence of PNG frames
        Returns list of PIL Image objects
        """
        frames = []
        for path in frame_paths:
            try:
                img = Image.open(path)
                frames.append(img)
            except Exception as e:
                logger.error(f"Failed to load frame {path}: {e}")
        
        return frames
    
    @staticmethod
    def create_animation_from_frames(frame_paths: list, fps: int = 10) -> dict:
        """
        Create animation dict from frame sequence
        
        Args:
            frame_paths: List of paths to PNG frames
            fps: Frames per second
        
        Returns:
            Dict with frame_interval and frames info
        """
        frames = FrameSequenceLoader.load_frames(frame_paths)
        
        if not frames:
            logger.error("No frames loaded!")
            return {}
        
        frame_interval = int(1000 / fps)  # Convert fps to milliseconds
        
        return {
            'frames': frames,
            'frame_interval': frame_interval,
            'num_frames': len(frames),
            'fps': fps,
            'paths': frame_paths
        }
