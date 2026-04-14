#!/usr/bin/env python3
"""
Desktop Assistant 2D - Main Entry Point

A desktop overlay assistant with character sprite animation,
behavior system, and AI command processing.

Usage:
    python main.py
"""

import sys
import os

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QIcon
from main_window import DesktopAssistantWindow
from ui.settings_panel import SettingsPanel
from utils.logger import setup_logger
from utils.asset_generator import generate_all_placeholder_sprites

logger = setup_logger(__name__)


def main():
    """Main application entry point"""
    logger.info("="*60)
    logger.info("Desktop Assistant 2D - Starting")
    logger.info("="*60)
    
    # Generate placeholder sprites if they don't exist
    from config.config import SPRITES_DIR
    from pathlib import Path
    from utils.asset_generator import get_sprite_config
    
    if not Path(SPRITES_DIR).exists() or not list(Path(SPRITES_DIR).glob("*.png")):
        logger.info("Generating placeholder sprites...")
        generate_all_placeholder_sprites()
    
    # Create application
    app = QApplication(sys.argv)
    
    # Handle Ctrl+C gracefully
    import signal
    def signal_handler(signum, frame):
        logger.info("Application interrupted by user")
        app.quit()
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Show settings panel first
    logger.info("Showing initial settings panel...")
    settings_panel = SettingsPanel()
    if settings_panel.exec() != SettingsPanel.Accepted:
        logger.info("Settings cancelled by user")
        return
    
    settings = settings_panel.get_settings()
    initial_size = settings.get('character_size', 60)
    logger.info(f"Settings applied: character_size={initial_size}%")
    
    # Create main window
    window = DesktopAssistantWindow()
    
    # Apply initial settings
    window.character_widget.set_character_size(initial_size)
    
    # Load character sprites from assets/sprites
    sprite_config = get_sprite_config()
    window.load_character_sprites(sprite_config)
    
    # Show window
    window.show()
    logger.info("Window displayed")
    
    # Show chat panel help tip
    logger.info("💡 Tip: Press B to toggle chat panel | Type freely and chat with character!")
    
    # Start application
    logger.info("Application running - Press Ctrl+C to exit")
    sys.exit(app.exec())


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Application error: {e}", exc_info=True)
        sys.exit(1)
