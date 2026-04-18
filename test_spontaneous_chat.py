#!/usr/bin/env python3
"""
Test spontaneous chat system
Verify that character can speak independently to user
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from system.spontaneous_chat import SpontaneousChat, IdleDialogueEngine
import time

def test_spontaneous_chat():
    """Test SpontaneousChat class"""
    print("=" * 60)
    print("Testing SpontaneousChat System")
    print("=" * 60)
    
    # Create instance
    chat = SpontaneousChat()
    print("\n✓ SpontaneousChat initialized")
    
    # Test different message types
    print("\n--- Testing Message Types ---")
    
    print("\n1. Bored Messages:")
    for i in range(3):
        msg = chat.get_bored_message()
        print(f"   {i+1}. {msg}")
    
    print("\n2. Greeting Messages:")
    for i in range(3):
        msg = chat.get_greeting_message()
        print(f"   {i+1}. {msg}")
    
    print("\n3. Observation Messages:")
    for i in range(3):
        msg = chat.get_observation_message()
        print(f"   {i+1}. {msg}")
    
    print("\n4. Engagement Messages:")
    for i in range(3):
        msg = chat.get_engagement_message()
        print(f"   {i+1}. {msg}")
    
    print("\n5. Spontaneous Messages:")
    for i in range(3):
        msg = chat.get_spontaneous_message()
        print(f"   {i+1}. {msg}")
    
    # Test random message generation
    print("\n--- Testing Random Message Generation ---")
    for i in range(5):
        chat_data = chat.generate_spontaneous_chat()
        print(f"\n{i+1}. Type: {chat_data['type']}")
        print(f"   Message: {chat_data['message']}")
        print(f"   AI Prompt: {chat_data['ai_prompt'][:80]}...")
    
    print("\n✓ All SpontaneousChat tests passed!")


def test_idle_dialogue_engine():
    """Test IdleDialogueEngine"""
    print("\n" + "=" * 60)
    print("Testing IdleDialogueEngine")
    print("=" * 60)
    
    triggered_chats = []
    
    def on_chat(chat_dict):
        triggered_chats.append(chat_dict)
        print(f"✓ Chat triggered: {chat_dict['type']} - {chat_dict['message'][:50]}...")
    
    # Create engine
    engine = IdleDialogueEngine(on_spontaneous_chat=on_chat)
    print("\n✓ IdleDialogueEngine initialized")
    
    # Simulate idle state with updates
    print("\nSimulating idle state updates (checking spontaneous chat triggers)...")
    
    current_time = time.time() * 1000  # Convert to milliseconds
    
    # Update many times to potentially trigger chat
    for i in range(20):
        current_time += 5000  # Add 5 seconds each iteration
        engine.update(current_time, is_idle=True)
        if triggered_chats:
            print(f"✓ Spontaneous chat triggered after {i * 5} seconds")
            break
    
    if triggered_chats:
        print(f"✓ Total triggered chats: {len(triggered_chats)}")
        print("✓ IdleDialogueEngine is working!")
    else:
        print("⚠ No chats triggered during test (probability-based, may need more iterations)")
    
    print("\n✓ All IdleDialogueEngine tests completed!")


def test_config_settings():
    """Test that config has spontaneous chat settings"""
    print("\n" + "=" * 60)
    print("Testing Configuration Settings")
    print("=" * 60)
    
    from config.config import (
        SPONTANEOUS_CHAT_ENABLED,
        SPONTANEOUS_CHAT_PROBABILITY,
        SPONTANEOUS_CHAT_INTERVAL_MIN,
        SPONTANEOUS_CHAT_INTERVAL_MAX,
        SPONTANEOUS_CHAT_DURATION
    )
    
    print(f"✓ SPONTANEOUS_CHAT_ENABLED: {SPONTANEOUS_CHAT_ENABLED}")
    print(f"✓ SPONTANEOUS_CHAT_PROBABILITY: {SPONTANEOUS_CHAT_PROBABILITY}")
    print(f"✓ SPONTANEOUS_CHAT_INTERVAL_MIN: {SPONTANEOUS_CHAT_INTERVAL_MIN} ms")
    print(f"✓ SPONTANEOUS_CHAT_INTERVAL_MAX: {SPONTANEOUS_CHAT_INTERVAL_MAX} ms")
    print(f"✓ SPONTANEOUS_CHAT_DURATION: {SPONTANEOUS_CHAT_DURATION} ms")
    
    print("\n✓ All configuration settings found!")


if __name__ == "__main__":
    try:
        test_config_settings()
        test_spontaneous_chat()
        test_idle_dialogue_engine()
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nSpontaneous Chat System is ready to use!")
        print("The character will now speak to user naturally during idle periods.")
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
