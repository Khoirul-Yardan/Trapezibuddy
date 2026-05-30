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
import argparse

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)


def main():
    """Main application entry point"""
    # Deferred imports for reduced initial RAM usage
    from utils.logger import setup_logger
    import subprocess
    
    logger = setup_logger(__name__)
    
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('--skip-settings', action='store_true')
    parser.add_argument('--character-size', type=int, default=60)
    parser.add_argument('--chat-bridge', action='store_true')
    parser.add_argument('--message', type=str, help="User chat message")
    parser.add_argument('--execute-actions', action='store_true')
    args, _ = parser.parse_known_args()

    if args.chat_bridge:
        # Lazy load chat bridge only when needed
        import chat_bridge
        import json
        import io
        from contextlib import redirect_stdout
        
        chat_bridge._configure_logging_silent()
        swallowed = io.StringIO()
        try:
            with redirect_stdout(swallowed):
                payload = chat_bridge._run(args.message, args.execute_actions)
        except Exception as exc:
            payload = {
                "response": f"Python bridge error: {exc}",
                "intent": "error",
                "actions_executed": 0,
            }
            sys.stdout.buffer.write((json.dumps(payload, ensure_ascii=False) + '\n').encode('utf-8'))
            sys.exit(1)

        sys.stdout.buffer.write((json.dumps(payload, ensure_ascii=False) + '\n').encode('utf-8'))
        sys.exit(0)

    logger.info("="*60)
    logger.info("Desktop Assistant 2D - Starting")
    logger.info("="*60)
    
    # Generate placeholder sprites if they don't exist
    from config.config import SPRITES_DIR
    from pathlib import Path
    from utils.asset_generator import generate_all_placeholder_sprites, get_sprite_config
    from PySide6.QtWidgets import QApplication
    from main_window import DesktopAssistantWindow
    from ui.settings_panel import SettingsPanel
    from ui.character_selection import CharacterSelectionDialog
    from ui.hints_dialog import HintsDialog
    
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
    
    # Helper function for Goldship character selection
    def handle_goldship_selection():
        goldship_path = os.path.join(os.path.dirname(__file__), 'assets', 'GoldShip', 'Goldship.exe')
        if os.path.exists(goldship_path):
            logger.info(f"Launching Goldship.exe: {goldship_path}")
            try:
                subprocess.Popen([goldship_path])
                return True
            except Exception as e:
                logger.warning(f"Failed to launch Goldship.exe: {e}")
        return False
    
    # Character Selection - show before settings
    if not args.skip_settings:
        logger.info("Showing character selection dialog...")
        char_select_dialog = CharacterSelectionDialog()
        if char_select_dialog.exec() != CharacterSelectionDialog.Accepted:
            logger.info("Character selection cancelled by user")
            return
        
        selected_character = char_select_dialog.get_selected_character()
        
        # If Goldship is selected, launch it and exit
        if selected_character == 'goldship' and handle_goldship_selection():
            logger.info("Goldship launched, exiting Python app")
            sys.exit(0)
    
    # Settings flow:
    # - Electron mode: skip Python settings and trust CLI args
    # - Standalone mode: keep old settings panel behavior
    if args.skip_settings:
        initial_size = max(30, min(200, args.character_size))
        logger.info(f"Skipping Python settings panel (Electron mode), character_size={initial_size}%")
    else:
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
    
    # Show hints dialog on first startup
    logger.info("Showing tips and shortcuts dialog...")
    hints_dialog = HintsDialog(window)
    hints_dialog.exec()
    
    # Log tip
    logger.info("💡 Tip: Press B to enable character movement | Press B again for chat!")
    
    # Start application
    logger.info("Application running - Press Ctrl+C to exit")
    sys.exit(app.exec())


if __name__ == "__main__":
    try:
        from utils.logger import setup_logger
        logger = setup_logger(__name__)
        main()
    except KeyboardInterrupt:
        try:
            logger.info("Application interrupted by user")
        except:
            pass
        sys.exit(0)
    except Exception as e:
        try:
            logger.error(f"Application error: {e}", exc_info=True)
        except:
            print(f"Application error: {e}")
        sys.exit(1)
