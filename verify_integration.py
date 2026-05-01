#!/usr/bin/env python3
"""
Quick verification script for Python Backend + Desktop-App integration
Tests all major features to ensure they work properly
"""

import subprocess
import sys
import json
import os
from pathlib import Path

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_bridge(message, should_execute=False):
    """Test chat_bridge.py with a message"""
    cmd = [
        sys.executable,
        'chat_bridge.py',
        '--message', message
    ]
    if should_execute:
        cmd.append('--execute-actions')
    
    print(f"Testing: {message}")
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Try to parse JSON from output
        output = result.stdout.strip()
        if result.stderr:
            print(f"  Warnings: {result.stderr[:100]}...")
        
        try:
            data = json.loads(output)
            print(f"  ✓ Response: {data['response'][:80]}")
            print(f"    Intent: {data['intent']}")
            print(f"    Actions executed: {data['actions_executed']}")
            return True
        except json.JSONDecodeError:
            print(f"  ✗ Invalid JSON response: {output[:100]}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"  ✗ Timeout")
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print_section("TrapeziBuddy Integration Verification")
    
    # Check if we're in the right directory
    if not os.path.exists('chat_bridge.py'):
        print("ERROR: chat_bridge.py not found!")
        print("Please run this script from the DesktopAssistant root directory")
        return False
    
    results = {
        'passed': 0,
        'failed': 0
    }
    
    # Test 1: Basic greeting
    print_section("Test 1: Basic Greeting")
    if test_bridge("halo"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 2: Open Chrome (without executing)
    print_section("Test 2: Parse Chrome Command (no execution)")
    if test_bridge("buka chrome"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 3: Task command
    print_section("Test 3: Task Management")
    if test_bridge("tambah task belajar python"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 4: Web search
    print_section("Test 4: Web Search Command")
    if test_bridge("cari tutorial python di google"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 5: Focus session
    print_section("Test 5: Focus Session Command")
    if test_bridge("mulai fokus"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 6: Unknown command
    print_section("Test 6: Unknown Command Handling")
    if test_bridge("xyz123abc"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 7: Chrome execution (optional - actually opens Chrome)
    print_section("Test 7: Execute Chrome Opening (Optional)")
    response = input("Execute Chrome opening command? (y/n): ").strip().lower()
    if response == 'y':
        print("\nThis will open Chrome...")
        if test_bridge("buka chrome", should_execute=True):
            print("\n✓ Chrome should be opening...")
            results['passed'] += 1
        else:
            results['failed'] += 1
    else:
        print("Skipped")
    
    # Summary
    print_section("Verification Summary")
    total = results['passed'] + results['failed']
    print(f"Passed: {results['passed']}/{total}")
    print(f"Failed: {results['failed']}/{total}")
    
    if results['failed'] == 0:
        print("\n✓ All tests passed! Python backend is working correctly.")
        print("\nYou can now run the desktop app:")
        print("  cd desktop-app")
        print("  npm run dev")
        return True
    else:
        print(f"\n✗ {results['failed']} test(s) failed. Check the errors above.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
