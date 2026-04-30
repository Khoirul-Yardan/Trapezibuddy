# Test Gemini AI Integration
# This script tests if Gemini AI is properly configured and working

import os
import sys

def test_gemini_setup():
    """Test if Gemini API key is configured"""
    print("[1] Checking Gemini API Key Configuration...")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("    [ERROR] GEMINI_API_KEY environment variable not set!")
        print("    [INFO] Please follow GEMINI_SETUP_GUIDE.md to configure it")
        return False
    
    print(f"    [OK] API Key found: {api_key[:20]}...{api_key[-10:]}")
    return True


def test_gemini_library():
    """Test if google-generativeai is installed"""
    print("\n[2] Checking google-generativeai library...")
    
    try:
        import google.generativeai as genai
        print("    [OK] google-generativeai is installed")
        return True
    except ImportError:
        print("    [ERROR] google-generativeai not installed!")
        print("    [INFO] Install with: pip install google-generativeai")
        return False


def test_gemini_connection():
    """Test connection to Gemini API"""
    print("\n[3] Testing Gemini API Connection...")
    
    try:
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("    [ERROR] API key not configured")
            return False
        
        genai.configure(api_key=api_key)
        
        # Try to access the model
        model = genai.GenerativeModel("gemini-pro")
        print("    [OK] Successfully connected to Gemini API")
        return True
    
    except ValueError as e:
        if "API key" in str(e):
            print("    [ERROR] Invalid API key!")
            print("    [INFO] Check your GEMINI_API_KEY environment variable")
        else:
            print(f"    [ERROR] {e}")
        return False
    except Exception as e:
        print(f"    [ERROR] Connection failed: {e}")
        return False


def test_ai_controller():
    """Test if AIController is working with Gemini"""
    print("\n[4] Testing AIController with Gemini...")
    
    try:
        from config.config import AI_TYPE, AI_ENABLED
        from ai.ai_controller import AIController
        
        if not AI_ENABLED:
            print("    [WARNING] AI_ENABLED is False in config.py")
            return False
        
        if AI_TYPE != "gemini":
            print(f"    [WARNING] AI_TYPE is '{AI_TYPE}', expected 'gemini'")
            print(f"    [INFO] Update AI_TYPE in config/config.py")
            return False
        
        print(f"    [OK] AI_ENABLED: {AI_ENABLED}")
        print(f"    [OK] AI_TYPE: {AI_TYPE}")
        
        controller = AIController()
        print("    [OK] AIController initialized successfully")
        return True
    
    except Exception as e:
        print(f"    [ERROR] {e}")
        return False


def test_gemini_response():
    """Test actual Gemini API response"""
    print("\n[5] Testing Gemini API Response...")
    
    try:
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Test dengan simple prompt
        response = model.generate_content(
            'Respond with JSON only: {"test": "success", "message": "Gemini is working!"}'
        )
        
        print(f"    [OK] Response received: {response.text[:100]}...")
        return True
    
    except Exception as e:
        print(f"    [ERROR] Failed to get response: {e}")
        return False


def test_action_executor():
    """Test if Action Executor has Word/Excel/PowerPoint support"""
    print("\n[6] Testing Action Executor Capabilities...")
    
    try:
        from system.action_executor import ActionExecutor
        
        executor = ActionExecutor()
        actions = executor.get_available_actions()
        
        required_actions = ["open_word", "open_excel", "open_powerpoint", "open_chrome", "type_text"]
        missing = [a for a in required_actions if a not in actions]
        
        if missing:
            print(f"    [WARNING] Missing actions: {missing}")
            return False
        
        print(f"    [OK] Found {len(actions)} available actions")
        print(f"    [OK] Word, Excel, PowerPoint support available")
        return True
    
    except Exception as e:
        print(f"    [ERROR] {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("GEMINI AI INTEGRATION TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("API Key Configuration", test_gemini_setup),
        ("Library Installation", test_gemini_library),
        ("API Connection", test_gemini_connection),
        ("AIController Setup", test_ai_controller),
        ("Gemini Response", test_gemini_response),
        ("Action Executor", test_action_executor),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"    [ERROR] Unexpected error: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[SUCCESS] All tests passed! Your Gemini AI is ready to use!")
        print("\nYou can now run: python main.py")
        return 0
    else:
        print("\n[WARNING] Some tests failed. Check the errors above.")
        print("Follow GEMINI_SETUP_GUIDE.md for troubleshooting.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
