# Chat Panel - Interactive chat with character
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, 
                               QPushButton, QTextEdit, QLabel, QScrollArea, QComboBox)
from PySide6.QtCore import Qt, Signal, QTimer, QSize
from PySide6.QtGui import QFont, QIcon, QColor, QTextCursor
from config.config import DIALOG_BOX_DURATION, CHAT_THEME, CHAT_THEMES
from utils.logger import setup_logger

logger = setup_logger(__name__)


class ChatPanel(QWidget):
    """
    Chat panel for communicating with character
    - Shows conversation history
    - Input field for commands/questions
    - Send button to submit
    - Can be toggled on/off with keyboard shortcut
    - Multiple color themes available
    """
    
    message_sent = Signal(str)  # Emits user message
    panel_closed = Signal()
    theme_changed = Signal(str)  # Emits new theme name
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Message history
        self.messages = []
        
        # Current theme
        self.current_theme = CHAT_THEME
        self.theme_colors = CHAT_THEMES.get(CHAT_THEME, CHAT_THEMES["modern_green"])
        
        # Setup
        self._setup_ui()
        logger.info(f"ChatPanel initialized with theme: {self.current_theme}")
    
    def _setup_ui(self):
        """Setup UI with current theme"""
        self.setWindowFlags(Qt.Tool | Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        
        # Main layout
        layout = QVBoxLayout()
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(10)
        
        # Header with theme selector
        header_layout = QHBoxLayout()
        
        title = QLabel("💬 Chat with Assistant")
        title_font = QFont()
        title_font.setPointSize(12)
        title_font.setBold(True)
        title.setFont(title_font)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        # Theme selector
        theme_label = QLabel("Theme:")
        header_layout.addWidget(theme_label)
        
        theme_combo = QComboBox()
        theme_combo.addItems(list(CHAT_THEMES.keys()))
        theme_combo.setCurrentText(self.current_theme)
        theme_combo.currentTextChanged.connect(self._on_theme_changed)
        theme_combo.setMaximumWidth(120)
        header_layout.addWidget(theme_combo)
        
        close_btn = QPushButton("✕")
        close_btn.setMaximumWidth(30)
        close_btn.setMinimumHeight(25)
        close_btn.clicked.connect(self.hide_panel)
        header_layout.addWidget(close_btn)
        
        layout.addLayout(header_layout)
        
        # Chat history display
        self.chat_display = QTextEdit()
        self.chat_display.setReadOnly(True)
        self.chat_display.setMinimumHeight(250)
        self.chat_display.setMinimumWidth(350)
        layout.addWidget(self.chat_display)
        
        # Input section
        input_layout = QHBoxLayout()
        input_layout.setSpacing(5)
        
        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Type your message here... (Enter to send)")
        self.input_field.setMinimumHeight(35)
        self.input_field.returnPressed.connect(self._on_send)
        input_layout.addWidget(self.input_field)
        
        # Send button
        send_btn = QPushButton("Send")
        send_btn.setMaximumWidth(70)
        send_btn.setMinimumHeight(35)
        send_btn.clicked.connect(self._on_send)
        input_layout.addWidget(send_btn)
        
        layout.addLayout(input_layout)
        
        # Info text
        info = QLabel("💡 Tip: Press B to toggle chat panel | Type any message or command")
        info.setStyleSheet("""
            color: #666;
            font-size: 10px;
            font-style: italic;
        """)
        layout.addWidget(info)
        
        self.setLayout(layout)
        
        # Apply theme
        self._apply_theme()
    
    def _on_send(self):
        """Handle send button"""
        message = self.input_field.text().strip()
        if not message:
            return
        
        # Add user message to display
        self._add_message("You", message, is_user=True)
        
        # Emit signal for processing
        self.message_sent.emit(message)
        
        # Clear input
        self.input_field.clear()
        self.input_field.setFocus()
        
        logger.debug(f"Chat message sent: {message}")
    
    def _apply_theme(self):
        """Apply current theme to all UI elements"""
        colors = self.theme_colors
        
        # Panel background and border
        self.setStyleSheet(f"""
            ChatPanel {{
                background-color: {colors['background']};
                border: 2px solid {colors['border_color']};
                border-radius: 8px;
            }}
            QLabel {{
                color: {colors['text_color']};
            }}
            QComboBox {{
                background-color: {colors['input_bg']};
                color: {colors['text_color']};
                border: 1px solid {colors['border_color']};
                border-radius: 4px;
                padding: 5px;
                font-size: 10px;
            }}
        """)
        
        # Chat display
        self.chat_display.setStyleSheet(f"""
            QTextEdit {{
                background-color: {colors['panel_bg']};
                border: 1px solid {colors['border_color']};
                border-radius: 4px;
                padding: 10px;
                font-size: 11px;
                font-family: 'Segoe UI', Arial;
                color: {colors['text_color']};
            }}
        """)
        
        # Input field
        self.input_field.setStyleSheet(f"""
            QLineEdit {{
                background-color: {colors['input_bg']};
                border: 1px solid {colors['border_color']};
                border-radius: 4px;
                padding: 8px;
                font-size: 11px;
                color: {colors['text_color']};
            }}
            QLineEdit:focus {{
                border: 2px solid {colors['primary_color']};
            }}
        """)
        
        # Send button
        for widget in self.findChildren(QPushButton):
            if widget.text() == "Send":
                widget.setStyleSheet(f"""
                    QPushButton {{
                        background-color: {colors['primary_color']};
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-weight: bold;
                        font-size: 11px;
                        padding: 5px;
                    }}
                    QPushButton:hover {{ background-color: {colors['secondary_color']}; }}
                    QPushButton:pressed {{ background-color: {colors['primary_color']}; opacity: 0.8; }}
                """)
            elif widget.text() == "✕":
                widget.setStyleSheet(f"""
                    QPushButton {{
                        background-color: #ff4444;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        font-weight: bold;
                    }}
                    QPushButton:hover {{ background-color: #cc0000; }}
                """)
        
        logger.debug(f"Theme applied: {self.current_theme}")
    
    def _on_theme_changed(self, theme_name: str):
        """Handle theme change from combo box"""
        if theme_name in CHAT_THEMES:
            self.current_theme = theme_name
            self.theme_colors = CHAT_THEMES[theme_name]
            self._apply_theme()
            self.theme_changed.emit(theme_name)
            
            # Re-render chat to new theme
            self.chat_display.clear()
            for msg in self.messages:
                self._add_message(msg['sender'], msg['message'], msg['is_user'])
            
            logger.info(f"Theme changed to: {theme_name}")
    
    def _add_message(self, sender: str, message: str, is_user: bool = False):
        """Add message to chat display"""
        cursor = self.chat_display.textCursor()
        cursor.movePosition(QTextCursor.End)
        self.chat_display.setTextCursor(cursor)
        
        # Format message with current theme colors
        colors = self.theme_colors
        if is_user:
            color = colors['user_color']
            prefix = "👤 You"
        else:
            color = colors['assistant_color']
            prefix = "🤖 Assistant"
        
        # Add HTML formatted message
        html = f"""<div style="margin-bottom: 10px;">
            <span style="color: {color}; font-weight: bold;">{prefix}:</span>
            <span style="color: {colors['text_color']}; margin-left: 5px;">{message}</span>
        </div>"""
        
        self.chat_display.insertHtml(html)
        
        # Auto-scroll to bottom
        scrollbar = self.chat_display.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
        
        # Save to history
        self.messages.append({
            'sender': sender,
            'message': message,
            'is_user': is_user
        })
    
    def add_assistant_response(self, message: str):
        """Add assistant response to chat"""
        self._add_message("Assistant", message, is_user=False)
    
    def add_thinking(self):
        """Show thinking indicator"""
        cursor = self.chat_display.textCursor()
        cursor.movePosition(QTextCursor.End)
        self.chat_display.setTextCursor(cursor)
        
        html = """<div style="margin-bottom: 10px;">
            <span style="color: #009900; font-weight: bold;">🤖 Assistant:</span>
            <span style="color: #999; margin-left: 5px; font-style: italic;">Thinking...</span>
        </div>"""
        
        self.chat_display.insertHtml(html)
        
        scrollbar = self.chat_display.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
    
    def clear_messages(self):
        """Clear chat history"""
        self.chat_display.clear()
        self.messages = []
        logger.debug("Chat history cleared")
    
    def hide_panel(self):
        """Hide the chat panel"""
        self.hide()
        self.panel_closed.emit()
        logger.debug("Chat panel hidden")
    
    def show_panel(self):
        """Show the chat panel"""
        self.show()
        self.raise_()
        self.input_field.setFocus()
        logger.debug("Chat panel shown")
    
    def toggle_panel(self):
        """Toggle chat panel visibility"""
        if self.isVisible():
            self.hide_panel()
        else:
            self.show_panel()
    
    def get_message_history(self) -> list:
        """Get chat message history"""
        return self.messages.copy()
