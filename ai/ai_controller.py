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
    "action": "action_type",
    "parameters": {...},
    "response": "Natural language response"
}

Available actions:
- open_app: Open an application (params: app_path)
- open_chrome: Open Chrome browser
- open_notepad: Open Notepad
- open_calculator: Open Calculator
- open_browser: Open URL in browser (params: url)
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

Example user input: "Buka Chrome"
Response: {"intent": "open_app", "action": "open_chrome", "parameters": {}, "response": "Membuka Chrome..."}
"""
    
    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse AI JSON response"""
        try:
            # Try to extract JSON from response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                data = json.loads(json_str)
                return data
        except Exception as e:
            logger.warning(f"Failed to parse AI response: {e}")
        
        return self._parse_intent_local(response)
    
    def _parse_intent_local(self, user_input: str) -> Dict[str, Any]:
        """Parse user input locally (fallback)"""
        user_input_lower = user_input.lower()
        
        # Simple keyword matching
        if any(word in user_input_lower for word in ["chrome", "browser", "buka chrome"]):
            return {
                "intent": "open_app",
                "action": "open_chrome",
                "parameters": {},
                "response": "Membuka Google Chrome..."
            }
        
        elif any(word in user_input_lower for word in ["notepad", "catatan", "text editor"]):
            return {
                "intent": "open_app",
                "action": "open_notepad",
                "parameters": {},
                "response": "Membuka Notepad..."
            }
        
        elif any(word in user_input_lower for word in ["calculator", "kalkulator", "hitung"]):
            return {
                "intent": "open_app",
                "action": "open_calculator",
                "parameters": {},
                "response": "Membuka Kalkulator..."
            }
        
        elif any(word in user_input_lower for word in ["google", "search", "cari"]):
            return {
                "intent": "open_app",
                "action": "open_browser",
                "parameters": {"url": "https://www.google.com"},
                "response": "Membuka Google..."
            }
        
        elif any(word in user_input_lower for word in ["hello", "hi", "halo"]):
            return {
                "intent": "dialog",
                "action": "say_text",
                "parameters": {"text": "Hello! How can I help?"},
                "response": "Hello! How can I help?"
            }
        
        else:
            return {
                "intent": "unknown",
                "action": None,
                "parameters": {},
                "response": f"I'm not sure about that command."
            }
    
    def get_supported_actions(self) -> List[str]:
        """Get list of supported actions"""
        return [
            "open_chrome", "open_notepad", "open_calculator",
            "open_browser", "mouse_click", "mouse_move",
            "type_text", "press_key", "volume_up", "volume_down"
        ]
