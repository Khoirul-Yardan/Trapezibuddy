# Dialog Manager - Handle character and user dialogue interactions
from PySide6.QtCore import QObject, Signal, QTimer
from utils.logger import setup_logger
import random

logger = setup_logger(__name__)


class DialogManager(QObject):
    """
    Manages dialogue between user and character
    Coordinates with AI responses and visual feedback
    With natural variations and timing
    """
    
    dialog_started = Signal(str)  # Emits speaker type (user, character)
    dialog_ended = Signal()
    
    def __init__(self, main_window):
        """
        Initialize dialog manager
        
        Args:
            main_window: Reference to DesktopAssistantWindow
        """
        super().__init__()
        self.window = main_window
        self.is_in_dialog = False
        self.dialog_queue = []
        
        # Think variation messages
        self.thinking_messages = [
            "Hmm, let me think...",
            "One moment...",
            "Let me consider that...",
            "Interesting question...",
            "Thinking about it...",
            "Analyzing your request...",
            "Let me process that...",
            "Interesting, let me think...",
        ]
        
        # Processing messages
        self.processing_messages = [
            "Processing...",
            "Working on it...",
            "Analyzing...",
            "Let me check...",
            "Computing...",
            "Just a moment...",
            "Calculating...",
            "One sec...",
        ]
        
        # Friendly greetings
        self.greetings = [
            "Halo! Apa kabar?",
            "Hi there! 👋",
            "Halo! Ada yang bisa aku bantu?",
            "Selamat pagi! Senang bertemu denganmu!",
            "Hey! Apa yang bisa aku lakukan untuk mu?",
            "Welcome! Aku siap melayani 😊",
        ]
        
        # Confused responses (when AI doesn't understand)
        self.confused_responses = [
            "Hmm, aku tidak quite mengerti... Bisa dijelaskan lebih detail?",
            "Sorry, bisa diulang? Aku tidak begitu jelas...",
            "Maaf, itu agak membingungkan. Coba jelaskan dengan cara lain?",
            "Hmm... aku tidak 100% mengerti. Bisa diperjelas?",
            "I'm not quite sure what you mean. Could you rephrase that?",
        ]
        
        # Helpful responses
        self.helpful_responses = [
            "Tentu! Aku akan membantu kamu 😊",
            "Of course! Itu pekerjaan ku!",
            "Boleh banget! Mari kita coba bersama...",
            "Dengan senang hati! Mari mulai...",
            "Absolutely! I'm here to help! 💪",
        ]
        
        # Positive affirmations
        self.positive_responses = [
            "That's awesome! 🎉",
            "Great! I love that! 👍",
            "Excellent choice!",
            "Perfect! You're doing great!",
            "Wow! That's wonderful!",
            "I'm impressed! Keep it up! 💯",
        ]
        
        logger.info("DialogManager initialized")
    
    def show_character_response(self, text: str, duration: int = 3000):
        """
        Show character response in bubble
        
        Args:
            text: Response text
            duration: Duration to show (ms)
        """
        if not self.window:
            return
        
        self.is_in_dialog = True
        self.window.show_character_dialog(text, duration)
        self.dialog_started.emit("character")
        
        # Auto-end after duration
        QTimer.singleShot(duration, self._on_dialog_end)
    
    def show_user_input(self, text: str, duration: int = 2000):
        """
        Show user input/message in bubble
        
        Args:
            text: User message text
            duration: Duration to show (ms)
        """
        if not self.window:
            return
        
        self.is_in_dialog = True
        self.window.show_user_dialog(text, duration)
        self.dialog_started.emit("user")
        
        # Auto-end after duration
        QTimer.singleShot(duration, self._on_dialog_end)
    
    def show_multi_turn_dialog(self, turns: list):
        """
        Show multiple dialogue turns in sequence
        
        Args:
            turns: List of dicts with 'speaker' (user/character), 'text', and optional 'duration'
            
        Example:
            turns = [
                {'speaker': 'user', 'text': 'Hello!'},
                {'speaker': 'character', 'text': 'Hi there! How can I help?'},
                {'speaker': 'user', 'text': 'What can you do?'},
                {'speaker': 'character', 'text': 'I can help with many things!'}
            ]
            manager.show_multi_turn_dialog(turns)
        """
        self.dialog_queue = turns.copy()
        self._process_next_dialog()
    
    def _process_next_dialog(self):
        """Process next dialog in queue"""
        if not self.dialog_queue:
            self._on_dialog_end()
            return
        
        dialog = self.dialog_queue.pop(0)
        speaker = dialog.get('speaker', 'character')
        text = dialog.get('text', '')
        duration = dialog.get('duration', 3000 if speaker == 'character' else 2000)
        
        if speaker.lower() == 'user':
            self.show_user_input(text, duration)
        else:
            self.show_character_response(text, duration)
        
        # Schedule next dialog
        next_delay = duration + 500  # 500ms gap between dialogs
        QTimer.singleShot(next_delay, self._process_next_dialog)
    
    def _on_dialog_end(self):
        """Handle dialog end"""
        self.is_in_dialog = False
        self.dialog_ended.emit()
    
    def show_thinking(self):
        """Show character thinking state"""
        self.window.show_character_dialog("Hmm, let me think...", duration=2000)
    
    def show_error(self, error_msg: str = "I didn't understand that"):
        """Show error message"""
        self.window.show_character_dialog(error_msg, duration=3000)
    
    def show_greeting(self):
        """Show random greeting"""
        greetings = [
            "Hello! How can I help you?",
            "Hi there! What can I do for you?",
            "Hey! What's up?",
            "Hello! Nice to see you!",
        ]
        greeting = random.choice(greetings)
        self.show_character_response(greeting)
    
    def show_farewell(self):
        """Show random farewell"""
        farewells = [
            "See you later!",
            "Goodbye! Have a great day!",
            "Take care!",
            "Bye! Come back soon!",
        ]
        farewell = random.choice(farewells)
        self.show_character_response(farewell)
    
    def character_react_happy(self):
        """Character reacts with happiness (size bounce)"""
        original_size = self.window.character_widget.get_character_size()
        self.window.character_widget.set_character_size(original_size + 5)
        QTimer.singleShot(150, lambda: self.window.character_widget.set_character_size(original_size))
    
    def character_react_sad(self):
        """Character reacts with sadness (size shrink)"""
        original_size = self.window.character_widget.get_character_size()
        self.window.character_widget.set_character_size(max(50, original_size - 10))
        QTimer.singleShot(400, lambda: self.window.character_widget.set_character_size(original_size))
    
    def character_react_excited(self):
        """Character reacts with excitement (multiple bounces)"""
        original_size = self.window.character_widget.get_character_size()
        
        def bounce(count=3):
            if count == 0:
                self.window.character_widget.set_character_size(original_size)
                return
            
            is_up = count % 2 == 1
            new_size = original_size + 5 if is_up else original_size
            self.window.character_widget.set_character_size(new_size)
            QTimer.singleShot(100, lambda: bounce(count - 1))
        
        bounce()
    
    def show_ai_response_natural(self, user_message: str, ai_response: str):
        """
        Show AI response with natural timing and thinking state
        
        Args:
            user_message: What user said
            ai_response: AI response to show
        """
        # Show user message
        self.show_user_input(user_message, duration=2000)
        
        # Show thinking message (random)
        thinking_delay = 500
        thinking_msg = random.choice(self.thinking_messages)
        QTimer.singleShot(thinking_delay, lambda: self.window.show_character_dialog(
            thinking_msg, duration=1000
        ))
        
        # Show actual response
        response_delay = thinking_delay + 1500
        QTimer.singleShot(response_delay, lambda: self.window.show_character_dialog(
            ai_response, duration=3500
        ))
        
        logger.info(f"Natural AI response sequence started")
    
    def show_ai_response_with_reaction(self, user_message: str, ai_response: str, reaction: str = "none"):
        """
        Show AI response with character reaction
        
        Args:
            user_message: What user said
            ai_response: AI response
            reaction: happy, sad, excited, or none
        """
        # Show user message
        self.show_user_input(user_message, duration=2000)
        
        # Add reaction
        if reaction == "happy":
            QTimer.singleShot(500, self.character_react_happy)
        elif reaction == "sad":
            QTimer.singleShot(500, self.character_react_sad)
        elif reaction == "excited":
            QTimer.singleShot(500, self.character_react_excited)
        
        # Show response after user message
        response_delay = 2500
        QTimer.singleShot(response_delay, lambda: self.window.show_character_dialog(
            ai_response, duration=3500
        ))
        
        logger.info(f"AI response with {reaction} reaction")
    
    def show_multi_message_response(self, user_message: str, ai_messages: list):
        """
        Show AI response split into multiple messages for more natural feel
        
        Args:
            user_message: What user said
            ai_messages: List of AI response parts to show sequentially
            
        Example:
            messages = [
                "I understand...",
                "That's an interesting point.",
                "Let me help you with that."
            ]
            manager.show_multi_message_response("Help me!", messages)
        """
        # Show user message
        self.show_user_input(user_message, duration=2000)
        
        # Show each AI message with delay
        current_delay = 2500
        for i, msg in enumerate(ai_messages):
            delay = current_delay + (i * 1500)
            duration = 2500 if i < len(ai_messages) - 1 else 3500
            QTimer.singleShot(delay, lambda m=msg, d=duration: self.window.show_character_dialog(m, duration=d))
        
        logger.info(f"Multi-message response: {len(ai_messages)} parts")



# Example usage in main.py:
"""
from system.dialog_manager import DialogManager

# In main():
window = DesktopAssistantWindow()
dialog_manager = DialogManager(window)

# Show simple response
dialog_manager.show_character_response("Hello! How can I help?")

# Show multi-turn conversation
turns = [
    {'speaker': 'user', 'text': 'Hello!'},
    {'speaker': 'character', 'text': 'Hi there! How are you?'},
    {'speaker': 'user', 'text': 'I'm doing great!'},
    {'speaker': 'character', 'text': 'That\'s wonderful!'},
]
dialog_manager.show_multi_turn_dialog(turns)

# Show reactions
dialog_manager.character_react_happy()
dialog_manager.show_character_response("I'm so happy!")
"""
