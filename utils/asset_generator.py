"""
Asset Generator - Create placeholder sprites and assets
Useful untuk testing tanpa real sprite files
"""

import os
import math
from PIL import Image, ImageDraw
from config.config import ASSETS_DIR, SPRITES_DIR


def draw_stickman(draw, x: int, y: int, frame_num: int, num_frames: int, 
                  pose: str = "idle", color: tuple = (100, 150, 200)):
    """
    Draw a stickman figure
    
    Args:
        draw: ImageDraw object
        x, y: Center position
        frame_num: Current frame number (0-indexed)
        num_frames: Total number of frames
        pose: Type of pose ("idle", "walk", "interact")
        color: RGB color tuple
    """
    # Stickman dimensions
    head_radius = 6
    body_length = 10
    arm_length = 8
    leg_length = 10
    
    # Calculate animation progress (0.0 to 1.0)
    progress = frame_num / max(num_frames - 1, 1)
    
    # Head
    draw.ellipse(
        [x - head_radius, y - head_radius, x + head_radius, y + head_radius],
        fill=color,
        outline=(255, 255, 255, 255),
        width=1
    )
    
    # Body
    body_bottom = y + body_length
    draw.line(
        [x, y + head_radius, x, body_bottom],
        fill=color,
        width=2
    )
    
    # Arms - vary position based on pose
    if pose == "interact":
        # Arms raised up
        arm_angle = -60 + progress * 20  # Slight wave
        arm_x1 = x + arm_length * math.cos(math.radians(arm_angle))
        arm_y1 = y + head_radius + 2 + arm_length * math.sin(math.radians(arm_angle))
        
        arm_x2 = x - arm_length * math.cos(math.radians(arm_angle))
        arm_y2 = y + head_radius + 2 + arm_length * math.sin(math.radians(arm_angle))
    else:
        # Normal arms
        arm_y = y + head_radius + 3
        arm_x1 = x + arm_length
        arm_y1 = arm_y
        arm_x2 = x - arm_length
        arm_y2 = arm_y
    
    draw.line([x, y + head_radius + 2, arm_x1, arm_y1], fill=color, width=2)
    draw.line([x, y + head_radius + 2, arm_x2, arm_y2], fill=color, width=2)
    
    # Legs - vary position based on pose and frame
    if pose == "walk":
        # Alternating leg positions for walking
        left_leg_offset = leg_length * math.sin(progress * math.pi * 2)
        right_leg_offset = -leg_length * math.sin(progress * math.pi * 2)
    else:
        left_leg_offset = 0
        right_leg_offset = 0
    
    # Left leg
    draw.line(
        [x, body_bottom, x - 3 + left_leg_offset, body_bottom + leg_length],
        fill=color,
        width=2
    )
    
    # Right leg
    draw.line(
        [x, body_bottom, x + 3 + right_leg_offset, body_bottom + leg_length],
        fill=color,
        width=2
    )


def create_placeholder_sprite(filename: str, color: tuple = (100, 150, 200), 
                            num_frames: int = 4, frame_size: int = 64,
                            pose: str = "idle"):
    """
    Create placeholder sprite with stickman figures
    
    Args:
        filename: Output filename (e.g., "idle.png")
        color: RGB tuple (r, g, b)
        num_frames: Number of frames in spritesheet
        frame_size: Size of each frame (frame_size x frame_size)
        pose: Type of pose ("idle", "walk", "interact")
    """
    # Create canvas
    width = frame_size * num_frames
    height = frame_size
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Draw frames with stickman
    for i in range(num_frames):
        frame_x = i * frame_size
        frame_center_x = frame_x + frame_size // 2
        frame_center_y = frame_size // 2
        
        # Vary color slightly for each frame
        r = min(255, color[0] + i * 5)
        g = min(255, color[1] - i * 3)
        b = min(255, color[2] + i * 7)
        frame_color = (r, g, b)
        
        # Draw stickman
        draw_stickman(
            draw, 
            frame_center_x, 
            frame_center_y, 
            i, 
            num_frames,
            pose=pose,
            color=frame_color
        )
    
    # Save
    filepath = os.path.join(SPRITES_DIR, filename)
    os.makedirs(SPRITES_DIR, exist_ok=True)
    image.save(filepath, 'PNG')
    print(f"✓ Created: {filename}")


def generate_all_placeholder_sprites():
    """Generate all placeholder sprites for testing"""
    print("Generating placeholder sprites...")
    print(f"Output directory: {SPRITES_DIR}")
    print()
    
    try:
        # Idle animation (blue stickman)
        create_placeholder_sprite("idle.png", color=(100, 150, 200), num_frames=4, pose="idle")
        
        # Walk left (green stickman walking)
        create_placeholder_sprite("walk_left.png", color=(100, 200, 100), num_frames=8, pose="walk")
        
        # Walk right (red stickman walking)
        create_placeholder_sprite("walk_right.png", color=(200, 100, 100), num_frames=8, pose="walk")
        
        # Interact (purple stickman with arms raised)
        create_placeholder_sprite("interact.png", color=(200, 100, 200), num_frames=3, pose="interact")
        
        print()
        print("✓ All placeholder sprites generated successfully!")
        return True
    except Exception as e:
        print(f"✗ Error generating sprites: {e}")
        return False


def load_frame_sequence_from_folder(folder_path: str) -> list:
    """
    Load all image frames from a folder in sorted order
    
    Args:
        folder_path: Path to folder containing frame images
        
    Returns:
        List of file paths sorted in order
    """
    image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
    frames = []
    
    if not os.path.exists(folder_path):
        return []
    
    try:
        all_files = sorted(os.listdir(folder_path))
        for filename in all_files:
            if any(filename.lower().endswith(ext) for ext in image_extensions):
                full_path = os.path.join(folder_path, filename)
                frames.append(full_path)
    except Exception as e:
        print(f"Error reading folder {folder_path}: {e}")
    
    return frames


def get_sprite_config() -> dict:
    """Get sprite configuration - uses Gugu character assets from Sprite Sheet Contents"""
    sprite_sheets_dir = os.path.join(ASSETS_DIR, "Sprite Sheet Contents")
    
    # Check for frame sequence assets (individual frame files)
    if os.path.exists(sprite_sheets_dir):
        config = {}
        
        # Define emotion states and their folders
        emotion_map = {
            "idle": "Neutral",
            "happy": "Happy",
            "interact": "Happy",  # Map interact to Happy animation
            "sad": "Sad",
            "worried": "Worried",
            "neglected": "Neglected",
            "walk_left": "Run Left Side",
            "walk_right": "Run Right Side",
        }
        
        for state_name, folder_name in emotion_map.items():
            folder_path = os.path.join(sprite_sheets_dir, folder_name)
            frames = load_frame_sequence_from_folder(folder_path)
            
            if frames:
                config[state_name] = {
                    "type": "sequence",
                    "frames": frames,
                    "fps": 7,  # Frames per second for animation
                }
        
        if config:
            return config
    
    # Fallback to single-frame gugu assets if they exist
    gugu_sprites_dir = os.path.join(SPRITES_DIR, "gugu")
    if os.path.exists(gugu_sprites_dir):
        # Using individual frames from gugu folder
        return {
            "idle": {
                "path": os.path.join(gugu_sprites_dir, "neutral.png"),
                "frame_width": None,  # Single frame image
                "frame_height": None,
                "num_frames": 1,
                "fps": 10,
                "type": "single_frame"
            },
            "walk_left": {
                "path": os.path.join(gugu_sprites_dir, "walk to the left.png"),
                "frame_width": None,
                "frame_height": None,
                "num_frames": 1,
                "fps": 10,
                "type": "single_frame"
            },
            "walk_right": {
                "path": os.path.join(gugu_sprites_dir, "walk to the right.png"),
                "frame_width": None,
                "frame_height": None,
                "num_frames": 1,
                "fps": 10,
                "type": "single_frame"
            },
            "happy": {
                "path": os.path.join(gugu_sprites_dir, "happy.png"),
                "frame_width": None,
                "frame_height": None,
                "num_frames": 1,
                "fps": 10,
                "type": "single_frame"
            },
            "sad": {
                "path": os.path.join(gugu_sprites_dir, "sad.png"),
                "frame_width": None,
                "frame_height": None,
                "num_frames": 1,
                "fps": 10,
                "type": "single_frame"
            },
            "worried": {
                "path": os.path.join(gugu_sprites_dir, "worried.png"),
                "frame_width": None,
                "frame_height": None,
                "num_frames": 1,
                "fps": 10,
                "type": "single_frame"
            },
            "neglected": {
                "path": os.path.join(gugu_sprites_dir, "neglected.png"),
                "frame_width": None,
                "frame_height": None,
                "num_frames": 1,
                "fps": 10,
                "type": "single_frame"
            }
        }
    
    # Fallback to placeholder sprites
    return {
        "idle": {
            "path": os.path.join(SPRITES_DIR, "idle.png"),
            "frame_width": 64,
            "frame_height": 64,
            "num_frames": 4,
            "fps": 8
        },
        "walk_left": {
            "path": os.path.join(SPRITES_DIR, "walk_left.png"),
            "frame_width": 64,
            "frame_height": 64,
            "num_frames": 8,
            "fps": 12
        },
        "walk_right": {
            "path": os.path.join(SPRITES_DIR, "walk_right.png"),
            "frame_width": 64,
            "frame_height": 64,
            "num_frames": 8,
            "fps": 12
        },
        "happy": {
            "path": os.path.join(SPRITES_DIR, "interact.png"),
            "frame_width": 64,
            "frame_height": 64,
            "num_frames": 3,
            "fps": 10
        }
    }


if __name__ == "__main__":
    generate_all_placeholder_sprites()
