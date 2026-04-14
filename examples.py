"""
Example: Complete Implementation
Demonstrates all features working together

Run: python examples/complete_example.py
"""

import sys
import os

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLineEdit, QPushButton
from PySide6.QtCore import Qt, QTimer
from main_window import DesktopAssistantWindow
from utils.logger import setup_logger
from utils.asset_generator import generate_all_placeholder_sprites, get_sprite_config

logger = setup_logger(__name__)


class CompleteExample:
    """
    Complete working example with UI for commands
    """
    
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.window = DesktopAssistantWindow()
        self.command_count = 0
        self.setup()
    
    def setup(self):
        """Setup example application"""
        # Generate sprites if needed
        logger.info("Setting up complete example...")
        generate_all_placeholder_sprites()
        
        # Show assistant window
        self.window.show()
        
        # Setup auto-demo
        self.demo_timer = QTimer()
        self.demo_timer.timeout.connect(self._demo_step)
        self.demo_timer.start(3000)  # Demo every 3 seconds
        
        logger.info("Example setup complete")
    
    def _demo_step(self):
        """Demo different commands"""
        commands = [
            "buka chrome",
            "buka notepad",
            "halo",
            "search google",
            "kalkulator"
        ]
        
        if self.command_count < len(commands):
            cmd = commands[self.command_count]
            logger.info(f"▶ DEMO COMMAND #{self.command_count + 1}: {cmd}")
            self.window.process_voice_command(cmd)
            self.command_count += 1
        else:
            logger.info("✓ Demo completed!")
            self.demo_timer.stop()
    
    def run(self):
        """Run application"""
        logger.info("Starting complete example...")
        sys.exit(self.app.exec())


class CommandConsoleExample:
    """
    Example with interactive command input
    Run this untuk manual command testing
    """
    
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.window = DesktopAssistantWindow()
        self.setup_ui()
    
    def setup_ui(self):
        """Create simple command input UI"""
        generate_all_placeholder_sprites()
        
        # Show main window
        self.window.show()
        
        # Print usage info
        logger.info("="*60)
        logger.info("Command Console Example")
        logger.info("="*60)
        logger.info("""
Available commands:
- "buka chrome" → Open Chrome
- "buka notepad" → Open Notepad
- "kalkulator" → Open Calculator
- "search" → Open Google
- "hello" → Say hello

Enter command in console and press Enter:
""")
        
        # Setup input loop
        self.input_timer = QTimer()
        self.input_timer.timeout.connect(self._get_input)
        self.input_timer.start(100)
    
    def _get_input(self):
        """Get user input (simplified)"""
        # This is a simplified version - real implementation would need
        # more sophisticated input handling
        pass
    
    def run(self):
        """Run application"""
        sys.exit(self.app.exec())


def example_animation_control():
    """Example: Control animations manually"""
    from character.animation import AnimationController, Animation
    from PySide6.QtGui import QPixmap
    
    logger.info("Example: Animation Control")
    
    # Create animation controller
    anim_ctrl = AnimationController(256, 256)
    
    # Create placeholder animation
    pixmap = QPixmap(256, 256)
    pixmap.fill("blue")
    
    anim = Animation("test_idle", pixmap, 64, 64, 4, fps=10)
    anim_ctrl.add_animation(anim)
    
    # Switch animation
    anim_ctrl.set_animation("test_idle")
    
    # Update frame
    frame = anim_ctrl.update_frame()
    logger.info(f"Got frame: {type(frame)}")
    logger.info("✓ Animation control working")


def example_dialog_and_size():
    """
    Example: Dialog system and character size control
    
    Demonstrates:
    - Showing dialog bubbles
    - Size adjustment
    - Dialog manager with multi-turn conversations
    """
    app = QApplication(sys.argv)
    window = DesktopAssistantWindow()
    
    # Generate and load sprites
    logger.info("Loading assets...")
    generate_all_placeholder_sprites()
    sprite_config = get_sprite_config()
    window.load_character_sprites(sprite_config)
    
    # Show window
    window.show()
    logger.info("Window shown - Press D/U for dialog, +/- for size")
    logger.info("\nAvailable controls:")
    logger.info("  D: Show character dialog (test)")
    logger.info("  U: Show user dialog (test)")
    logger.info("  +: Increase size")
    logger.info("  -: Decrease size")
    logger.info("  ESC: Exit")
    
    # Example: Schedule some dialogs
    QTimer.singleShot(1000, lambda: window.show_character_dialog(
        "Welcome! 👋\nI'm your desktop assistant!",
        duration=3000
    ))
    
    QTimer.singleShot(4500, lambda: window.show_user_dialog(
        "What can you do?",
        duration=2500
    ))
    
    QTimer.singleShot(7500, lambda: window.show_character_dialog(
        "I can help with:\n• File management\n• App launching\n• Task automation",
        duration=4000
    ))
    
    # Example: Multi-turn conversation using DialogManager
    QTimer.singleShot(12000, lambda: demo_dialog_manager(window))
    
    sys.exit(app.exec())


def demo_dialog_manager(window):
    """Demo the dialog manager with multi-turn conversation"""
    from system.dialog_manager import DialogManager
    
    logger.info("\n" + "="*60)
    logger.info("Starting multi-turn conversation demo...")
    logger.info("="*60)
    
    manager = DialogManager(window)
    
    # Example multi-turn conversation
    turns = [
        {'speaker': 'character', 'text': 'I noticed you\'ve been busy!', 'duration': 2500},
        {'speaker': 'user', 'text': 'Yes, very busy!', 'duration': 2000},
        {'speaker': 'character', 'text': 'Can I help you with anything?', 'duration': 2500},
        {'speaker': 'user', 'text': 'Maybe later, thanks!', 'duration': 2000},
        {'speaker': 'character', 'text': 'No problem! I\'ll be here 😊', 'duration': 3000},
    ]
    
    manager.show_multi_turn_dialog(turns)
    
    # Add reactions
    QTimer.singleShot(2000, manager.character_react_happy)
    QTimer.singleShot(7000, manager.character_react_excited)


def example_behavior_control():
    """Example: Control behavior manually"""
    from behavior.behavior_controller import BehaviorController
    from behavior.fsm import State
    import time
    
    logger.info("Example: Behavior Control")
    
    behavior = BehaviorController()
    
    # Connect signals
    behavior.animation_changed.connect(
        lambda anim: logger.info(f"  Animation: {anim}")
    )
    behavior.position_changed.connect(
        lambda x, y: logger.debug(f"  Position: ({x}, {y})")
    )
    
    # Simulate behavior for 5 seconds
    logger.info("Simulating behavior for 5 seconds...")
    for i in range(50):
        time.sleep(0.1)
        state = behavior.fsm.get_state()
        logger.debug(f"State: {state.value}")
    
    behavior.cleanup()
    logger.info("✓ Behavior control working")


def example_ai_processing():
    """Example: AI command processing"""
    from ai.ai_controller import AIController
    
    logger.info("Example: AI Command Processing")
    
    ai = AIController()
    
    test_commands = [
        "buka chrome",
        "buka notepad",
        "halo siapa nama mu",
        "kalkulator",
    ]
    
    for cmd in test_commands:
        logger.info(f"\nCommand: '{cmd}'")
        result = ai.process_command(cmd)
        logger.info(f"  Intent: {result.get('intent')}")
        logger.info(f"  Action: {result.get('action')}")
        logger.info(f"  Response: {result.get('response')}")
    
    logger.info("✓ AI processing working")


def example_action_execution():
    """Example: Execute system actions"""
    from system.action_executor import ActionExecutor
    
    logger.info("Example: Action Execution")
    
    executor = ActionExecutor()
    
    # Get available actions
    actions = executor.get_available_actions()
    logger.info(f"Available actions: {len(actions)}")
    for action in actions[:5]:
        logger.info(f"  - {action}")
    
    logger.info(f"... and {len(actions) - 5} more")
    
    # Test safe action (doesn't actually do anything dangerous)
    logger.info("\nExecuting: open_notepad")
    success = executor.execute("open_notepad")
    logger.info(f"  Result: {'✓ Success' if success else '✗ Failed'}")
    
    logger.info("✓ Action execution working")


def example_ai_integration():
    """
    Example: AI integration with natural dialog and character reactions
    
    Demonstrates:
    - AI response with thinking stage
    - Character reactions (happy, sad, excited)
    - Multi-message responses for natural conversation
    - Dialog following character movement while dragging
    """
    app = QApplication(sys.argv)
    window = DesktopAssistantWindow()
    
    # Generate and load sprites
    logger.info("Loading assets...")
    generate_all_placeholder_sprites()
    sprite_config = get_sprite_config()
    window.load_character_sprites(sprite_config)
    
    # Show window
    window.show()
    logger.info("="*60)
    logger.info("AI Integration Demo")
    logger.info("="*60)
    logger.info("Try dragging character - dialog will follow!")
    logger.info("Keyboard: D=dialog, U=user, +/- =size, ESC=exit")
    
    # Setup dialog manager
    from system.dialog_manager import DialogManager
    manager = DialogManager(window)
    
    # Demo sequence
    def run_demo():
        demo_count = [0]  # Closure counter
        
        def next_demo():
            if demo_count[0] == 0:
                logger.info("\n[1] Natural AI response with thinking stage...")
                manager.show_ai_response_natural(
                    "Apa itu artificial intelligence?",
                    "AI adalah teknologi yang bisa belajar dan membuat keputusan."
                )
            elif demo_count[0] == 1:
                logger.info("\n[2] AI response with happy reaction...")
                manager.show_ai_response_with_reaction(
                    "Aku bisa coding sekarang!",
                    "Wow! Congratulations! Itu awesome! 🎉",
                    reaction="happy"
                )
            elif demo_count[0] == 2:
                logger.info("\n[3] Multi-part response (more conversational)...")
                manager.show_multi_message_response(
                    "Bagaimana cara membuat sebotnya?",
                    [
                        "Bagus, pertanyaan yang bagus!",
                        "Pertama, kamu perlu mempersiapkan bahan-bahan.",
                        "Kemudian ikuti langkah demi langkah dengan teliti.",
                        "Voila! Sekarang kamu punya sebotnya! 🎁"
                    ]
                )
            elif demo_count[0] == 3:
                logger.info("\n[4] Character reacting with excitement...")
                manager.show_ai_response_with_reaction(
                    "Sistem saya nyala!",
                    "YES! Let's go! Ini akan AMAZING! 🚀",
                    reaction="excited"
                )
            elif demo_count[0] == 4:
                logger.info("\n[5] Trying sad reaction...")
                manager.show_ai_response_with_reaction(
                    "Aku sedih...",
                    "Aku mengerti. Semoga segera lebih baik. Aku ada untuk kamu. 💙",
                    reaction="sad"
                )
            else:
                logger.info("\n" + "="*60)
                logger.info("✓ Demo completed!")
                logger.info("="*60)
                logger.info("\nNow try:")
                logger.info("  • Drag character around - dialog follows!")
                logger.info("  • Press D for test dialog")
                logger.info("  • Press U for user dialog")
                logger.info("  • Press +/- to resize")
                logger.info("  • Press ESC to exit")
                return
            
            demo_count[0] += 1
            QTimer.singleShot(6000, next_demo)
        
        next_demo()
    
    QTimer.singleShot(1000, run_demo)
    
    sys.exit(app.exec())


def example_full_integration():
    """Example: Full integration with UI"""
    logger.info("Example: Full Integration (UI)")
    logger.info("This will:")
    logger.info("  1. Show desktop assistant window")
    logger.info("  2. Load sprites")
    logger.info("  3. Start behavior simulation")
    logger.info("  4. Process demo commands")
    logger.info("")
    
    example = CompleteExample()
    example.run()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Desktop Assistant Examples")
    parser.add_argument(
        "--example",
        choices=[
            "animation",
            "behavior",
            "ai",
            "actions",
            "dialog",
            "ai_integration",
            "full",
            "console"
        ],
        default="full",
        help="Which example to run"
    )
    
    args = parser.parse_args()
    
    logger.info("="*60)
    logger.info("Desktop Assistant - Examples")
    logger.info("="*60)
    logger.info("")
    
    if args.example == "animation":
        example_animation_control()
    elif args.example == "behavior":
        example_behavior_control()
    elif args.example == "ai":
        example_ai_processing()
    elif args.example == "actions":
        example_action_execution()
    elif args.example == "dialog":
        example_dialog_and_size()
    elif args.example == "ai_integration":
        example_ai_integration()
    elif args.example == "full":
        example_full_integration()
    elif args.example == "console":
        example = CommandConsoleExample()
        example.run()
    
    logger.info("")
    logger.info("✓ Example completed")
