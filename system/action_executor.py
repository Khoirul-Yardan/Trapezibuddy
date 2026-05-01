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
            "open_word": self.open_word,
            "open_word_blank": self.open_word_blank,
            "open_excel": self.open_excel,
            "open_powerpoint": self.open_powerpoint,
            "open_browser": self.open_browser,
            "open_website": self.open_website,
            "search_on_website": self.search_on_website,
            "open_vscode": self.open_vscode,
            "mouse_click": self.mouse_click,
            "mouse_move": self.mouse_move,
            "type_text": self.type_text,
            "press_key": self.press_key,
            "fill_resume": self.fill_resume,
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
            "say_text": self.say_text,
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
        """Open Google Chrome - multiple fallback strategies"""
        import time
        
        # Strategy 1: Common installation paths
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            r"C:\Users\%s\AppData\Local\Google\Chrome\Application\chrome.exe" % os.getenv('USERNAME', ''),
        ]
        
        for path in chrome_paths:
            if os.path.exists(path):
                try:
                    subprocess.Popen([path])
                    logger.info(f"Chrome opened via: {path}")
                    time.sleep(2)  # Wait for Chrome to start
                    return True
                except Exception as e:
                    logger.warning(f"Failed to open Chrome from {path}: {e}")
        
        # Strategy 2: Try using 'where' command to find Chrome in PATH
        try:
            result = subprocess.run(
                ["where", "chrome.exe"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                chrome_path = result.stdout.strip().split('\n')[0]
                if chrome_path and os.path.exists(chrome_path):
                    subprocess.Popen([chrome_path])
                    logger.info(f"Chrome opened via PATH: {chrome_path}")
                    time.sleep(2)
                    return True
        except Exception as e:
            logger.warning(f"Failed to search Chrome in PATH: {e}")
        
        # Strategy 3: Try using 'start' command (Windows native)
        try:
            os.system("start chrome")
            logger.info("Chrome opened via 'start chrome' command")
            time.sleep(2)
            return True
        except Exception as e:
            logger.warning(f"Failed to open Chrome via 'start' command: {e}")
        
        # Strategy 4: Try PowerShell
        try:
            subprocess.run(
                ["powershell", "-Command", "Start-Process chrome"],
                capture_output=True,
                timeout=5
            )
            logger.info("Chrome opened via PowerShell")
            time.sleep(2)
            return True
        except Exception as e:
            logger.warning(f"Failed to open Chrome via PowerShell: {e}")
        
        logger.error("Chrome could not be opened - not found in any location")
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
    
    def open_word(self, **kwargs):
        """Open Microsoft Word and create a new blank document"""
        word_paths = [
            r"C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE",
            r"C:\Program Files (x86)\Microsoft Office\root\Office16\WINWORD.EXE",
            r"C:\Program Files\Microsoft Office\Office16\WINWORD.EXE",
            r"C:\Program Files (x86)\Microsoft Office\Office16\WINWORD.EXE",
        ]
        
        for path in word_paths:
            if os.path.exists(path):
                try:
                    os.startfile(path)
                    logger.info("Microsoft Word opened")
                    return True
                except Exception as e:
                    logger.debug(f"Failed to open Word with path {path}: {e}")
        
        # Try with shell command
        try:
            os.startfile("winword.exe")
            logger.info("Microsoft Word opened (via system PATH)")
            return True
        except Exception as e:
            logger.error(f"Failed to open Microsoft Word: {e}")
            return False
    
    def open_word_blank(self, **kwargs):
        """Open Microsoft Word with a blank document and handle Backstage screen"""
        import time
        
        try:
            # First open Word
            self.open_word()
            
            # Wait for Word to start (longer wait for Backstage to appear)
            wait_time = kwargs.get('wait_time', 4)
            logger.info(f"Waiting {wait_time}s for Word to fully load...")
            time.sleep(wait_time)
            
            # Try to click on "Blank Document" button if Backstage is showing
            # Backstage "Blank Document" is typically near center-left of screen
            # Try clicking at common positions for Blank Document button
            blank_doc_positions = [
                (150, 200),   # Top-left area (typical for Blank Document tile)
                (250, 300),   # Center-left area
                (300, 250),   # Alternative center position
            ]
            
            logger.info("Looking for Blank Document button...")
            for x, y in blank_doc_positions:
                try:
                    pyautogui.click(x, y)
                    logger.info(f"Clicked at ({x}, {y}) to select Blank Document")
                    time.sleep(1)
                    # Check if we successfully entered document
                    pyautogui.click(500, 400)  # Click in document area
                    time.sleep(0.5)
                    logger.info("Successfully entered blank document")
                    return True
                except:
                    pass
            
            # If no Backstage found, just click in document area and start typing
            logger.info("Backstage not found, clicking in document area...")
            pyautogui.click(500, 400)
            time.sleep(0.5)
            logger.info("Ready to type in Word document")
            return True
            
        except Exception as e:
            logger.error(f"Failed to open Word blank document: {e}")
            return False
    
    def open_excel(self, **kwargs):
        """Open Microsoft Excel"""
        excel_paths = [
            r"C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE",
            r"C:\Program Files (x86)\Microsoft Office\root\Office16\EXCEL.EXE",
            r"C:\Program Files\Microsoft Office\Office16\EXCEL.EXE",
            r"C:\Program Files (x86)\Microsoft Office\Office16\EXCEL.EXE",
        ]
        
        for path in excel_paths:
            if os.path.exists(path):
                try:
                    os.startfile(path)
                    logger.info("Microsoft Excel opened")
                    return True
                except Exception as e:
                    logger.debug(f"Failed to open Excel with path {path}: {e}")
        
        # Try with shell command
        try:
            os.startfile("excel.exe")
            logger.info("Microsoft Excel opened (via system PATH)")
            return True
        except Exception as e:
            logger.error(f"Failed to open Microsoft Excel: {e}")
            return False
    
    def open_powerpoint(self, **kwargs):
        """Open Microsoft PowerPoint"""
        ppt_paths = [
            r"C:\Program Files\Microsoft Office\root\Office16\POWERPNT.EXE",
            r"C:\Program Files (x86)\Microsoft Office\root\Office16\POWERPNT.EXE",
            r"C:\Program Files\Microsoft Office\Office16\POWERPNT.EXE",
            r"C:\Program Files (x86)\Microsoft Office\Office16\POWERPNT.EXE",
        ]
        
        for path in ppt_paths:
            if os.path.exists(path):
                try:
                    os.startfile(path)
                    logger.info("Microsoft PowerPoint opened")
                    return True
                except Exception as e:
                    logger.debug(f"Failed to open PowerPoint with path {path}: {e}")
        
        # Try with shell command
        try:
            os.startfile("powerpnt.exe")
            logger.info("Microsoft PowerPoint opened (via system PATH)")
            return True
        except Exception as e:
            logger.error(f"Failed to open Microsoft PowerPoint: {e}")
            return False
    
    def open_browser(self, url: str = "https://www.google.com", **kwargs):
        """Open URL - prioritizes Chrome if available, otherwise default browser"""
        try:
            import webbrowser
            
            # Try to open with Chrome specifically first
            chrome_path = None
            chrome_paths = [
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            ]
            
            for path in chrome_paths:
                if os.path.exists(path):
                    chrome_path = path
                    break
            
            if chrome_path:
                # Open URL with Chrome specifically
                try:
                    os.startfile(f"{chrome_path} {url}")
                    logger.info(f"Chrome opened with URL: {url}")
                    return True
                except:
                    pass
            
            # Fallback to default browser
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
        """
        Type text - handles Unicode, special characters, and Indonesian text
        Uses clipboard for better compatibility with all text types
        """
        try:
            import pyperclip
            import time
            
            # Copy text to clipboard
            pyperclip.copy(text)
            
            # Paste from clipboard (this handles Unicode perfectly)
            pyautogui.hotkey('ctrl', 'v')
            
            # Small delay for paste to complete
            time.sleep(0.1)
            
            logger.info(f"Typed text: {text}")
            return True
        except ImportError:
            # Fallback: use keyboard library if available
            try:
                import keyboard
                keyboard.write(text)
                logger.info(f"Typed text (via keyboard): {text}")
                return True
            except:
                # Last resort: use pyautogui (limited Unicode support)
                try:
                    # For ASCII text
                    pyautogui.typewrite(text, interval=interval)
                    logger.info(f"Typed text (via pyautogui): {text}")
                    return True
                except Exception as e:
                    logger.error(f"Failed to type text: {e}")
                    return False
    
    def press_key(self, key: str, **kwargs):
        """
        Press keyboard key or key combination
        Supports: Enter, Tab, Escape, ctrl+a, shift+tab, alt+f4, etc.
        """
        try:
            # Handle key combinations (ctrl+a, shift+tab, etc.)
            if '+' in key:
                parts = key.split('+')
                modifiers = [p.strip().lower() for p in parts[:-1]]
                main_key = parts[-1].strip().lower()
                
                # Convert modifier names
                modifier_map = {
                    'ctrl': 'ctrl',
                    'control': 'ctrl',
                    'shift': 'shift',
                    'alt': 'alt',
                    'cmd': 'cmd',
                    'win': 'win'
                }
                
                modifiers = [modifier_map.get(m, m) for m in modifiers]
                
                # Execute the hotkey combination
                pyautogui.hotkey(*modifiers, main_key)
                logger.info(f"Key combination pressed: {key}")
            else:
                # Single key press
                pyautogui.press(key.lower())
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
    
    def say_text(self, text: str, **kwargs):
        """Make character say text in dialog bubble"""
        # This will be handled by the main window calling the dialog_manager
        logger.info(f"Character asked to say: {text}")
        return True
    
    def fill_resume(self, name: str = "", email: str = "", phone: str = "", 
                    objective: str = "", experience: str = "", education: str = "",
                    skills: str = "", wait_time: int = 4000, **kwargs):
        """
        Fill resume in Microsoft Word with provided information
        
        Args:
            name: Full name
            email: Email address
            phone: Phone number
            objective: Career objective
            experience: Work experience
            education: Education details
            skills: Skills list (comma-separated)
            wait_time: Time to wait for Word to open (ms)
        """
        try:
            import time
            import pyperclip
            
            logger.info("Starting resume fill process...")
            
            # Open Word with blank document (handles Backstage screen)
            self.open_word_blank(wait_time=wait_time/1000)
            
            # Wait a bit more for document to be ready
            time.sleep(0.5)
            
            # Build resume content with template format
            resume_content = f"""RESUME

Name: {name}
Email: {email}
Phone: {phone}

OBJECTIVE:
{objective}

EXPERIENCE:
{experience}

EDUCATION:
{education}

SKILLS:
{skills}"""
            
            # Use clipboard to paste the resume content
            pyperclip.copy(resume_content)
            time.sleep(0.2)
            
            # Paste the content
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.5)
            
            logger.info("Resume content typed successfully")
            return True
            
        except ImportError as e:
            logger.error(f"Required library not available: {e}")
            logger.error("Please install: pip install pyperclip")
            return False
        except Exception as e:
            logger.error(f"Failed to fill resume: {e}")
            return False
    
    def open_website(self, website: str = "google", **kwargs):
        """
        Open a website by name or URL
        
        Args:
            website: Website name (google, chatgpt, youtube, stackoverflow, github, etc) 
                    or full URL (https://...)
        """
        import time
        
        # Map of popular websites
        website_map = {
            "google": "https://www.google.com",
            "chatgpt": "https://chat.openai.com",
            "youtube": "https://www.youtube.com",
            "stackoverflow": "https://stackoverflow.com",
            "github": "https://github.com",
            "twitter": "https://twitter.com",
            "facebook": "https://www.facebook.com",
            "reddit": "https://www.reddit.com",
            "linkedin": "https://www.linkedin.com",
            "instagram": "https://www.instagram.com",
            "gmail": "https://mail.google.com",
            "outlook": "https://outlook.live.com",
            "wikipedia": "https://www.wikipedia.org",
            "amazon": "https://www.amazon.com",
            "ebay": "https://www.ebay.com",
        }
        
        # Convert website name to URL if needed
        website_lower = website.lower().strip()
        if website_lower in website_map:
            url = website_map[website_lower]
        elif website.startswith("http"):
            url = website
        else:
            # Assume it's a domain name, add https://
            url = f"https://{website}" if not website.startswith("www.") else f"https://{website}"
        
        try:
            logger.info(f"Opening website: {url}")
            self.open_browser(url=url)
            time.sleep(3)  # Wait for page to load
            logger.info(f"Website opened: {url}")
            return True
        except Exception as e:
            logger.error(f"Failed to open website: {e}")
            return False
    
    def search_on_website(self, website: str = "google", search_query: str = "", **kwargs):
        """
        Open a website and perform a search
        
        Args:
            website: Website name (google, chatgpt, youtube, wikipedia, etc)
            search_query: What to search for
        """
        import time
        
        try:
            # Open the website first
            logger.info(f"Opening {website} to search for: {search_query}")
            self.open_website(website=website)
            time.sleep(2)
            
            # Handle different websites
            website_lower = website.lower().strip()
            
            if website_lower == "chatgpt":
                # For ChatGPT, click on the message input field and type
                logger.info("Searching on ChatGPT (entering message)...")
                time.sleep(1)
                # ChatGPT message input is typically at bottom of screen
                pyautogui.click(500, 600)  # Click in message area
                time.sleep(0.5)
                self.type_text(text=search_query)
                time.sleep(0.5)
                pyautogui.press('return')  # Send message
                
            elif website_lower == "youtube":
                # For YouTube, click search box and search
                logger.info("Searching on YouTube...")
                time.sleep(1)
                # YouTube search box is typically at top
                pyautogui.click(500, 40)  # Click search box area
                time.sleep(0.5)
                self.type_text(text=search_query)
                time.sleep(0.5)
                pyautogui.press('return')
                
            elif website_lower == "google":
                # For Google, type in search box
                logger.info("Searching on Google...")
                time.sleep(1)
                pyautogui.click(500, 350)  # Click search box area
                time.sleep(0.3)
                self.type_text(text=search_query)
                time.sleep(0.5)
                pyautogui.press('return')
                
            elif website_lower == "wikipedia":
                # For Wikipedia, search
                logger.info("Searching on Wikipedia...")
                time.sleep(1)
                pyautogui.click(500, 80)  # Click search box
                time.sleep(0.3)
                self.type_text(text=search_query)
                time.sleep(0.5)
                pyautogui.press('return')
                
            elif website_lower == "stackoverflow":
                # For Stack Overflow, search
                logger.info("Searching on Stack Overflow...")
                time.sleep(1)
                pyautogui.click(500, 50)  # Click search box
                time.sleep(0.3)
                self.type_text(text=search_query)
                time.sleep(0.5)
                pyautogui.press('return')
                
            else:
                # Generic search - try clicking in center and typing
                logger.info("Performing generic search...")
                pyautogui.click(500, 300)
                time.sleep(0.3)
                self.type_text(text=search_query)
                time.sleep(0.5)
                pyautogui.press('return')
            
            logger.info(f"Search completed on {website}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to search on website: {e}")
            return False
    
    def get_available_actions(self) -> list:
        """Get list of available actions"""
        return list(self.actions.keys())
