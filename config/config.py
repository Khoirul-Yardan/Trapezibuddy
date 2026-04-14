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

# Animation Settings
ANIMATION_FRAME_INTERVAL = 150  # milliseconds
ANIMATION_SCALE = 1.0  # Scale factor for sprites

# Behavior Settings
IDLE_DURATION_MIN = 2000  # milliseconds
IDLE_DURATION_MAX = 5000
WALK_DURATION_MIN = 3000
WALK_DURATION_MAX = 6000
WALK_SPEED = 5  # pixels per frame - increased for visible movement

# Dialog Settings
DIALOG_BOX_DURATION = 3000  # milliseconds - how long dialog stays visible
DIALOG_BOX_MAX_WIDTH = 300  # pixels

# AI Settings
AI_ENABLED = True
AI_TYPE = "local"  # "openai" or "local"
AI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AI_MODEL = "gpt-4"
OLLAMA_URL = "http://localhost:11434"  # For local Ollama
OLLAMA_MODEL = "mistral"

# Asset Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
SPRITES_DIR = os.path.join(ASSETS_DIR, "sprites")
GUGU_CHARACTER_DIR = os.path.join(SPRITES_DIR, "gugu")  # Path to gugu character sprites

# Debug Settings
DEBUG_MODE = False
LOG_LEVEL = "INFO"  # INFO, DEBUG, WARNING, ERROR
