#!/usr/bin/env python3
"""
Quick demonstration of character animation with actual sprites
Shows all emotion states and movement animations
"""

import sys
import os
import time

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from PySide6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QPushButton, QWidget, QLabel
from PySide6.QtCore import QTimer, Qt
from PySide6.QtGui import QFont

from character.character_widget import CharacterWidget
from character.animation import AnimationController
from utils.logger import setup_logger
from utils.asset_generator import get_sprite_config
from config.config import WINDOW_WIDTH, WINDOW_HEIGHT

logger = setup_logger(__name__)


class CharacterAnimationDemo(QMainWindow):
    """Demo window showing character animations"""
    
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("Character Animation Demo - All Emotions & Movements")
        self.setGeometry(100, 100, 600, 400)
        
        # Main widget and layout
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
        
        # Info label
        info_label = QLabel("Loading character animations from assets...")
        info_label.setFont(QFont("Arial", 12))
        layout.addWidget(info_label)
        
        # Create character widget
        self.character_widget = CharacterWidget()
        self.character_widget.setFixedSize(400, 300)
        layout.addWidget(self.character_widget)
        
        # Button panel
        button_widget = QWidget()
        button_layout = QVBoxLayout(button_widget)
        
        self.animation_buttons = {}
        animations_to_test = ['idle', 'happy', 'sad', 'worried', 'neglected', 'walk_left', 'walk_right']
        
        for anim_name in animations_to_test:
            btn = QPushButton(f"🎬 {anim_name.replace('_', ' ').title()}")
            btn.setFont(QFont("Arial", 10))
            btn.clicked.connect(lambda checked=False, name=anim_name: self.play_animation(name))
            button_layout.addWidget(btn)
            self.animation_buttons[anim_name] = btn
        
        layout.addWidget(button_widget)
        
        # Status label
        self.status_label = QLabel("Ready. Click buttons to test animations.")
        self.status_label.setFont(QFont("Arial", 10))
        self.status_label.setStyleSheet("color: #0066cc;")
        layout.addWidget(self.status_label)
        
        # Load sprites
        self.load_sprites()
        
        # Update status
        info_label.setText("✓ Character animations loaded successfully!")
        info_label.setStyleSheet("color: #00cc00;")
        
        logger.info("Character Animation Demo initialized")
    
    def load_sprites(self):
        """Load sprite configuration and apply to character widget"""
        try:
            logger.info("Loading sprite configuration...")
            sprite_config = get_sprite_config()
            
            logger.info(f"Loaded {len(sprite_config)} animations")
            
            for anim_name, config in sprite_config.items():
                sprite_type = config.get('type', 'spritesheet')
                
                if sprite_type == 'sequence' and 'frames' in config:
                    # Load as frame sequence
                    success = self.character_widget.load_frame_sequence(
                        anim_name,
                        config['frames'],
                        config.get('fps', 7)
                    )
                    logger.info(f"{'✓' if success else '✗'} Loaded animation: {anim_name}")
            
            # Set initial animation
            self.character_widget.set_animation("idle")
            logger.info("Set initial animation to: idle")
            
        except Exception as e:
            logger.error(f"Error loading sprites: {e}", exc_info=True)
            self.status_label.setText(f"Error loading sprites: {e}")
            self.status_label.setStyleSheet("color: #cc0000;")
    
    def play_animation(self, animation_name: str):
        """Play specific animation"""
        try:
            self.character_widget.set_animation(animation_name)
            self.status_label.setText(f"Now playing: {animation_name}")
            logger.info(f"Playing animation: {animation_name}")
        except Exception as e:
            logger.error(f"Error playing animation {animation_name}: {e}")
            self.status_label.setText(f"Error: {e}")


def main():
    """Main entry point"""
    app = QApplication(sys.argv)
    
    logger.info("="*60)
    logger.info("Character Animation Demo - Starting")
    logger.info("="*60)
    
    demo = CharacterAnimationDemo()
    demo.show()
    
    logger.info("Demo window shown")
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
