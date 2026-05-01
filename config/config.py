# Configuration file for Desktop Assistant
import os

# Window Settings
WINDOW_WIDTH = 512
WINDOW_HEIGHT = 512
WINDOW_TITLE = "Desktop Assistant"

# Character Settings
CHARACTER_SIZE = 60  # Percentage (100 = normal, 50 = half, 150 = 1.5x) - REDUCED FOR BETTER VIEW
CHARACTER_MIN_SIZE = 30  # Minimum size percentage
CHARACTER_MAX_SIZE = 200  # Maximum size percentage

# Drag Settings
DRAG_BOUNDARY_ENABLED = False  # True = constrain to screen, False = allow free movement
DRAG_BOUNDARY_MARGIN = 50  # pixels margin from screen edge when boundary is enabled

# Hotkey Settings
HOTKEYS_ENABLED = True
HOTKEY_SHOW_SETTINGS = 'F1'  # Open settings dialog
HOTKEY_SIZE_INCREASE = 'D'   # Increase character size
HOTKEY_SIZE_DECREASE = 'A'   # Decrease character size
HOTKEY_TOGGLE_CHAT = 'B'     # Toggle chat panel
HOTKEY_MOVE_UP = 'W'         # Move character up
HOTKEY_MOVE_DOWN = 'S'       # Move character down
HOTKEY_MOVE_LEFT = 'Q'       # Move character left
HOTKEY_MOVE_RIGHT = 'E'      # Move character right

# Animation Settings
ANIMATION_FRAME_INTERVAL = 150  # milliseconds
ANIMATION_SCALE = 1.0  # Scale factor for sprites

# Behavior Settings
IDLE_DURATION_MIN = 2000  # milliseconds
IDLE_DURATION_MAX = 5000
WALK_DURATION_MIN = 3000
WALK_DURATION_MAX = 6000
WALK_SPEED = 5  # pixels per frame - increased for visible movement

# Physics Settings - Gravity System
GRAVITY_ENABLED = True  # Enable gravity effect on character
GRAVITY_ACCELERATION = 0.5  # pixels per frame squared (gravity strength)
MAX_FALL_SPEED = 15  # pixels per frame (terminal velocity)
GROUND_LEVEL_OFFSET = 50  # pixels buffer above taskbar where character stops

# Dialog Settings
DIALOG_BOX_DURATION = 3000  # milliseconds - how long dialog stays visible
DIALOG_BOX_MAX_WIDTH = 300  # pixels

# Spontaneous Chat Settings - Character speaks to user naturally
SPONTANEOUS_CHAT_ENABLED = True  # Enable character to speak without user input
SPONTANEOUS_CHAT_PROBABILITY = 0.3  # Probability (0-1) to chat during idle (0.3 = 30%)
SPONTANEOUS_CHAT_INTERVAL_MIN = 15000  # Minimum time between spontaneous chats (ms)
SPONTANEOUS_CHAT_INTERVAL_MAX = 45000  # Maximum time between spontaneous chats (ms)
SPONTANEOUS_CHAT_DURATION = 4000  # Duration to show dialog (ms)

# Chat Panel Theme Settings - SINGLE THEME FOR BETTER PERFORMANCE
CHAT_THEME = "modern_green"
CHAT_THEMES = {
    "modern_green": {
        "primary_color": "#4CAF50",
        "secondary_color": "#45a049",
        "background": "rgba(255, 255, 255, 0.95)",
        "text_color": "#333",
        "user_color": "#0066cc",
        "assistant_color": "#009900",
        "border_color": "#4CAF50",
        "input_bg": "#ffffff",
        "panel_bg": "#f9f9f9"
    }
}

# AI Settings
AI_ENABLED = True
AI_TYPE = "gemini"  # "openai", "local", or "gemini"
AI_API_KEY = os.getenv("GEMINI_API_KEY", "")  # Get from environment variable
AI_MODEL = "gemini-2.5-flash"  # Gemini model to use (latest version)
GEMINI_SAFETY_SETTINGS = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE",
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE",
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE",
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE",
    },
]
OLLAMA_URL = "http://localhost:11434"  # For local Ollama (legacy)
OLLAMA_MODEL = "llama2"  # For local Ollama (legacy)

OLLAMA_URL = "http://localhost:11434"  # For local Ollama (legacy)
OLLAMA_MODEL = "llama2"  # For local Ollama (legacy)

# Asset Paths - Support both dev mode and PyInstaller production mode
import sys
if hasattr(sys, 'frozen'):  # Running as compiled exe (PyInstaller)
    BASE_DIR = os.path.dirname(sys.executable)
    # PyInstaller usually puts it in _internal or same directory for folder builds
    _internal_assets = os.path.join(BASE_DIR, '_internal', 'assets')
    _same_dir_assets = os.path.join(BASE_DIR, 'assets')
    
    if os.path.exists(_internal_assets):
        ASSETS_DIR = _internal_assets
    elif os.path.exists(_same_dir_assets):
        ASSETS_DIR = _same_dir_assets
    else:
        # Try parent directory as fallback
        ASSETS_DIR = os.path.join(os.path.dirname(BASE_DIR), 'assets')
else:
    # Development mode - use __file__ path
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ASSETS_DIR = os.path.join(BASE_DIR, "assets")

SPRITES_DIR = os.path.join(ASSETS_DIR, "sprites")
GUGU_CHARACTER_DIR = os.path.join(SPRITES_DIR, "gugu")  # Path to gugu character sprites

# Debug Settings
DEBUG_MODE = False
LOG_LEVEL = "INFO"  # INFO, DEBUG, WARNING, ERROR
