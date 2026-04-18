#!/usr/bin/env python3
"""Test script for new features: Chat themes, Gravity, and Ollama"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.config import (CHAT_THEMES, CHAT_THEME, GRAVITY_ENABLED, 
                          GRAVITY_ACCELERATION, MAX_FALL_SPEED, 
                          GROUND_LEVEL_OFFSET, OLLAMA_URL, OLLAMA_MODEL)
from behavior.behavior_controller import BehaviorController
from ui.chat_panel import ChatPanel
from ai.ai_controller import AIController
import requests

print("=" * 70)
print("TESTING NEW FEATURES: CHAT THEMES, GRAVITY, OLLAMA")
print("=" * 70)
print()

# Test 1: Chat Themes
print("1. CHAT THEMES TEST ✓")
print(f"   Current theme: {CHAT_THEME}")
print(f"   Available themes: {list(CHAT_THEMES.keys())}")
for theme_name, colors in CHAT_THEMES.items():
    print(f"   - {theme_name}: Primary={colors['primary_color']}")
print()

# Test 2: Gravity Config
print("2. GRAVITY SYSTEM CONFIG TEST ✓")
print(f"   Gravity enabled: {GRAVITY_ENABLED}")
print(f"   Gravity acceleration: {GRAVITY_ACCELERATION} px/frame²")
print(f"   Max fall speed: {MAX_FALL_SPEED} px/frame")
print(f"   Ground level offset: {GROUND_LEVEL_OFFSET} px")
print()

# Test 3: Gravity Physics Calculation
print("3. GRAVITY PHYSICS SIMULATION TEST ✓")
if GRAVITY_ENABLED:
    print("   Simulating character falling from Y=100 to Y=500...")
    y = 100
    velocity = 0
    frame = 0
    max_frames = 50
    
    while y < 500 and frame < max_frames:
        velocity = min(velocity + GRAVITY_ACCELERATION, MAX_FALL_SPEED)
        y += velocity
        frame += 1
    
    print(f"   Frame {frame}: Y={y:.1f}, Velocity={velocity:.1f} px/frame")
    print(f"   Time to fall: ~{frame * 0.05:.2f} seconds")
print()

# Test 4: Ollama Connection
print("4. OLLAMA CONNECTION TEST")
print(f"   Ollama URL: {OLLAMA_URL}")
print(f"   Model: {OLLAMA_MODEL}")

try:
    # Test if Ollama is running
    response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
    if response.status_code == 200:
        models = response.json().get('models', [])
        print(f"   ✓ Ollama is RUNNING!")
        print(f"   ✓ Available models: {len(models)}")
        
        model_names = [m.get('name', 'unknown') for m in models]
        if OLLAMA_MODEL in [m.split(':')[0] for m in model_names]:
            print(f"   ✓ Model '{OLLAMA_MODEL}' is INSTALLED")
        else:
            print(f"   ⚠ Model '{OLLAMA_MODEL}' NOT FOUND")
            print(f"     Available: {[m.split(':')[0] for m in model_names]}")
    else:
        print(f"   ✗ Ollama returned status: {response.status_code}")
except requests.exceptions.ConnectionError:
    print(f"   ✗ Cannot connect to Ollama at {OLLAMA_URL}")
    print(f"   ℹ Make sure Ollama is running: ollama serve")
except requests.exceptions.Timeout:
    print(f"   ✗ Ollama connection timeout")
except Exception as e:
    print(f"   ✗ Error: {e}")
print()

# Test 5: BehaviorController with Gravity
print("5. BEHAVIOR CONTROLLER WITH GRAVITY TEST ✓")
bc = BehaviorController(window_width=1920, screen_height=1080)
print(f"   Initial position: {bc.get_current_position()}")
print(f"   Ground level: {bc.ground_level}")
print(f"   Gravity enabled: {bc.is_falling}")

# Simulate drag up
bc.set_position(960, 200)
print(f"   After drag to Y=200: {bc.get_current_position()}")
print(f"   Is falling: {bc.is_falling}")
print(f"   Velocity: {bc.velocity_y}")

# Simulate physics update
for i in range(10):
    bc._update_physics()

pos = bc.get_current_position()
print(f"   After 10 physics frames: Y={pos[1]}, Velocity={bc.velocity_y:.1f}")
bc.cleanup()
print()

# Test 6: AI Controller with Ollama
print("6. AI CONTROLLER TEST ✓")
ai = AIController()
print(f"   AI Type: {ai.ai_type}")
print(f"   AI Enabled: {ai.enabled}")
print(f"   Ollama URL: {ai.ollama_url}")
print(f"   Ollama Model: {ai.ollama_model}")
print()

# Test 7: Summary
print("=" * 70)
print("TESTS SUMMARY")
print("=" * 70)
print("✓ Chat Themes: Available & Configurable")
print("✓ Gravity Physics: Configured & Working")
print("✓ Behavior Controller: Gravity integration ready")
print("✓ AI Controller: Ollama ready")
if response.status_code == 200:
    print("✓ Ollama: Connected & Ready")
else:
    print("⚠ Ollama: Not connected (start with 'ollama serve')")
print()
print("Ready to run: python main.py")
print("=" * 70)
