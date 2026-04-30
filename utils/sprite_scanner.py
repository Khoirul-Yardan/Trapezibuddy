#!/usr/bin/env python3
import os
import glob
import json
from pathlib import Path
from PIL import Image


class SpriteScanner:
    def __init__(self, assets_dir: str, sprites_dir: str = None):
        self.assets_dir = Path(assets_dir)
        self.sprites_dir = Path(sprites_dir) if sprites_dir else self.assets_dir / "sprites"

    # =============================
    # SCAN FOR FRAME SEQUENCE DIRECTORIES
    # =============================
    def scan_frame_sequences(self):
        """Scan for frame sequence directories in Sprite Sheet Contents"""
        frame_sequences = {}
        
        frame_sequences_path = self.assets_dir / "Sprite Sheet Contents"
        
        if not frame_sequences_path.exists():
            print("[INFO] Sprite Sheet Contents folder not found")
            return frame_sequences
        
        # Look for subdirectories (Happy, Neglected, Sad, etc.)
        try:
            for item in sorted(os.listdir(frame_sequences_path)):
                item_path = frame_sequences_path / item
                
                if item_path.is_dir():
                    # Get all image files in this directory
                    image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
                    image_files = []
                    
                    for filename in sorted(os.listdir(item_path)):
                        if any(filename.lower().endswith(ext) for ext in image_extensions):
                            image_files.append(str(item_path / filename))
                    
                    if image_files:
                        # Use lowercase name as animation key
                        anim_name = item.lower().replace(" ", "_")
                        frame_sequences[anim_name] = image_files
                        print(f"[FRAMES] {anim_name}: {len(image_files)} frames from '{item}' folder")
        
        except Exception as e:
            print(f"[ERROR] Scanning frame sequences: {e}")
        
        return frame_sequences

    # =============================
    # SCAN FILES (FIXED)
    # =============================
    def scan_for_sprites(self):
        sprites = {}

        if not self.sprites_dir.exists():
            print("[WARNING] sprites folder not found")
            return sprites

        # 🔥 SCAN PNG LANGSUNG (INI FIX UTAMA)
        png_files = sorted(glob.glob(str(self.sprites_dir / "*.png")))

        for file in png_files:
            name = Path(file).stem.lower()
            sprites[name] = file

        return sprites

    # =============================
    # DETECT SPRITESHEET
    # =============================
    def detect_spritesheet(self, path):
        img = Image.open(path)
        total_w, total_h = img.size

        # cek JSON (optional)
        json_path = path.replace(".png", ".json")

        if os.path.exists(json_path):
            with open(json_path) as f:
                data = json.load(f)

            frame_w = data[0]["w"]
            frame_h = data[0]["h"]
            num_frames = len(data)

            return frame_w, frame_h, num_frames

        # 🔥 AUTO DETECT
        frame_h = total_h
        num_frames = total_w // frame_h

        if num_frames <= 0:
            num_frames = 1

        frame_w = total_w // num_frames

        return frame_w, frame_h, num_frames

    # =============================
    # BUILD CONFIG (ENHANCED)
    # =============================
    def get_animation_config(self):
        config = {}
        
        # 1. Load frame sequences FIRST (priority over spritesheet PNGs)
        frame_sequences = self.scan_frame_sequences()
        for name, frame_files in frame_sequences.items():
            config[name] = {
                "type": "sequence",
                "frames": frame_files,
                "fps": 7
            }
            print(f"[OK] {name}: FRAME SEQUENCE with {len(frame_files)} frames")
        
        # 2. Load individual spritesheet PNGs
        sprites = self.scan_for_sprites()
        for name, path in sprites.items():
            # Skip if already loaded as frame sequence
            if name in config:
                print(f"[SKIP] {name}: Already loaded as frame sequence")
                continue
            
            try:
                w, h, n = self.detect_spritesheet(path)

                config[name] = {
                    "path": path,
                    "frame_width": w,
                    "frame_height": h,
                    "num_frames": n,
                    "fps": 7,
                    "type": "spritesheet"
                }

                print(f"[OK] {name}: SPRITESHEET with {n} frames ({w}x{h})")

            except Exception as e:
                print(f"[ERROR] {name}:", e)

        return config


# =============================
# TEST
# =============================
if __name__ == "__main__":
    scanner = SpriteScanner("assets")
    config = scanner.get_animation_config()

    print("\n=== RESULT ===")
    for k, v in config.items():
        print(k, "=>", v)