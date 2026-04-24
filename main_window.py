# Main window - desktop overlay window
import os
import subprocess
from PySide6.QtWidgets import QMainWindow
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QIcon
from character.character_widget import CharacterWidget
from character.bubble_dialog import BubbleDialog
from ui.chat_panel import ChatPanel
from behavior.behavior_controller import BehaviorController
from ai.ai_controller import AIController
from system.action_executor import ActionExecutor
from utils.sprite_scanner import SpriteScanner
from config.config import WINDOW_WIDTH, WINDOW_HEIGHT, WINDOW_TITLE, DIALOG_BOX_DURATION, DRAG_BOUNDARY_ENABLED, DRAG_BOUNDARY_MARGIN, HOTKEYS_ENABLED, HOTKEY_SHOW_SETTINGS, HOTKEY_SIZE_INCREASE, HOTKEY_SIZE_DECREASE, HOTKEY_MOVE_UP, HOTKEY_MOVE_DOWN, HOTKEY_MOVE_LEFT, HOTKEY_MOVE_RIGHT, HOTKEY_TOGGLE_CHAT, ASSETS_DIR, SPRITES_DIR
from utils.logger import setup_logger

logger = setup_logger(__name__)


class DesktopAssistantWindow(QMainWindow):
    """
    Main application window
    Desktop overlay with character and behavior
    """
    
    def __init__(self):
        super().__init__()
        
        # Get screen size first
        screen_geometry = self.screen().availableGeometry()
        screen_width = screen_geometry.width()
        screen_height = screen_geometry.height()
        
        # Initialize components
        self.character_widget = CharacterWidget(self)
        self.bubble_dialog = BubbleDialog()  # Speech bubble for dialogue
        self.chat_panel = ChatPanel()  # Chat panel for user interaction
        self.behavior_controller = BehaviorController(window_width=screen_width, screen_height=screen_height, window_height=WINDOW_HEIGHT)  # Pass dimensions
        self.ai_controller = AIController()
        self.action_executor = ActionExecutor()
        self.electron_chat_process = None
        
        # Connect chat panel signals
        self.chat_panel.message_sent.connect(self._on_chat_message)
        
        # Connect signals
        self.behavior_controller.animation_changed.connect(self._on_animation_changed)
        self.behavior_controller.position_changed.connect(self._on_position_changed)
        self.behavior_controller.spontaneous_chat_triggered.connect(self._on_spontaneous_chat)
        self.character_widget.position_changed.connect(self._on_widget_moved)
        
        # Move event for updating dialog position
        self.position_update_timer = QTimer()
        self.position_update_timer.timeout.connect(self._update_dialog_position)
        
        # Setup window
        self._setup_window()
        
        # Position chat panel
        self._setup_chat_panel_position()
        
        # Emit initial position from behavior controller
        init_x, init_y = self.behavior_controller.get_current_position()
        self._on_position_changed(init_x, init_y)
        
        # Command input timer (for demo)
        self.command_timer = QTimer()
        self.command_timer.timeout.connect(self._demo_command)
        
        # Auto-load sprites from assets folder
        self._auto_load_sprites()
        
        logger.info("DesktopAssistantWindow initialized")
    
    def _setup_window(self):
        """Setup frameless, transparent overlay window"""
        # Set window properties
        self.setWindowTitle(WINDOW_TITLE)
        self.setFixedSize(WINDOW_WIDTH, WINDOW_HEIGHT)
        
        # Set window flags for overlay
        self.setWindowFlags(
            Qt.WindowStaysOnTopHint |
            Qt.FramelessWindowHint |
            Qt.Tool |
            Qt.NoDropShadowWindowHint
        )
        
        # Make background transparent
        self.setAttribute(Qt.WA_TranslucentBackground)
        
        # Set widget as central widget
        self.setCentralWidget(self.character_widget)
        
        # Position on screen (center area - should be visible)
        desktop_size = self.screen().availableGeometry()
        x = (desktop_size.width() - WINDOW_WIDTH) // 2
        y = (desktop_size.height() - WINDOW_HEIGHT) // 2
        self.move(max(0, x), max(0, y))
        
        logger.info("Window setup completed")
    
    def _setup_chat_panel_position(self):
        """Setup initial chat panel position"""
        screen_geometry = self.screen().availableGeometry()
        # Position chat panel on right side, top-ish
        chat_x = screen_geometry.width() - 400
        chat_y = 50
        self.chat_panel.move(chat_x, chat_y)
        logger.info("Chat panel positioned")

    def _toggle_electron_chat(self):
        """Toggle Electron chat window process (dev:chat)."""
        if self.electron_chat_process and self.electron_chat_process.poll() is None:
            self._stop_electron_chat()
            return
        self._start_electron_chat()

    def _start_electron_chat(self):
        """Start Electron chat frontend from desktop-app project."""
        project_root = os.path.dirname(os.path.abspath(__file__))
        desktop_app_dir = os.path.join(project_root, 'desktop-app')
        npm_cmd = 'npm.cmd' if os.name == 'nt' else 'npm'

        if not os.path.isdir(desktop_app_dir):
            logger.error(f"desktop-app folder not found: {desktop_app_dir}")
            return

        try:
            self.electron_chat_process = subprocess.Popen(
                [npm_cmd, 'run', 'dev:chat'],
                cwd=desktop_app_dir,
            )
            logger.info("Electron chat started (npm run dev:chat)")
        except Exception as e:
            self.electron_chat_process = None
            logger.error(f"Failed to start Electron chat: {e}")

    def _stop_electron_chat(self):
        """Stop Electron chat frontend process if still running."""
        if not self.electron_chat_process:
            return

        try:
            self.electron_chat_process.terminate()
            self.electron_chat_process.wait(timeout=4)
            logger.info("Electron chat stopped")
        except Exception:
            try:
                self.electron_chat_process.kill()
                logger.info("Electron chat killed")
            except Exception as e:
                logger.warning(f"Failed to stop Electron chat process: {e}")
        finally:
            self.electron_chat_process = None
    
    def _on_animation_changed(self, animation_name: str):
        """Handle animation change from behavior controller"""
        logger.debug(f"Animation changed to: {animation_name}")
        self.character_widget.set_animation(animation_name)
    
    def _on_position_changed(self, x: int, y: int):
        """Handle behavior position change with automatic screen bounds clamping"""
        screen_geometry = self.screen().availableGeometry()
        screen_width = screen_geometry.width()
        screen_height = screen_geometry.height()
        
        # Auto-clamp to screen bounds (both X and Y for all edges)
        # Left/right boundaries
        clamped_x = max(0, min(x, screen_width - WINDOW_WIDTH))
        
        # Top/bottom boundaries (prevent falling off screen)
        clamped_y = max(0, min(y, screen_height - WINDOW_HEIGHT))
        
        # Move the window to the new position
        logger.debug(f"Moving window to: ({clamped_x}, {clamped_y}) [clamped from ({x}, {y})]")
        self.move(clamped_x, clamped_y)
        
        # Start timer to update dialog position
        if not self.position_update_timer.isActive():
            self.position_update_timer.start(50)
    
    def _update_dialog_position(self):
        """Update dialog bubble position to follow character"""
        if self.bubble_dialog.is_following and self.bubble_dialog.isVisible():
            window_pos = self.pos()
            window_center_x = window_pos.x() + WINDOW_WIDTH // 2
            window_top_y = window_pos.y()
            
            self.bubble_dialog.follow_target_x = window_center_x
            self.bubble_dialog.follow_target_y = window_top_y
            self.bubble_dialog.update_position(window_center_x, window_top_y)
        else:
            self.position_update_timer.stop()
    
    def _on_widget_moved(self, x: int, y: int):
        """Handle character widget drag"""
        logger.debug(f"Widget moved to: ({x}, {y})")
        self.behavior_controller.set_position(x, y)
    
    def _auto_load_sprites(self):
        """Automatically scan and load sprites from assets folder"""
        try:
            scanner = SpriteScanner(ASSETS_DIR, SPRITES_DIR)
            sprite_config = scanner.get_animation_config()
            
            if sprite_config:
                logger.info(f"Auto-loaded {len(sprite_config)} sprite animations from assets")
                self.load_character_sprites(sprite_config)
            else:
                logger.info("No sprites found in assets, using placeholders")
                self.character_widget.create_placeholder_animations()
        except Exception as e:
            logger.warning(f"Auto-sprite loading failed: {e}, using placeholders")
            self.character_widget.create_placeholder_animations()
    
    def load_character_sprites(self, sprite_config: dict = None):
        """
        Load character sprites
        
        Args:
            sprite_config: Dict with sprite path and frame info
        """
        if sprite_config is None:
            # Use default placeholders
            logger.info("Using default placeholder animations - no sprite_config provided")
            self.character_widget.create_placeholder_animations()
            return
        
        # Load actual sprites from assets
        try:
            logger.info(f"Loading {len(sprite_config)} sprites from config...")
            for anim_name, config in sprite_config.items():
                # Check if this is a single-frame image (like gugu character assets)
                sprite_type = config.get('type', 'spritesheet')
                
                success = self.character_widget.load_spritesheet(
                    anim_name,
                    config['path'],
                    config.get('frame_width'),
                    config.get('frame_height'),
                    config['num_frames'],
                    config.get('fps', 10),
                    sprite_type=sprite_type
                )
                if success:
                    logger.info(f"Loaded sprite: {anim_name} (type: {sprite_type})")
                else:
                    logger.error(f"Failed to load sprite: {anim_name}")
            
            # Set default animation to idle
            if "idle" in sprite_config:
                self.character_widget.set_animation("idle")
                logger.info("Set initial animation to: idle")
            
            logger.info("All sprites loaded successfully!")
        except Exception as e:
            logger.error(f"Failed to load sprites: {e}", exc_info=True)
            # Fallback to placeholders
            logger.info("Falling back to placeholder animations...")
            self.character_widget.create_placeholder_animations()
    
    def process_voice_command(self, command: str):
        """Process voice or text command"""
        logger.info(f"Processing command: {command}")
        
        result = self.ai_controller.process_command(command)
        logger.info(f"AI Intent: {result.get('intent')}")
        
        action = result.get('action')
        if action:
            params = result.get('parameters', {})
            self.action_executor.execute(action, params)
    
    def show_character_dialog(self, text: str, duration: int = DIALOG_BOX_DURATION):
        """
        Show speech bubble dialog from character
        
        Args:
            text: Dialog text to display
            duration: How long to display (ms)
        """
        if not self.isVisible():
            return
        
        # Calculate position above character
        window_pos = self.pos()
        window_center_x = window_pos.x() + WINDOW_WIDTH // 2
        window_top_y = window_pos.y()
        
        self.bubble_dialog.set_character_colors("assistant")
        self.bubble_dialog.show_text(text, duration, window_center_x, window_top_y)
        logger.info(f"Character dialog: {text[:50]}...")
    
    def show_user_dialog(self, text: str, duration: int = DIALOG_BOX_DURATION):
        """
        Show speech bubble dialog from user
        
        Args:
            text: Dialog text to display
            duration: How long to display (ms)
        """
        if not self.isVisible():
            return
        
        # Calculate position above character
        window_pos = self.pos()
        window_center_x = window_pos.x() + WINDOW_WIDTH // 2
        window_top_y = window_pos.y()
        
        self.bubble_dialog.set_character_colors("user")
        self.bubble_dialog.show_text(text, duration, window_center_x, window_top_y)
        logger.info(f"User dialog: {text[:50]}...")
    
    def _on_chat_message(self, message: str):
        """Handle message from chat panel"""
        logger.info(f"Chat message received: {message}")
        
        # Show thinking state in chat
        self.chat_panel.add_thinking()
        
        # Process with AI
        result = self.ai_controller.process_command(message)
        response = result.get('response', 'Hmm, let me think about that...')
        
        # Execute actions if available (supports multiple actions with delays)
        actions = result.get('actions', [])
        if actions:
            logger.info(f"Executing {len(actions)} action(s)")
            self._execute_actions_sequence(actions)
        elif result.get('action'):
            # Fallback for old single-action format
            action = result.get('action')
            params = result.get('parameters', {})
            logger.info(f"Executing single action: {action}")
            self.action_executor.execute(action, params)
        
        # Add response to chat
        QTimer.singleShot(1500, lambda: self._add_chat_response(response, message))
        
        # Also show in bubble dialog
        self.show_ai_response(message, response)
    
    def _execute_actions_sequence(self, actions: list):
        """Execute multiple actions with delays between them"""
        if not actions:
            return
        
        # Execute first action immediately
        first_action = actions[0]
        self.action_executor.execute(
            first_action.get('action'),
            first_action.get('parameters', {})
        )
        
        # Schedule remaining actions with delays
        cumulative_delay = 0
        for action_data in actions[1:]:
            delay = action_data.get('delay_ms', 0)
            cumulative_delay += delay
            
            action = action_data.get('action')
            params = action_data.get('parameters', {})
            
            QTimer.singleShot(
                cumulative_delay,
                lambda a=action, p=params: self.action_executor.execute(a, p)
            )
    
    def _add_chat_response(self, response: str, original_message: str):
        """Add AI response to chat panel after thinking delay"""
        self.chat_panel.add_assistant_response(response)
        logger.debug(f"Chat response added: {response[:50]}...")
    
    def _on_spontaneous_chat(self, chat_dict: dict):
        """
        Handle spontaneous chat from character behavior
        
        Args:
            chat_dict: Dict with 'type', 'message', 'ai_prompt', 'duration'
        """
        chat_type = chat_dict.get('type', 'idle')
        message = chat_dict.get('message', '')
        duration = chat_dict.get('duration', 4000)
        
        logger.info(f"Spontaneous chat triggered: {chat_type} - '{message[:50]}...'")
        
        # Show the dialogue immediately
        self.show_character_dialog(message, duration=duration)
        
        # Optionally: Generate more natural response via AI
        # This would make the dialogue more dynamic
        # Uncomment the following to use AI for generating responses
        # ai_prompt = chat_dict.get('ai_prompt', '')
        # result = self.ai_controller.process_ollama(ai_prompt)
        # if result:
        #     ai_message = result.get('response', message)
        #     self.show_character_dialog(ai_message, duration=duration)
        #     logger.info(f"AI generated spontaneous: {ai_message[:50]}...")
    
    def show_ai_response(self, user_input: str, ai_response: str = None):
        """
        Show user message followed by AI response with natural timing
        
        Args:
            user_input: What user said
            ai_response: AI response (if None, will get from AI controller)
        """
        if not self.isVisible():
            return
        
        # Show user input immediately
        self.show_user_dialog(user_input, duration=2000)
        
        # Get AI response if not provided
        if ai_response is None:
            result = self.ai_controller.process_command(user_input)
            ai_response = result.get('response', 'Hmm, let me think about that...')
        
        # Show AI response after user dialog
        QTimer.singleShot(2500, lambda: self.show_character_dialog(ai_response, duration=3000))
        
        logger.info(f"AI Response: {ai_response[:50]}...")
    
    def _demo_command(self):
        """Demo command execution (for testing)"""
        # This can be used to demo various commands
        pass
    
    def enable_demo_mode(self):
        """Enable demo mode with sample commands"""
        # Can be used for testing
        pass
    
    def keyPressEvent(self, event):
        """Handle keyboard shortcuts"""
        if event.isAutoRepeat():
            return  # Ignore auto-repeat events
        
        if event.key() == Qt.Key_Escape:
            # ESC - close application
            self.close()
        elif event.text().upper() == HOTKEY_TOGGLE_CHAT:
            # B - toggle Electron chat window (replace legacy PySide chat panel)
            self._toggle_electron_chat()
            logger.info("Electron chat toggled")
        elif event.text().upper() == HOTKEY_SIZE_INCREASE:
            # D - increase size
            self.character_widget.increase_size(5)
            logger.info(f"Character size: {self.character_widget.get_character_size()}%")
        elif event.text().upper() == HOTKEY_SIZE_DECREASE:
            # A - decrease size
            self.character_widget.decrease_size(5)
            logger.info(f"Character size: {self.character_widget.get_character_size()}%")
        elif event.text().upper() == HOTKEY_MOVE_UP:
            # W - move character up
            current_x, current_y = self.behavior_controller.get_current_position()
            self.behavior_controller.move_character_vertical(-20)  # Move up by 20 pixels
            logger.info(f"Character moved up")
        elif event.text().upper() == HOTKEY_MOVE_DOWN:
            # S - move character down (gravity will control if enabled)
            current_x, current_y = self.behavior_controller.get_current_position()
            self.behavior_controller.move_character_vertical(20)  # Move down by 20 pixels
            logger.info(f"Character moved down")
        elif event.text().upper() == HOTKEY_MOVE_LEFT:
            # Q - move character left
            current_x, current_y = self.behavior_controller.get_current_position()
            self.behavior_controller.set_position(max(0, current_x - 20), current_y)
            logger.info(f"Character moved left to ({current_x - 20}, {current_y})")
        elif event.text().upper() == HOTKEY_MOVE_RIGHT:
            # E - move character right
            current_x, current_y = self.behavior_controller.get_current_position()
            self.behavior_controller.set_position(current_x + 20, current_y)
            logger.info(f"Character moved right to ({current_x + 20}, {current_y})")
        elif event.key() == Qt.Key_F1:
            # F1 - show settings dialog
            self._show_settings_dialog()
            logger.info("Settings dialog opened")
        elif event.key() == Qt.Key_Plus or event.key() == Qt.Key_Equal:
            # + / = - increase size
            self.character_widget.increase_size(5)
            logger.info(f"Character size: {self.character_widget.get_character_size()}%")
        elif event.key() == Qt.Key_Minus or event.text() == '-':
            # - / _ - decrease size (handle both minus and underscore)
            self.character_widget.decrease_size(5)
            logger.info(f"Character size: {self.character_widget.get_character_size()}%")
        else:
            super().keyPressEvent(event)
    
    def _show_settings_dialog(self):
        """Show settings dialog for adjusting character properties"""
        from PySide6.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QLabel, QSlider, QPushButton
        from PySide6.QtCore import Qt as QtCore_Qt
        
        dialog = QDialog(self)
        dialog.setWindowTitle("Character Settings")
        dialog.setGeometry(100, 100, 300, 200)
        
        layout = QVBoxLayout()
        
        # Size slider
        size_label = QLabel(f"Character Size: {self.character_widget.get_character_size()}%")
        size_slider = QSlider(QtCore_Qt.Horizontal)
        size_slider.setMinimum(self.character_widget.character_min_size)
        size_slider.setMaximum(self.character_widget.character_max_size)
        size_slider.setValue(self.character_widget.get_character_size())
        
        def update_size(value):
            self.character_widget.set_character_size(value)
            size_label.setText(f"Character Size: {value}%")
        
        size_slider.valueChanged.connect(update_size)
        
        layout.addWidget(QLabel("Size (A/D or slider):"))
        layout.addWidget(size_slider)
        layout.addWidget(size_label)
        
        # Boundary toggle
        boundary_label = QLabel(f"Drag Boundary: {'Enabled' if DRAG_BOUNDARY_ENABLED else 'Disabled (Free Movement)'}")
        layout.addWidget(boundary_label)
        
        # Hotkeys info
        hotkeys_info = QLabel(
            "Hotkeys:\n"
            "A/D - Size\n"
            "W/S - Up/Down\n"
            "Q/E - Left/Right\n"
            "B - Toggle Electron Chat\n"
            "F1 - Settings\n"
            "ESC - Exit"
        )
        hotkeys_info.setStyleSheet("font-size: 10px;")
        layout.addWidget(hotkeys_info)
        
        # OK button
        ok_btn = QPushButton("Close")
        ok_btn.clicked.connect(dialog.accept)
        layout.addWidget(ok_btn)
        
        dialog.setLayout(layout)
        dialog.exec()
    
    def cleanup(self):
        """Cleanup resources"""
        self._stop_electron_chat()
        self.command_timer.stop()
        self.behavior_controller.cleanup()
        self.character_widget.cleanup()
        logger.info("Cleanup completed")
    
    def closeEvent(self, event):
        """Handle window close"""
        self.cleanup()
        event.accept()
