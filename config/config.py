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

# Chat Panel Theme Settings
CHAT_THEME = "modern_green"  # Options: "modern_green", "dark_blue", "light_purple", "vibrant", "ocean"
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
    },
    "dark_blue": {
        "primary_color": "#1E88E5",
        "secondary_color": "#1565C0",
        "background": "rgba(33, 33, 33, 0.98)",
        "text_color": "#E0E0E0",
        "user_color": "#64B5F6",
        "assistant_color": "#81C784",
        "border_color": "#1E88E5",
        "input_bg": "#424242",
        "panel_bg": "#303030"
    },
    "light_purple": {
        "primary_color": "#7C4DFF",
        "secondary_color": "#651FFF",
        "background": "rgba(248, 245, 255, 0.97)",
        "text_color": "#212121",
        "user_color": "#9C27B0",
        "assistant_color": "#7B1FA2",
        "border_color": "#7C4DFF",
        "input_bg": "#ffffff",
        "panel_bg": "#F3E5F5"
    },
    "vibrant": {
        "primary_color": "#FF6B6B",
        "secondary_color": "#EE5A52",
        "background": "rgba(255, 250, 250, 0.96)",
        "text_color": "#2C3E50",
        "user_color": "#FF6B6B",
        "assistant_color": "#4ECDC4",
        "border_color": "#FF6B6B",
        "input_bg": "#ffffff",
        "panel_bg": "#FCE4EC"
    },
    "ocean": {
        "primary_color": "#00BCD4",
        "secondary_color": "#0097A7",
        "background": "rgba(224, 247, 250, 0.95)",
        "text_color": "#01579B",
        "user_color": "#0277BD",
        "assistant_color": "#00838F",
        "border_color": "#00BCD4",
        "input_bg": "#E0F7FA",
        "panel_bg": "#B2EBF2"
    }
}

# AI Settings
AI_ENABLED = True
AI_TYPE = "local"  # "openai" or "local"
AI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AI_MODEL = "gpt-4"
OLLAMA_URL = "http://localhost:11434"  # For local Ollama
OLLAMA_MODEL = "llama2"

# Asset Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
SPRITES_DIR = os.path.join(ASSETS_DIR, "sprites")
GUGU_CHARACTER_DIR = os.path.join(SPRITES_DIR, "gugu")  # Path to gugu character sprites

# Debug Settings
DEBUG_MODE = False
LOG_LEVEL = "INFO"  # INFO, DEBUG, WARNING, ERROR
