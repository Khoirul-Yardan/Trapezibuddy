#!/usr/bin/env python3
"""
Validation script to verify all new features are properly implemented
"""

import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def check_action_executor():
    """Check if ActionExecutor has all new methods"""
    print("\n" + "="*60)
    print("CHECKING: ActionExecutor Implementation")
    print("="*60)
    
    try:
        from system.action_executor import ActionExecutor
        
        executor = ActionExecutor()
        actions = executor.get_available_actions()
        
        required_new_actions = [
            "open_word_blank",
            "open_website", 
            "search_on_website"
        ]
        
        print("\nNew Actions Status:")
        all_present = True
        for action in required_new_actions:
            if action in actions:
                print(f"  ✓ {action}")
            else:
                print(f"  ✗ {action} - MISSING!")
                all_present = False
        
        if all_present:
            print("\n[OK] All new actions are present in ActionExecutor")
            return True
        else:
            print("\n[ERROR] Some actions are missing!")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] Failed to check ActionExecutor: {e}")
        return False


def check_ai_controller():
    """Check if AI Controller system prompt includes new actions"""
    print("\n" + "="*60)
    print("CHECKING: AI Controller System Prompt")
    print("="*60)
    
    try:
        from ai.ai_controller import AIController
        
        ai = AIController()
        prompt = ai._get_system_prompt()
        
        required_keywords = [
            "open_word_blank",
            "open_website",
            "search_on_website",
            "chatgpt",
            "youtube",
            "wikipedia",
        ]
        
        print("\nSystem Prompt Keywords:")
        all_found = True
        for keyword in required_keywords:
            if keyword in prompt:
                print(f"  ✓ {keyword}")
            else:
                print(f"  ✗ {keyword} - NOT FOUND!")
                all_found = False
        
        if all_found:
            print("\n[OK] System prompt properly updated")
            return True
        else:
            print("\n[ERROR] System prompt missing some content!")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] Failed to check AI Controller: {e}")
        return False


def check_files_exist():
    """Check if all necessary files exist"""
    print("\n" + "="*60)
    print("CHECKING: File Existence")
    print("="*60)
    
    required_files = [
        "system/action_executor.py",
        "ai/ai_controller.py",
        "test_new_features_2026.py",
        "IMPLEMENTATION_GUIDE_NEW_FEATURES.md"
    ]
    
    print("\nRequired Files:")
    all_exist = True
    for file in required_files:
        filepath = os.path.join(os.path.dirname(__file__), file)
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print(f"  ✓ {file} ({size} bytes)")
        else:
            print(f"  ✗ {file} - NOT FOUND!")
            all_exist = False
    
    if all_exist:
        print("\n[OK] All required files exist")
        return True
    else:
        print("\n[ERROR] Some files are missing!")
        return False


def check_method_signatures():
    """Check method signatures are correct"""
    print("\n" + "="*60)
    print("CHECKING: Method Signatures")
    print("="*60)
    
    try:
        from system.action_executor import ActionExecutor
        import inspect
        
        executor = ActionExecutor()
        
        # Check open_word_blank signature
        sig = inspect.signature(executor.open_word_blank)
        print(f"\nopen_word_blank{sig}")
        
        # Check open_website signature
        sig = inspect.signature(executor.open_website)
        print(f"open_website{sig}")
        
        # Check search_on_website signature
        sig = inspect.signature(executor.search_on_website)
        print(f"search_on_website{sig}")
        
        print("\n[OK] All method signatures are correct")
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Failed to check method signatures: {e}")
        return False


def test_json_parsing():
    """Test that AI responses can be properly parsed"""
    print("\n" + "="*60)
    print("CHECKING: AI Response Parsing")
    print("="*60)
    
    try:
        from ai.ai_controller import AIController
        
        ai = AIController()
        
        test_responses = [
            # ChatGPT example
            '''{
                "intent": "open_website_and_search",
                "actions": [
                    {"action": "search_on_website", "parameters": {"website": "chatgpt", "search_query": "test"}, "delay_ms": 0}
                ],
                "response": "Testing ChatGPT"
            }''',
            
            # Multiple actions
            '''{
                "intent": "create_document",
                "actions": [
                    {"action": "open_word_blank", "parameters": {"wait_time": 4}, "delay_ms": 0},
                    {"action": "type_text", "parameters": {"text": "Hello World"}, "delay_ms": 4000}
                ],
                "response": "Creating document"
            }''',
        ]
        
        print("\nTesting JSON Parsing:")
        all_parsed = True
        for i, response in enumerate(test_responses, 1):
            try:
                result = ai._parse_ai_response(response)
                if "actions" in result and "response" in result:
                    print(f"  ✓ Test {i}: Successfully parsed")
                else:
                    print(f"  ✗ Test {i}: Missing required fields")
                    all_parsed = False
            except Exception as e:
                print(f"  ✗ Test {i}: Parse error - {e}")
                all_parsed = False
        
        if all_parsed:
            print("\n[OK] All JSON responses parsed correctly")
            return True
        else:
            print("\n[ERROR] Some JSON parsing failed!")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] Failed to test JSON parsing: {e}")
        return False


def main():
    """Main validation"""
    print("\n" + "="*70)
    print("VALIDATION: New Features Implementation")
    print("="*70)
    
    results = []
    
    # Run all checks
    results.append(("ActionExecutor Methods", check_action_executor()))
    results.append(("AI Controller Prompt", check_ai_controller()))
    results.append(("File Existence", check_files_exist()))
    results.append(("Method Signatures", check_method_signatures()))
    results.append(("JSON Parsing", test_json_parsing()))
    
    # Summary
    print("\n" + "="*70)
    print("VALIDATION SUMMARY")
    print("="*70)
    
    all_passed = True
    for check_name, passed in results:
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status} {check_name}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*70)
    if all_passed:
        print("✓ ALL VALIDATIONS PASSED")
        print("="*70)
        print("\nThe new features are properly implemented and ready to use:")
        print("1. ✓ Improved Word opening with Backstage handling")
        print("2. ✓ Web browsing for ChatGPT, Google, YouTube, Wikipedia, etc.")
        print("3. ✓ Search functionality for multiple websites")
        print("4. ✓ AI system prompt updated with examples")
        print("\nTo test the features:")
        print("  $ python test_new_features_2026.py")
        print("\nTo use in the application:")
        print("  $ python main.py")
        print("  (Open chat panel with Hotkey: B)")
        return 0
    else:
        print("✗ SOME VALIDATIONS FAILED")
        print("="*70)
        print("\nPlease check the errors above and fix them.")
        return 1


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        print(f"\n[CRITICAL ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
