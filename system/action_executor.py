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
            "open_vscode": self.open_vscode,
            "mouse_click": self.mouse_click,
            "mouse_move": self.mouse_move,
            "type_text": self.type_text,
            "press_key": self.press_key,
            "maximize_window": self.maximize_active_window,
            "minimize_window": self.minimize_active_window,
            "close_window": self.close_active_window,
            "volume_up": self.volume_up,
            "volume_down": self.volume_down,
            "create_folder": self.create_folder,
            "create_file": self.create_file,
            "open_folder": self.open_folder,
            "run_code": self.run_code,
            "move_character": self.move_character,
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
    
    # VSCode and File actions
    def open_vscode(self, folder_path: str = None, **kwargs):
        """Open VSCode, optionally with a specific folder"""
        vscode_paths = [
            r"C:\Program Files\Microsoft VS Code\Code.exe",
            r"C:\Program Files (x86)\Microsoft VS Code\Code.exe",
            "code"  # Try system PATH
        ]
        
        for path in vscode_paths:
            try:
                if folder_path:
                    if sys.platform == "win32":
                        os.startfile(path, arguments=folder_path)
                    else:
                        subprocess.Popen([path, folder_path])
                else:
                    if sys.platform == "win32":
                        os.startfile(path)
                    else:
                        subprocess.Popen([path])
                
                logger.info(f"VSCode opened {f'with folder: {folder_path}' if folder_path else ''}")
                return True
            except Exception as e:
                logger.debug(f"Failed with path {path}: {e}")
        
        logger.warning("VSCode not found in typical locations")
        return False
    
    def create_folder(self, folder_path: str, **kwargs):
        """Create a folder at specified path"""
        try:
            os.makedirs(folder_path, exist_ok=True)
            logger.info(f"Folder created: {folder_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to create folder: {e}")
            return False
    
    def create_file(self, file_path: str, content: str = "", **kwargs):
        """Create a file with optional content"""
        try:
            # Create parent directories if needed
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"File created: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to create file: {e}")
            return False
    
    def open_folder(self, folder_path: str, **kwargs):
        """Open folder in file explorer"""
        try:
            if sys.platform == "win32":
                os.startfile(folder_path)
            elif sys.platform == "darwin":  # macOS
                subprocess.Popen(["open", folder_path])
            else:  # Linux
                subprocess.Popen(["xdg-open", folder_path])
            
            logger.info(f"Folder opened: {folder_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to open folder: {e}")
            return False
    
    def run_code(self, code: str, language: str = "python", **kwargs):
        """Execute code snippet"""
        try:
            if language.lower() == "python":
                result = subprocess.run([sys.executable, "-c", code], 
                                       capture_output=True, text=True, timeout=10)
                logger.info(f"Python code executed: {result.stdout}")
                return True
            else:
                logger.warning(f"Language {language} not supported for execution")
                return False
        except subprocess.TimeoutExpired:
            logger.error("Code execution timed out")
            return False
        except Exception as e:
            logger.error(f"Failed to execute code: {e}")
            return False
    
    def move_character(self, x: int, y: int, **kwargs):
        """Move character to specified position (requires character_widget reference)"""
        # This will be handled by the main window calling the behavior_controller
        logger.info(f"Character move requested to ({x}, {y})")
        return True
    
    def get_available_actions(self) -> list:
        """Get list of available actions"""
        return list(self.actions.keys())
