#!/usr/bin/env python3
"""
Quick Start - Chat & Settings Demo

Test new features:
1. Settings panel on startup
2. Chat panel with B key toggle
3. AI conversation in chat
4. Default smaller character size

Run: python chat_demo.py
"""

import sys
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import QTimer
from main_window import DesktopAssistantWindow
from ui.settings_panel import SettingsPanel
from utils.asset_generator import generate_all_placeholder_sprites, get_sprite_config
from utils.logger import setup_logger

logger = setup_logger(__name__)


def main():
    logger.info("="*70)
    logger.info("DESKTOP ASSISTANT - CHAT & SETTINGS DEMO")
    logger.info("="*70)
    
    app = QApplication(sys.argv)
    
    # Step 1: Settings panel
    logger.info("\n1️⃣  Showing settings panel...")
    logger.info("   Set your preferred character size and click 'Start Application'\n")
    
    settings_panel = SettingsPanel()
    if settings_panel.exec() != SettingsPanel.Accepted:
        logger.info("Settings cancelled. Exiting.")
        return
    
    settings = settings_panel.get_settings()
    size = settings.get('character_size', 60)
    logger.info(f"✓ Settings applied: size = {size}%\n")
    
    # Step 2: Create window and apply settings
    logger.info("2️⃣  Creating main window...")
    generate_all_placeholder_sprites()
    sprite_config = get_sprite_config()
    
    window = DesktopAssistantWindow()
    window.character_widget.set_character_size(size)
    window.load_character_sprites(sprite_config)
    window.show()
    
    logger.info("✓ Window displayed with selected size\n")
    
    # Show info
    def show_info():
        logger.info("="*70)
        logger.info("🎯 DEMO FEATURES")
        logger.info("="*70)
        logger.info("\n⌨️  Keyboard Controls:")
        logger.info("  B  : Toggle chat panel (NEW!)")
        logger.info("  +  : Increase character size")
        logger.info("  -  : Decrease character size")
        logger.info("  D  : Test dialog")
        logger.info("  ESC: Exit\n")
        
        logger.info("💬 Chat Panel:")
        logger.info("  • Press B to open chat")
        logger.info("  • Type your message")
        logger.info("  • Press Enter or click Send")
        logger.info("  • Character responds automatically!")
        logger.info("  • Chat history shown in panel\n")
        
        logger.info("🎨 Character:")
        logger.info(f"  • Current size: {size}% (configurable)")
        logger.info("  • Drag to move around")
        logger.info("  • Resize with +/- keys or mouse wheel")
        logger.info("  • Dialog follows when you drag\n")
        
        logger.info("Try this:")
        logger.info("  1. Press B to open chat panel")
        logger.info("  2. Type: 'Halo! Siapa nama kamu?'")
        logger.info("  3. Press Enter")
        logger.info("  4. Watch character respond!\n")
        
        logger.info("="*70 + "\n")
    
    QTimer.singleShot(500, show_info)
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
