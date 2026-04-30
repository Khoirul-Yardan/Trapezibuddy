#!/usr/bin/env python3
"""
Test script for new features:
1. Improved Word opening and typing
2. Web browsing (ChatGPT, Google, YouTube, etc)
3. Enhanced AI command parsing
"""

import sys
import os
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai.ai_controller import AIController
from system.action_executor import ActionExecutor
from utils.logger import setup_logger

logger = setup_logger(__name__)


def test_ai_command_parsing():
    """Test AI command parsing for new features"""
    print("\n" + "="*60)
    print("TEST 1: AI Command Parsing for Word + Resume")
    print("="*60)
    
    ai = AIController()
    
    # Test various commands
    test_commands = [
        "buatkan saya resume tentang dijkstra algorithm di word",
        "buka word dan ketik resume saya",
        "buka chatgpt dan tanyakan tentang dijkstra",
        "buka google dan cari tutorial python",
        "cari tutorial unity di youtube",
        "buka wikipedia dan cari informasi tentang machine learning",
    ]
    
    for cmd in test_commands:
        print(f"\n[CMD] {cmd}")
        result = ai.process_command(cmd)
        
        print(f"[INTENT] {result.get('intent', 'N/A')}")
        print(f"[ACTIONS] {len(result.get('actions', []))} action(s)")
        
        for i, action in enumerate(result.get('actions', []), 1):
            print(f"  {i}. {action.get('action')} (delay: {action.get('delay_ms')}ms)")
            if action.get('parameters'):
                for k, v in action.get('parameters').items():
                    print(f"     - {k}: {v}")
        
        print(f"[RESPONSE] {result.get('response', 'N/A')[:100]}...")


def test_action_executor():
    """Test ActionExecutor new methods"""
    print("\n" + "="*60)
    print("TEST 2: ActionExecutor - Available Actions")
    print("="*60)
    
    executor = ActionExecutor()
    actions = executor.get_available_actions()
    
    print(f"\nTotal available actions: {len(actions)}")
    
    # Group actions by category
    categories = {
        "Word/Office": ["open_word", "open_word_blank", "open_excel", "open_powerpoint", "fill_resume"],
        "Web": ["open_browser", "open_website", "search_on_website", "open_chrome"],
        "System": ["mouse_click", "mouse_move", "press_key", "type_text"],
        "Window": ["maximize_window", "minimize_window", "close_window"],
        "File": ["create_folder", "create_file", "open_folder"],
        "Character": ["say_text", "move_character"],
    }
    
    for category, action_list in categories.items():
        available = [a for a in action_list if a in actions]
        print(f"\n{category}:")
        for action in available:
            print(f"  ✓ {action}")


def demonstrate_usage():
    """Demonstrate usage examples"""
    print("\n" + "="*60)
    print("USAGE EXAMPLES")
    print("="*60)
    
    examples = [
        {
            "title": "Open Word and Create Resume",
            "command": "buatkan saya resume tentang software development di word",
            "what_happens": "- Opens Microsoft Word with blank document\n- Handles Backstage screen automatically\n- Types a formatted resume"
        },
        {
            "title": "Open ChatGPT and Ask Question",
            "command": "buka chatgpt dan tanyakan tentang dijkstra algorithm",
            "what_happens": "- Opens ChatGPT website\n- Finds the message input box\n- Types your question\n- Sends the message"
        },
        {
            "title": "Search on YouTube",
            "command": "cari tutorial animasi 3d di youtube",
            "what_happens": "- Opens YouTube website\n- Finds the search box\n- Types your search query\n- Presses Enter to search"
        },
        {
            "title": "Google Search",
            "command": "buka google dan cari cara membuat game dengan unity",
            "what_happens": "- Opens Google Search\n- Clicks the search box\n- Types your search query\n- Presses Enter"
        },
        {
            "title": "Wikipedia Search",
            "command": "buka wikipedia dan cari tentang machine learning",
            "what_happens": "- Opens Wikipedia\n- Clicks the search box\n- Types your search query\n- Searches for the topic"
        },
    ]
    
    for i, example in enumerate(examples, 1):
        print(f"\n{i}. {example['title']}")
        print(f"   Command: {example['command']}")
        print(f"   What happens:")
        for line in example['what_happens'].split('\n'):
            print(f"   {line}")


def show_supported_websites():
    """Show list of supported websites"""
    print("\n" + "="*60)
    print("SUPPORTED WEBSITES")
    print("="*60)
    
    websites = {
        "Search Engines": ["google", "bing"],
        "AI/Coding": ["chatgpt", "github", "stackoverflow"],
        "Video/Social": ["youtube", "reddit", "twitter", "instagram", "facebook"],
        "Email": ["gmail", "outlook"],
        "Reference": ["wikipedia"],
        "E-commerce": ["amazon", "ebay"],
        "Professional": ["linkedin"],
    }
    
    for category, site_list in websites.items():
        print(f"\n{category}:")
        for site in site_list:
            print(f"  • {site}")


def test_word_operations():
    """Demonstrate Word operations (with confirmation)"""
    print("\n" + "="*60)
    print("TEST 3: Word Operations (Optional - Requires Confirmation)")
    print("="*60)
    
    response = input("\nDo you want to test Word operations? (y/n): ").lower().strip()
    
    if response != 'y':
        print("Skipped Word operations test")
        return
    
    executor = ActionExecutor()
    
    print("\n1. Testing: open_word_blank()")
    print("   This will open Microsoft Word with a blank document...")
    response = input("   Continue? (y/n): ").lower().strip()
    
    if response == 'y':
        print("   Opening Word... (this takes a few seconds)")
        executor.open_word_blank(wait_time=4)
        print("   [OK] Word should now be open with blank document ready for typing")
    
    print("\n2. Testing: type_text() - Resume Content")
    print("   This will type a sample resume...")
    response = input("   Continue? (y/n): ").lower().strip()
    
    if response == 'y':
        time.sleep(1)
        executor.type_text(text="RESUME\n\nName: John Doe\nEmail: john@example.com\nPhone: 0812-345-6789")
        print("   [OK] Resume text typed")


def main():
    """Main test function"""
    print("\n" + "="*70)
    print("DESKTOP ASSISTANT - NEW FEATURES TEST (April 29, 2026)")
    print("="*70)
    
    print("\nNEW FEATURES:")
    print("1. ✓ Improved Word opening with Backstage screen handling")
    print("2. ✓ New open_word_blank() action for better document creation")
    print("3. ✓ open_website() - Open popular websites by name")
    print("4. ✓ search_on_website() - Open website and search/chat")
    print("5. ✓ Support for ChatGPT, Google, YouTube, Wikipedia, Stack Overflow, etc.")
    print("6. ✓ Enhanced AI system prompt with new action documentation")
    
    # Run tests
    test_action_executor()
    show_supported_websites()
    demonstrate_usage()
    test_ai_command_parsing()
    test_word_operations()
    
    print("\n" + "="*70)
    print("TESTING COMPLETE")
    print("="*70)
    print("\nTo use the new features:")
    print("1. Run the main application: python main.py")
    print("2. Open the chat panel (Hotkey: B)")
    print("3. Try these commands:")
    print("   - 'buka word dan buatkan resume'")
    print("   - 'buka chatgpt dan tanyakan tentang dijkstra'")
    print("   - 'cari tutorial python di youtube'")
    print("   - 'buka google dan cari unity game development'")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"Error during testing: {e}")
        print(f"\n[ERROR] {e}")
        sys.exit(1)
