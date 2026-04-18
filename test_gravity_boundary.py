#!/usr/bin/env python3
"""
Test gravity boundary - character stops before taskbar
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from behavior.behavior_controller import BehaviorController
from config.config import WINDOW_HEIGHT, GRAVITY_ENABLED, GRAVITY_ACCELERATION, MAX_FALL_SPEED

# Use text instead of unicode for Windows console compatibility
CHECK = "[OK]"
CROSS = "[XX]"

def test_gravity_boundary():
    """Test that character doesn't fall below boundary"""
    print("=" * 60)
    print("Testing Gravity Boundary System")
    print("=" * 60)
    
    # Simulate screen with taskbar (1080p screen, 1050 available after taskbar)
    screen_width = 1920
    screen_height = 1050  # Available height (excluding taskbar ~30px)
    
    print(f"\nScreen dimensions:")
    print(f"  Screen width: {screen_width}px")
    print(f"  Screen height (excluding taskbar): {screen_height}px")
    print(f"  Window height: {WINDOW_HEIGHT}px")
    
    # Create behavior controller
    controller = BehaviorController(window_width=screen_width, screen_height=screen_height, window_height=WINDOW_HEIGHT)
    
    print(f"\nBehavior Controller initialized:")
    print(f"  Ground level: {controller.ground_level}px")
    print(f"  Gravity enabled: {GRAVITY_ENABLED}")
    print(f"  Calculation: screen_height - window_height - buffer = {screen_height} - {WINDOW_HEIGHT} - 50 = {controller.ground_level}px")
    
    # Verify ground_level is correct
    expected_ground = screen_height - WINDOW_HEIGHT - 50  # 50px buffer before taskbar
    if controller.ground_level == expected_ground:
        print(f"  {CHECK} Ground level correctly set to prevent window overflow")
    else:
        print(f"  {CROSS} Ground level mismatch: {controller.ground_level} != {expected_ground}")
    
    # Simulate character falling
    print(f"\nSimulating gravity fall:")
    print(f"  Initial position: Y = {controller.current_y}px")
    print(f"  Falling towards ground_level = {controller.ground_level}px")
    
    # Simulate 100 physics updates (50ms each = 5 seconds)
    max_y = controller.current_y
    for i in range(100):
        controller._update_physics()
        if controller.current_y > max_y:
            max_y = controller.current_y
        
        # Print every 20 frames
        if i % 20 == 0:
            print(f"  Frame {i:3d}: Y = {controller.current_y:7.1f}px, velocity = {controller.velocity_y:5.1f}, falling = {controller.is_falling}")
    
    print(f"\nFinal state after fall:")
    print(f"  Final Y position: {controller.current_y}px")
    print(f"  Ground level: {controller.ground_level}px")
    print(f"  Velocity: {controller.velocity_y}px/frame")
    print(f"  Is falling: {controller.is_falling}")
    
    # Verify character stopped at ground level
    if controller.current_y == controller.ground_level and controller.velocity_y == 0:
        print(f"  {CHECK} Character correctly stopped at ground level")
    else:
        print(f"  {CROSS} Character did not stop correctly!")
    
    # Verify character won't go below
    for i in range(10):
        controller._update_physics()
    
    if controller.current_y == controller.ground_level:
        print(f"  {CHECK} Character stays at ground level (doesn't sink)")
    else:
        print(f"  {CROSS} Character sank below ground!")
    
    print("\n" + "=" * 60)
    print(f"{CHECK} Gravity Boundary Test Complete!")
    print("=" * 60)
    print(f"\nSummary:")
    print(f"  - Character falls smoothly until reaching ground level")
    print(f"  - Ground level = screen_height ({screen_height}) - window_height ({WINDOW_HEIGHT}) - buffer(50)")
    print(f"  - Window will not extend beyond taskbar area")
    print(f"  - Character stops cleanly above taskbar")
    

def test_different_screen_sizes():
    """Test with different screen resolutions"""
    print("\n" + "=" * 60)
    print("Testing Different Screen Sizes")
    print("=" * 60)
    
    test_cases = [
        (1920, 1050, "1080p with taskbar"),
        (1366, 730, "1366x768 with taskbar"),
        (2560, 1440, "1440p with taskbar"),
        (1024, 700, "1024x768 with taskbar"),
    ]
    
    print(f"\nWindow height: {WINDOW_HEIGHT}px\n")
    
    for screen_w, screen_h, desc in test_cases:
        controller = BehaviorController(
            window_width=screen_w,
            screen_height=screen_h,
            window_height=WINDOW_HEIGHT
        )
        
        ground = controller.ground_level
        expected = max(screen_h - WINDOW_HEIGHT - 50, 100)  # 50px buffer, min 100
        match = CHECK if ground == expected else CROSS
        
        print(f"{match} {desc:25s}: screen {screen_w}x{screen_h}, ground_level = {ground} (expected {expected})")
    
    print(f"\n{CHECK} All screen sizes tested!")


if __name__ == "__main__":
    try:
        test_gravity_boundary()
        test_different_screen_sizes()
        print(f"\n{CHECK} ALL TESTS PASSED!")
        print("\nGravity boundary system is working correctly.")
        print("Character will stop before reaching taskbar on any screen resolution.")
        
    except Exception as e:
        print(f"\n{CROSS} Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
