# AI Controller - handles AI integration (OpenAI or Ollama)
import requests
import json
from typing import Dict, Any, Optional, List
from config.config import AI_TYPE, AI_API_KEY, AI_MODEL, OLLAMA_URL, OLLAMA_MODEL, AI_ENABLED
from utils.logger import setup_logger

logger = setup_logger(__name__)


class AIController:
    """
    Manage AI integration for character
    Supports OpenAI API and local Ollama
    """
    
    def __init__(self):
        self.ai_type = AI_TYPE
        self.api_key = AI_API_KEY
        self.model = AI_MODEL
        self.ollama_url = OLLAMA_URL
        self.ollama_model = OLLAMA_MODEL
        self.enabled = AI_ENABLED
        
        logger.info(f"AIController initialized - Type: {self.ai_type}, Enabled: {self.enabled}")
    
    def process_command(self, user_input: str) -> Dict[str, Any]:
        """
        Process user command and get AI response
        
        Args:
            user_input: User command
        
        Returns:
            Dict with intent, action, and parameters
        """
        if not self.enabled:
            logger.warning("AI is disabled")
            return self._parse_intent_local(user_input)
        
        if self.ai_type == "openai":
            return self._process_openai(user_input)
        elif self.ai_type == "local":
            return self._process_ollama(user_input)
        else:
            logger.error(f"Unknown AI type: {self.ai_type}")
            return self._parse_intent_local(user_input)
    
    def _process_openai(self, user_input: str) -> Dict[str, Any]:
        """Process command using OpenAI API"""
        try:
            import openai
            openai.api_key = self.api_key
            
            system_prompt = self._get_system_prompt()
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            ai_response = response.choices[0].message.content
            logger.info(f"OpenAI response: {ai_response}")
            return self._parse_ai_response(ai_response)
        
        except ImportError:
            logger.error("openai package not installed")
            return self._parse_intent_local(user_input)
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return self._parse_intent_local(user_input)
    
    def _process_ollama(self, user_input: str) -> Dict[str, Any]:
        """Process command using local Ollama"""
        try:
            system_prompt = self._get_system_prompt()
            
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.ollama_model,
                    "prompt": f"{system_prompt}\n\nUser: {user_input}\nAssistant:",
                    "stream": False,
                    "temperature": 0.7,
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            ai_response = result.get("response", "").strip()
            logger.info(f"Ollama response: {ai_response}")
            return self._parse_ai_response(ai_response)
        
        except requests.exceptions.ConnectionError:
            logger.warning(f"Cannot connect to Ollama at {self.ollama_url}")
            return self._parse_intent_local(user_input)
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return self._parse_intent_local(user_input)
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for AI"""
        return """You are a helpful desktop assistant. Analyze user commands and respond with a JSON action.

ALWAYS respond with a JSON object in this format:
{
    "intent": "action_name",
    "actions": [
        {
            "action": "action_type",
            "parameters": {...},
            "delay_ms": 0
        },
        {
            "action": "action_type2",
            "parameters": {...},
            "delay_ms": 500
        }
    ],
    "response": "Natural language response"
}

Available actions:
- open_app: Open an application (params: app_path)
- open_chrome: Open Chrome browser
- open_notepad: Open Notepad
- open_calculator: Open Calculator
- open_browser: Open URL in browser (params: url)
- open_vscode: Open VSCode (params: folder_path - optional)
- create_folder: Create a folder (params: folder_path)
- create_file: Create a file (params: file_path, content)
- open_folder: Open folder in file explorer (params: folder_path)
- run_code: Execute code (params: code, language - default: python)
- mouse_click: Click mouse (params: x, y, button)
- mouse_move: Move mouse (params: x, y)
- type_text: Type text (params: text)
- press_key: Press keyboard key (params: key)
- maximize_window: Maximize active window
- minimize_window: Minimize active window
- close_window: Close active window
- volume_up: Increase volume
- volume_down: Decrease volume
- say_text: Display character dialogue
- move_character: Move character (params: x, y)

Example user input: "Buka Chrome dan cari chat gpt"
Response: {
    "intent": "multi_task",
    "actions": [
        {"action": "open_chrome", "parameters": {}, "delay_ms": 0},
        {"action": "type_text", "parameters": {"text": "chat gpt"}, "delay_ms": 2000},
        {"action": "press_key", "parameters": {"key": "Return"}, "delay_ms": 500}
    ],
    "response": "Membuka Chrome dan mencari ChatGPT..."
}

Example user input: "Buka VSCode dan buat folder project"
Response: {
    "intent": "code_task",
    "actions": [
        {"action": "open_vscode", "parameters": {"folder_path": "project"}, "delay_ms": 0}
    ],
    "response": "Membuka VSCode dengan folder project..."
}

Example user input: "Buka Chrome"
Response: {
    "intent": "open_app",
    "actions": [
        {"action": "open_chrome", "parameters": {}, "delay_ms": 0}
    ],
    "response": "Membuka Chrome..."
}

IMPORTANT: Always use "actions" array with delay_ms between sequential actions!
For multi-step tasks, add delays (e.g., 2000ms = 2 seconds) so previous action completes.
"""
    
    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse AI JSON response - handles both single action and multiple actions"""
        try:
            # Try to extract JSON from response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                data = json.loads(json_str)
                
                # Support both old format (single "action") and new format ("actions" array)
                if "actions" in data and isinstance(data["actions"], list):
                    # New format with multiple actions - keep as is
                    logger.info(f"Parsed {len(data['actions'])} actions from AI response")
                    return data
                elif "action" in data:
                    # Old format - convert to new format
                    action = data.get("action")
                    parameters = data.get("parameters", {})
                    data["actions"] = [
                        {"action": action, "parameters": parameters, "delay_ms": 0}
                    ]
                    logger.info("Converted single action to actions array format")
                    return data
                else:
                    logger.warning("No 'action' or 'actions' found in response")
                    return data
        except Exception as e:
            logger.warning(f"Failed to parse AI response: {e}")
        
        return self._parse_intent_local(response)
    
    def _parse_intent_local(self, user_input: str) -> Dict[str, Any]:
        """Parse user input locally (fallback) - returns new format with actions array"""
        user_input_lower = user_input.lower()
        actions_list = []
        response_text = ""
        intent = "unknown"
        
        # Chrome/browser commands with search
        if any(word in user_input_lower for word in ["chrome", "browser", "buka chrome", "crome"]):
            actions_list.append({
                "action": "open_chrome",
                "parameters": {},
                "delay_ms": 0
            })
            response_text = "Membuka Google Chrome..."
            intent = "open_app"
            
            # Check if user wants to search something
            if "cari" in user_input_lower or "search" in user_input_lower:
                # Extract search term
                search_term = "google.com"
                if "chat gpt" in user_input_lower or "chatgpt" in user_input_lower:
                    search_term = "chatgpt.com"
                elif "youtube" in user_input_lower:
                    search_term = "youtube.com"
                elif "stackoverflow" in user_input_lower:
                    search_term = "stackoverflow.com"
                else:
                    # Try to extract search term
                    words = user_input.split()
                    cari_index = next((i for i, w in enumerate(words) if w.lower() in ["cari", "search"]), -1)
                    if cari_index != -1 and cari_index + 1 < len(words):
                        search_term = " ".join(words[cari_index + 1:cari_index + 3])
                
                # Add search actions
                actions_list.append({
                    "action": "type_text",
                    "parameters": {"text": search_term},
                    "delay_ms": 2000  # Wait 2 seconds for Chrome to open
                })
                actions_list.append({
                    "action": "press_key",
                    "parameters": {"key": "Return"},
                    "delay_ms": 500
                })
                response_text = f"Membuka Chrome dan mencari {search_term}..."
                intent = "multi_task"
        
        # VSCode commands
        elif any(word in user_input_lower for word in ["vscode", "vs code", "code editor", "buka vscode"]):
            folder_hint = ""
            if "folder" in user_input_lower or "project" in user_input_lower:
                folder_hint = "project"
            
            actions_list.append({
                "action": "open_vscode",
                "parameters": {"folder_path": folder_hint} if folder_hint else {},
                "delay_ms": 0
            })
            response_text = "Membuka VSCode..."
            intent = "code_task"
        
        # Notepad commands
        elif any(word in user_input_lower for word in ["notepad", "catatan", "text editor"]):
            actions_list.append({
                "action": "open_notepad",
                "parameters": {},
                "delay_ms": 0
            })
            response_text = "Membuka Notepad..."
            intent = "open_app"
        
        # Calculator commands
        elif any(word in user_input_lower for word in ["calculator", "kalkulator", "hitung"]):
            actions_list.append({
                "action": "open_calculator",
                "parameters": {},
                "delay_ms": 0
            })
            response_text = "Membuka Kalkulator..."
            intent = "open_app"
        
        # Google/search commands
        elif any(word in user_input_lower for word in ["google", "search", "cari"]):
            actions_list.append({
                "action": "open_browser",
                "parameters": {"url": "https://www.google.com"},
                "delay_ms": 0
            })
            response_text = "Membuka Google..."
            intent = "open_app"
        
        # Create folder commands
        elif any(word in user_input_lower for word in ["buat folder", "create folder", "folder baru", "mkdir"]):
            folder_name = "new_folder"
            words = user_input.split()
            for i, word in enumerate(words):
                if word.lower() in ["folder", "named", "bernama"] and i + 1 < len(words):
                    folder_name = words[i + 1]
                    break
            
            actions_list.append({
                "action": "create_folder",
                "parameters": {"folder_path": folder_name},
                "delay_ms": 0
            })
            response_text = f"Membuat folder: {folder_name}"
            intent = "file_operation"
        
        # Create file commands
        elif any(word in user_input_lower for word in ["buat file", "create file", "file baru", "touch"]):
            actions_list.append({
                "action": "create_file",
                "parameters": {"file_path": "new_file.txt", "content": ""},
                "delay_ms": 0
            })
            response_text = "Membuat file: new_file.txt"
            intent = "file_operation"
        
        # Open folder commands
        elif any(word in user_input_lower for word in ["buka folder", "open folder", "lihat folder"]):
            actions_list.append({
                "action": "open_folder",
                "parameters": {"folder_path": "."},
                "delay_ms": 0
            })
            response_text = "Membuka folder..."
            intent = "file_operation"
        
        # Default fallback
        if not actions_list:
            response_text = "Saya tidak mengerti perintah tersebut. Coba: 'buka chrome', 'buka vscode', 'buat folder'"
        
        return {
            "intent": intent,
            "actions": actions_list,
            "response": response_text
        }
    
    def get_supported_actions(self) -> List[str]:
        """Get list of supported actions"""
        return [
            "open_chrome", "open_notepad", "open_calculator",
            "open_browser", "open_vscode", "mouse_click", "mouse_move",
            "type_text", "press_key", "volume_up", "volume_down",
            "create_folder", "create_file", "open_folder", "run_code",
            "maximize_window", "minimize_window", "close_window"
        ]
