#!/usr/bin/env python3
"""
Quick Demo - All Fixes & Features

Test semua perbaikan dan features dalam satu demo sederhana:
1. Dialog mengikuti character saat bergerak
2. Tombol minus (-) bekerja untuk kurangi ukuran
3. AI conversation dengan dialog yang natural dan variatif

Run: python quick_demo.py
"""

import sys
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import QTimer
from main_window import DesktopAssistantWindow
from system.dialog_manager import DialogManager
from utils.asset_generator import generate_all_placeholder_sprites, get_sprite_config
from utils.logger import setup_logger

logger = setup_logger(__name__)


def main():
    app = QApplication(sys.argv)
    
    # Setup window
    logger.info("="*70)
    logger.info("DESKTOP ASSISTANT - QUICK DEMO")
    logger.info("="*70)
    logger.info("\n🎯 Testing all fixes:\n")
    
    window = DesktopAssistantWindow()
    
    # Load sprites
    logger.info("1. Loading assets...")
    generate_all_placeholder_sprites()
    sprite_config = get_sprite_config()
    window.load_character_sprites(sprite_config)
    window.show()
    logger.info("   ✓ Window shown\n")
    
    # Setup dialog manager
    manager = DialogManager(window)
    
    # Demo sequence
    def demo():
        demo_state = [0]
        
        def next_step():
            state = demo_state[0]
            
            if state == 0:
                logger.info("2. Testing dialog following character movement...")
                logger.info("   📍 Drag the character around now!")
                logger.info("   💬 Dialog should FOLLOW the character\n")
                manager.show_character_dialog(
                    "Drag me around!\nI'll follow you! 👋",
                    duration=4000
                )
            
            elif state == 1:
                logger.info("3. Testing keyboard size control...")
                logger.info("   ➕ Press + key to INCREASE size")
                logger.info("   ➖ Press - key to DECREASE size")
                logger.info("   🖱️  Or use mouse wheel\n")
                manager.show_character_dialog(
                    "Try adjusting my size!\n+ or - key, or scroll wheel",
                    duration=4000
                )
            
            elif state == 2:
                logger.info("4. Testing AI conversation with natural dialog...")
                logger.info("   🤖 Showing AI response with thinking stage\n")
                manager.show_ai_response_natural(
                    "Bagaimana cuaca hari ini?",
                    "Cuacanya cerah dan indah! Sempurna untuk beraktivitas! ☀️"
                )
            
            elif state == 3:
                logger.info("5. Testing character reactions...")
                logger.info("   😊 Happy reaction\n")
                manager.show_ai_response_with_reaction(
                    "Aku senang meeting mu!",
                    "Saya juga! Senang bisa membantu mu! 🎉",
                    reaction="happy"
                )
            
            elif state == 4:
                logger.info("6. Testing multi-part responses...")
                logger.info("   💬 Showing responses part by part\n")
                manager.show_multi_message_response(
                    "Bagaimana cara belajar programming?",
                    [
                        "Great question!",
                        "First, learn the basics of logic.",
                        "Then practice with simple projects.",
                        "Finally, build something you love! 💻"
                    ]
                )
            
            else:
                logger.info("="*70)
                logger.info("✅ ALL TESTS COMPLETED!")
                logger.info("="*70)
                logger.info("\n📋 Summary of Fixes:")
                logger.info("  ✓ Dialog mengikuti character saat bergerak")
                logger.info("  ✓ Tombol MINUS (-) bekerja untuk kurangi ukuran")
                logger.info("  ✓ AI conversation terasa natural dengan:")
                logger.info("    - Thinking stage sebelum menjawab")
                logger.info("    - Character reactions (happy, sad, excited)")
                logger.info("    - Multi-part responses for better feel")
                logger.info("    - 20+ variation messages\n")
                logger.info("⌨️  Keyboard Commands:")
                logger.info("  +  : Increase size")
                logger.info("  -  : Decrease size (NOW WORKS!)")
                logger.info("  🖱️  : Mouse wheel for fine size control")
                logger.info("  D  : Test dialog")
                logger.info("  U  : Test user dialog")
                logger.info("  ESC: Exit\n")
                logger.info("Try dragging character while dialog is open - it follows! 🎯\n")
                return
            
            demo_state[0] += 1
            QTimer.singleShot(5500, next_step)
        
        next_step()
    
    # Start demo
    QTimer.singleShot(1000, demo)
    
    logger.info("💡 Controls:")
    logger.info("   • Click and DRAG character to move")
    logger.info("   • Try pressing MINUS (-) key while demo is running")
    logger.info("   • Watch dialog FOLLOW when you drag!\n")
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
