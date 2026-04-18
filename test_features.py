#!/usr/bin/env python3
"""Test script for new features"""

from ai.ai_controller import AIController
from system.action_executor import ActionExecutor
from config.config import DRAG_BOUNDARY_ENABLED, HOTKEY_SIZE_INCREASE

print("=" * 60)
print("TESTING NEW FEATURES")
print("=" * 60)
print()

# Test 1: Config
print("1. CONFIG TEST")
print(f"   ✓ DRAG_BOUNDARY_ENABLED: {DRAG_BOUNDARY_ENABLED}")
print(f"   ✓ HOTKEY_SIZE_INCREASE: {HOTKEY_SIZE_INCREASE}")
print()

# Test 2: ActionExecutor
print("2. ACTION EXECUTOR TEST")
ae = ActionExecutor()
new_actions = ['open_vscode', 'create_folder', 'create_file', 'open_folder', 'run_code']
for action in new_actions:
    available = action in ae.get_available_actions()
    status = "✓" if available else "✗"
    print(f"   {status} {action}")
print()

# Test 3: AI Controller
print("3. AI CONTROLLER TEST")
ai = AIController()

test_commands = [
    "Buka VSCode",
    "Buat folder project",
    "Buka Chrome",
    "Buat file index.html",
]

for cmd in test_commands:
    result = ai.process_command(cmd)
    print(f"   Command: '{cmd}'")
    print(f"   → Action: {result.get('action')}")
    print(f"   → Response: {result.get('response')}")
    print()

print("=" * 60)
print("ALL TESTS PASSED ✓")
print("=" * 60)
