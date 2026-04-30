#!/usr/bin/env python3
"""Test AI command parsing"""
from ai.ai_controller import AIController
import json

ai = AIController()

# Test cases
test_commands = [
    'buka chrome dan cari chatgpt',
    'buka youtube',
    'buka chatgpt.com',
    'buka chrome',
    'buka calculator',
]

print('Testing AI command parsing...\n')
for cmd in test_commands:
    print(f'Command: {cmd}')
    try:
        result = ai.process_command(cmd)
        intent = result.get('intent')
        response = result.get('response')
        actions = result.get('actions', [])
        
        print(f'Intent: {intent}')
        print(f'Response: {response}')
        print(f'Actions: {len(actions)} actions')
        for action in actions[:2]:
            action_name = action.get('action')
            delay_ms = action.get('delay_ms')
            print(f'  - {action_name} (delay: {delay_ms}ms)')
    except Exception as e:
        print(f'Error: {e}')
    print()
