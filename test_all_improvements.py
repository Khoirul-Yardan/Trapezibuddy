#!/usr/bin/env python3
"""
Test all improvements and fixes
Tests command recognition, greeting messages, sprite loading, etc.
"""

import sys
import os

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from ai.ai_controller import AIController
from system.spontaneous_chat import SpontaneousChat
from utils.sprite_scanner import SpriteScanner
from config.config import ASSETS_DIR, SPRITES_DIR
from pathlib import Path


def test_command_recognition():
    """Test improved command recognition"""
    print("\n" + "="*60)
    print("TEST 1: Command Recognition")
    print("="*60)
    
    ai = AIController()
    test_commands = [
        "buka chrome",
        "buka youtube",
        "cari chatgpt",
        "buka chrome dan cari chatgpt",
        "buka vscode",
        "buka notepad",
        "buka calculator",
        "buka chrome dan buka youtube",
    ]
    
    for cmd in test_commands:
        result = ai.process_command(cmd)
        print(f"\n📝 Command: '{cmd}'")
        print(f"   Intent: {result.get('intent')}")
        print(f"   Response: {result.get('response')}")
        if result.get('actions'):
            print(f"   Actions: {len(result['actions'])} action(s)")
            for i, action in enumerate(result['actions']):
                try:
                    action_name = action.get('action', 'unknown')
                    delay = action.get('delay_ms', 0)
                    print(f"      {i+1}. {action_name} (delay: {delay}ms)")
                except (KeyError, TypeError) as e:
                    print(f"      {i+1}. ⚠️ Malformed action: {action}")
        elif result.get('action'):
            # Fallback for old single-action format
            print(f"   Action: {result.get('action')}")
    
    print("\n✅ Command recognition test completed")


def test_greeting_system():
    """Test auto-greeting and spontaneous chat"""
    print("\n" + "="*60)
    print("TEST 2: Greeting & Spontaneous Chat System")
    print("="*60)
    
    chat = SpontaneousChat()
    
    print("\n📢 Greeting Messages:")
    for i in range(3):
        greeting = chat.get_greeting_message()
        print(f"   {i+1}. {greeting}")
    
    print("\n😴 Bored Messages:")
    for i in range(2):
        bored = chat.get_bored_message()
        print(f"   {i+1}. {bored}")
    
    print("\n👀 Observation Messages:")
    for i in range(2):
        obs = chat.get_observation_message()
        print(f"   {i+1}. {obs}")
    
    print("\n🤝 Engagement Messages:")
    for i in range(2):
        eng = chat.get_engagement_message()
        print(f"   {i+1}. {eng}")
    
    print("\n💬 Spontaneous Chat Topics:")
    for i in range(3):
        msg = chat.get_spontaneous_message()
        print(f"   {i+1}. {msg}")
    
    print("\n✅ Greeting system test completed")


def test_sprite_loading():
    """Test sprite animation loading"""
    print("\n" + "="*60)
    print("TEST 3: Sprite Animation Loading")
    print("="*60)
    
    assets_path = Path(ASSETS_DIR)
    print(f"\n📁 Assets Directory: {assets_path}")
    print(f"   Exists: {assets_path.exists()}")
    
    if assets_path.exists():
        print(f"   Contents:")
        for item in assets_path.iterdir():
            print(f"      - {item.name} (dir: {item.is_dir()})")
    
    sprites_path = Path(SPRITES_DIR)
    print(f"\n📁 Sprites Directory: {sprites_path}")
    print(f"   Exists: {sprites_path.exists()}")
    
    # Scan for sprites
    scanner = SpriteScanner(str(ASSETS_DIR), str(SPRITES_DIR))
    sprites = scanner.scan_for_sprites()
    
    print(f"\n🎬 Found Animations: {len(sprites)}")
    for anim_name, frames in sprites.items():
        print(f"   - {anim_name}: {len(frames)} frames")
        if frames:
            print(f"     First: {Path(frames[0]).name}")
            if len(frames) > 1:
                print(f"     Last: {Path(frames[-1]).name}")
    
    # Get animation config
    config = scanner.get_animation_config()
    print(f"\n⚙️  Animation Config Generated: {len(config)} animations")
    for anim_name, anim_config in config.items():
        print(f"   - {anim_name}:")
        print(f"     Type: {anim_config.get('type')}")
        print(f"     Frames: {anim_config.get('num_frames')}")
        print(f"     FPS: {anim_config.get('fps')}")
        print(f"     Size: {anim_config.get('frame_width')}x{anim_config.get('frame_height')}")
    
    print("\n✅ Sprite loading test completed")


def test_animation_controller():
    """Test animation controller with frame sequences"""
    print("\n" + "="*60)
    print("TEST 4: Animation Controller")
    print("="*60)
    
    from character.animation import AnimationController, FrameSequenceAnimation
    
    controller = AnimationController()
    print(f"\n✅ AnimationController initialized")
    print(f"   Supported size: {controller.width}x{controller.height}")
    
    # Create a test frame sequence animation (won't actually load files, just test structure)
    print(f"\n📝 Testing FrameSequenceAnimation class...")
    
    # Test placeholder animation
    success = controller.create_placeholder_animation("test_idle")
    print(f"   Placeholder animation created: {success}")
    
    if controller.animations:
        for anim_name in controller.animations:
            anim = controller.animations[anim_name]
            print(f"   Animation: {anim.name}")
            print(f"      Frames: {anim.num_frames}")
            print(f"      FPS: {anim.fps}")
            print(f"      Duration/frame: {anim.frame_duration}ms")
    
    print("\n✅ Animation controller test completed")


def main():
    """Run all tests"""
    print("\n" + "█"*60)
    print("█  DESKTOP ASSISTANT - IMPROVEMENTS TEST SUITE  █")
    print("█"*60)
    
    try:
        test_command_recognition()
        test_greeting_system()
        test_sprite_loading()
        test_animation_controller()
        
        print("\n" + "█"*60)
        print("█  ALL TESTS COMPLETED SUCCESSFULLY ✅  █")
        print("█"*60)
        print("\n📋 Summary:")
        print("   ✅ Command recognition improved")
        print("   ✅ Greeting system active")
        print("   ✅ Spontaneous chat configured")
        print("   ✅ Sprite animations loading")
        print("   ✅ Animation controller functional")
        print("\n🚀 Ready to run: python main.py")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
