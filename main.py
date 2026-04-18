#!/usr/bin/env python3
import sys
import os
import signal

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from PySide6.QtWidgets import QApplication
from main_window import DesktopAssistantWindow
from ui.settings_panel import SettingsPanel
from utils.logger import setup_logger
from utils.asset_generator import generate_all_placeholder_sprites, get_sprite_config
from config.config import SPRITES_DIR
from pathlib import Path

logger = setup_logger(__name__)


def main():
    logger.info("="*60)
    logger.info("Desktop Assistant 2D - Starting")
    logger.info("="*60)

    # Generate placeholder sprites if needed
    if not Path(SPRITES_DIR).exists() or not list(Path(SPRITES_DIR).glob("*.png")):
        logger.info("Generating placeholder sprites...")
        generate_all_placeholder_sprites()

    app = QApplication(sys.argv)

    # Graceful Ctrl+C
    def signal_handler(signum, frame):
        logger.info("Interrupted by user")
        app.quit()
    signal.signal(signal.SIGINT, signal_handler)

    # Settings panel dulu
    settings_panel = SettingsPanel()
    if settings_panel.exec() != SettingsPanel.Accepted:
        logger.info("Settings cancelled")
        return

    settings = settings_panel.get_settings()
    initial_size = settings.get('character_size', 60)

    # Buat main window
    window = DesktopAssistantWindow()
    window.character_widget.set_character_size(initial_size)

    sprite_config = get_sprite_config()
    window.load_character_sprites(sprite_config)

    window.show()
    logger.info("Window displayed - Press B to toggle chat")

    sys.exit(app.exec())


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Interrupted")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        sys.exit(1)