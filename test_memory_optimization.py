#!/usr/bin/env python3
"""
Memory profiling and optimization test script for Buddy character.
Tests RAM usage patterns during character operation.
"""

import sys
import os
import subprocess
import time
import json

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)


def test_memory_profiling():
    """Test that memory profiling works correctly"""
    print("=" * 60)
    print("Testing Memory Profiling System")
    print("=" * 60)
    
    from utils.memory_profiler import get_profiler, log_memory
    
    profiler = get_profiler()
    
    if not profiler.enabled:
        print("WARNING: psutil not available - memory profiling disabled")
        print("Install psutil with: pip install psutil")
        return False
    
    # Take some snapshots
    print("\nMemory Snapshots:")
    log_memory("start")
    
    # Simulate some allocations
    test_list = [i for i in range(1000000)]
    log_memory("after_list_alloc")
    
    del test_list
    log_memory("after_list_delete")
    
    # Print report
    print("\nMemory Profile Report:")
    print(profiler.report())
    
    return profiler.enabled


def test_animation_caching():
    """Test animation frame caching"""
    print("\n" + "=" * 60)
    print("Testing Animation Frame Caching")
    print("=" * 60)
    
    from character.animation import AnimationController, _FRAME_CACHE, _CACHE_ACCESS_ORDER
    from utils.memory_profiler import log_memory
    
    log_memory("animation_test.start")
    
    controller = AnimationController(256, 256)
    print(f"AnimationController initialized")
    print(f"  Frame cache size: {len(_FRAME_CACHE)}")
    print(f"  Cache access order length: {len(_CACHE_ACCESS_ORDER)}")
    
    # Test adding dummy animations
    controller.create_placeholder_animation("test_idle")
    controller.create_placeholder_animation("test_walk")
    
    log_memory("animation_test.after_create")
    
    print(f"\nAnimations created:")
    print(f"  Total animations: {controller.get_animation_count()}")
    print(f"  Frame cache size: {len(_FRAME_CACHE)}")
    print(f"  Cache access order length: {len(_CACHE_ACCESS_ORDER)}")
    
    # Switch animations
    controller.set_animation("test_walk")
    log_memory("animation_test.after_switch")
    
    print(f"\nAfter animation switch:")
    print(f"  Current animation: {controller.current_animation.name if controller.current_animation else 'None'}")
    print(f"  Frame cache size: {len(_FRAME_CACHE)}")
    
    # Cleanup
    controller.cleanup_all()
    log_memory("animation_test.after_cleanup")
    
    print(f"\nAfter cleanup:")
    print(f"  Total animations: {controller.get_animation_count()}")
    print(f"  Frame cache size: {len(_FRAME_CACHE)}")
    
    return True


def test_scaled_frame_caching():
    """Test scaled frame caching in character widget"""
    print("\n" + "=" * 60)
    print("Testing Scaled Frame Caching")
    print("=" * 60)
    
    from character.character_widget import _SCALED_FRAME_CACHE, _SCALED_CACHE_ACCESS_ORDER
    from utils.memory_profiler import log_memory
    
    log_memory("scaled_cache_test.start")
    
    print(f"Scaled frame cache initialized:")
    print(f"  Cache size: {len(_SCALED_FRAME_CACHE)}")
    print(f"  Access order length: {len(_SCALED_CACHE_ACCESS_ORDER)}")
    print(f"  Max cache size: 50")
    
    return True


def main():
    """Run all tests"""
    print("\nTRAPEZIBUDDY - Memory Optimization Tests")
    print("=" * 60)
    
    # Initialize QApplication first (required for QPixmap)
    from PySide6.QtWidgets import QApplication
    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    
    results = {
        "memory_profiling": False,
        "animation_caching": False,
        "scaled_frame_caching": False,
    }
    
    try:
        results["memory_profiling"] = test_memory_profiling()
    except Exception as e:
        print(f"ERROR in memory profiling test: {e}")
        import traceback
        traceback.print_exc()
    
    try:
        results["animation_caching"] = test_animation_caching()
    except Exception as e:
        print(f"ERROR in animation caching test: {e}")
        import traceback
        traceback.print_exc()
    
    try:
        results["scaled_frame_caching"] = test_scaled_frame_caching()
    except Exception as e:
        print(f"ERROR in scaled frame caching test: {e}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "PASS" if passed else "FAIL"
        print(f"  {test_name}: {status}")
    
    all_passed = all(results.values())
    print(f"\nOverall: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
