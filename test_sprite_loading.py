#!/usr/bin/env python3
"""
Test script to verify sprite loading from assets
"""

import sys
import os

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from utils.logger import setup_logger
from utils.asset_generator import get_sprite_config, load_frame_sequence_from_folder
from config.config import ASSETS_DIR

logger = setup_logger(__name__)

def test_sprite_loading():
    """Test that sprites load correctly"""
    
    print("\n" + "="*60)
    print("SPRITE LOADING TEST")
    print("="*60 + "\n")
    
    # Test 1: Check if assets folder exists
    print(f"✓ Checking assets folder: {ASSETS_DIR}")
    sprite_sheets_dir = os.path.join(ASSETS_DIR, "Sprite Sheet Contents")
    print(f"  Sprite sheets dir: {sprite_sheets_dir}")
    print(f"  Exists: {os.path.exists(sprite_sheets_dir)}")
    
    if os.path.exists(sprite_sheets_dir):
        # List available emotion folders
        print(f"\n✓ Available emotion folders:")
        folders = os.listdir(sprite_sheets_dir)
        for folder in sorted(folders):
            folder_path = os.path.join(sprite_sheets_dir, folder)
            if os.path.isdir(folder_path):
                frame_count = len([f for f in os.listdir(folder_path) 
                                   if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
                print(f"  - {folder}: {frame_count} frames")
    
    # Test 2: Load sprite config
    print(f"\n✓ Loading sprite config...")
    config = get_sprite_config()
    
    print(f"\n✓ Loaded {len(config)} animation states:")
    for state_name, state_config in sorted(config.items()):
        state_type = state_config.get('type', 'unknown')
        if state_type == 'sequence':
            frames_count = len(state_config.get('frames', []))
            fps = state_config.get('fps', 0)
            print(f"  - {state_name}: {frames_count} frames at {fps} fps ({state_type})")
        else:
            print(f"  - {state_name}: {state_type}")
    
    # Test 3: Check if minimum required states exist
    print(f"\n✓ Checking required animation states:")
    required_states = ['idle', 'walk_left', 'walk_right', 'interact']
    for state in required_states:
        exists = state in config
        print(f"  - {state}: {'✓' if exists else '✗'}")
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_sprite_loading()
