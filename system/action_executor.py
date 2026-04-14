# Action Executor - execute system commands and actions
import subprocess
import os
import sys
import pyautogui
from typing import Dict, Any, Callable
from utils.logger import setup_logger

logger = setup_logger(__name__)


class ActionExecutor:
    """Execute system actions triggered by AI or user commands"""
    
    def __init__(self):
        self.actions: Dict[str, Callable] = self._setup_actions()
        logger.info("ActionExecutor initialized")
    
    def _setup_actions(self) -> Dict[str, Callable]:
        """Setup available actions"""
        return {
            "open_app": self.open_application,
            "open_chrome": self.open_chrome,
            "open_notepad": self.open_notepad,
            "open_calculator": self.open_calculator,
            "open_browser": self.open_browser,
            "mouse_click": self.mouse_click,
            "mouse_move": self.mouse_move,
            "type_text": self.type_text,
            "press_key": self.press_key,
            "maximize_window": self.maximize_active_window,
            "minimize_window": self.minimize_active_window,
            "close_window": self.close_active_window,
            "volume_up": self.volume_up,
            "volume_down": self.volume_down,
        }
    
    def execute(self, action_name: str, params: Dict[str, Any] = None) -> bool:
        """
        Execute an action
        
        Args:
            action_name: Name of action to execute
            params: Parameters for the action
        
        Returns:
            True if successful, False otherwise
        """
        params = params or {}
        
        if action_name not in self.actions:
            logger.error(f"Unknown action: {action_name}")
            return False
        
        try:
            self.actions[action_name](**params)
            logger.info(f"Action executed: {action_name}")
            return True
        except Exception as e:
            logger.error(f"Error executing action {action_name}: {e}")
            return False
    
    # Application actions
    def open_application(self, app_path: str, **kwargs):
        """Open application by path"""
        if not os.path.exists(app_path):
            logger.error(f"Application not found: {app_path}")
            return False
        
        try:
            if sys.platform == "win32":
                os.startfile(app_path)
            else:
                subprocess.Popen(app_path)
            logger.info(f"Application opened: {app_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to open application: {e}")
            return False
    
    def open_chrome(self, **kwargs):
        """Open Google Chrome"""
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ]
        
        for path in chrome_paths:
            if os.path.exists(path):
                try:
                    os.startfile(path)
                    logger.info("Chrome opened")
                    return True
                except Exception as e:
                    logger.error(f"Failed to open Chrome: {e}")
        
        logger.warning("Chrome not found in typical locations")
        return False
    
    def open_notepad(self, **kwargs):
        """Open Notepad"""
        try:
            os.startfile("notepad.exe")
            logger.info("Notepad opened")
            return True
        except Exception as e:
            logger.error(f"Failed to open Notepad: {e}")
            return False
    
    def open_calculator(self, **kwargs):
        """Open Calculator"""
        try:
            if sys.platform == "win32":
                os.startfile("calc.exe")
            logger.info("Calculator opened")
            return True
        except Exception as e:
            logger.error(f"Failed to open Calculator: {e}")
            return False
    
    def open_browser(self, url: str = "https://www.google.com", **kwargs):
        """Open URL in default browser"""
        try:
            import webbrowser
            webbrowser.open(url)
            logger.info(f"Browser opened with URL: {url}")
            return True
        except Exception as e:
            logger.error(f"Failed to open browser: {e}")
            return False
    
    # Mouse actions
    def mouse_click(self, x: int = None, y: int = None, button: str = "left", **kwargs):
        """Click mouse at position"""
        try:
            if x is not None and y is not None:
                pyautogui.click(x, y, button=button)
            else:
                pyautogui.click(button=button)
            logger.info(f"Mouse clicked at ({x}, {y}) with {button} button")
            return True
        except Exception as e:
            logger.error(f"Failed to click mouse: {e}")
            return False
    
    def mouse_move(self, x: int, y: int, duration: float = 0.5, **kwargs):
        """Move mouse to position"""
        try:
            pyautogui.moveTo(x, y, duration=duration)
            logger.info(f"Mouse moved to ({x}, {y})")
            return True
        except Exception as e:
            logger.error(f"Failed to move mouse: {e}")
            return False
    
    # Keyboard actions
    def type_text(self, text: str, interval: float = 0.05, **kwargs):
        """Type text"""
        try:
            pyautogui.typewrite(text, interval=interval)
            logger.info(f"Typed text: {text}")
            return True
        except Exception as e:
            logger.error(f"Failed to type text: {e}")
            return False
    
    def press_key(self, key: str, **kwargs):
        """Press keyboard key"""
        try:
            pyautogui.press(key)
            logger.info(f"Key pressed: {key}")
            return True
        except Exception as e:
            logger.error(f"Failed to press key: {e}")
            return False
    
    # Window actions
    def maximize_active_window(self, **kwargs):
        """Maximize active window"""
        try:
            pyautogui.hotkey('alt', 'f10')
            logger.info("Window maximized")
            return True
        except Exception as e:
            logger.error(f"Failed to maximize window: {e}")
            return False
    
    def minimize_active_window(self, **kwargs):
        """Minimize active window"""
        try:
            pyautogui.hotkey('alt', 'f9')
            logger.info("Window minimized")
            return True
        except Exception as e:
            logger.error(f"Failed to minimize window: {e}")
            return False
    
    def close_active_window(self, **kwargs):
        """Close active window"""
        try:
            pyautogui.hotkey('alt', 'f4')
            logger.info("Window closed")
            return True
        except Exception as e:
            logger.error(f"Failed to close window: {e}")
            return False
    
    # Media actions
    def volume_up(self, **kwargs):
        """Increase volume"""
        try:
            pyautogui.press('volumeup')
            logger.info("Volume increased")
            return True
        except Exception as e:
            logger.error(f"Failed to increase volume: {e}")
            return False
    
    def volume_down(self, **kwargs):
        """Decrease volume"""
        try:
            pyautogui.press('volumedown')
            logger.info("Volume decreased")
            return True
        except Exception as e:
            logger.error(f"Failed to decrease volume: {e}")
            return False
    
    def get_available_actions(self) -> list:
        """Get list of available actions"""
        return list(self.actions.keys())
