# Chat Panel - Interactive chat with character
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, 
                               QPushButton, QTextEdit, QLabel, QScrollArea)
from PySide6.QtCore import Qt, Signal, QTimer, QSize
from PySide6.QtGui import QFont, QIcon, QColor, QTextCursor
from config.config import DIALOG_BOX_DURATION
from utils.logger import setup_logger

logger = setup_logger(__name__)


class ChatPanel(QWidget):
    """
    Chat panel for communicating with character
    - Shows conversation history
    - Input field for commands/questions
    - Send button to submit
    - Can be toggled on/off with keyboard shortcut
    """
    
    message_sent = Signal(str)  # Emits user message
    panel_closed = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Message history
        self.messages = []
        
        # Setup
        self._setup_ui()
        logger.info("ChatPanel initialized")
    
    def _setup_ui(self):
        """Setup UI"""
        self.setWindowFlags(Qt.Tool | Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        
        # Style
        self.setStyleSheet("""
            ChatPanel {
                background-color: rgba(255, 255, 255, 0.95);
                border: 2px solid #4CAF50;
                border-radius: 8px;
            }
        """)
        
        # Main layout
        layout = QVBoxLayout()
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(10)
        
        # Header
        header_layout = QHBoxLayout()
        title = QLabel("💬 Chat with Assistant")
        title_font = QFont()
        title_font.setPointSize(12)
        title_font.setBold(True)
        title.setFont(title_font)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        close_btn = QPushButton("✕")
        close_btn.setMaximumWidth(30)
        close_btn.setMinimumHeight(25)
        close_btn.setStyleSheet("""
            QPushButton {
                background-color: #ff4444;
                color: white;
                border: none;
                border-radius: 3px;
                font-weight: bold;
            }
            QPushButton:hover { background-color: #cc0000; }
        """)
        close_btn.clicked.connect(self.hide_panel)
        header_layout.addWidget(close_btn)
        layout.addLayout(header_layout)
        
        # Chat history display
        self.chat_display = QTextEdit()
        self.chat_display.setReadOnly(True)
        self.chat_display.setMinimumHeight(250)
        self.chat_display.setMinimumWidth(350)
        self.chat_display.setStyleSheet("""
            QTextEdit {
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                font-size: 11px;
                font-family: 'Segoe UI', Arial;
            }
        """)
        layout.addWidget(self.chat_display)
        
        # Input section
        input_layout = QHBoxLayout()
        input_layout.setSpacing(5)
        
        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Type your message here... (Enter to send)")
        self.input_field.setMinimumHeight(35)
        self.input_field.returnPressed.connect(self._on_send)
        self.input_field.setStyleSheet("""
            QLineEdit {
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 8px;
                font-size: 11px;
            }
            QLineEdit:focus {
                border: 2px solid #4CAF50;
            }
        """)
        input_layout.addWidget(self.input_field)
        
        # Send button
        send_btn = QPushButton("Send")
        send_btn.setMaximumWidth(70)
        send_btn.setMinimumHeight(35)
        send_btn.clicked.connect(self._on_send)
        send_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                font-weight: bold;
                font-size: 11px;
            }
            QPushButton:hover { background-color: #45a049; }
            QPushButton:pressed { background-color: #3d8b40; }
        """)
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
    
    def _add_message(self, sender: str, message: str, is_user: bool = False):
        """Add message to chat display"""
        cursor = self.chat_display.textCursor()
        cursor.movePosition(QTextCursor.End)
        self.chat_display.setTextCursor(cursor)
        
        # Format message
        if is_user:
            color = "#0066cc"
            prefix = "👤 You"
        else:
            color = "#009900"
            prefix = "🤖 Assistant"
        
        # Add HTML formatted message
        html = f"""<div style="margin-bottom: 10px;">
            <span style="color: {color}; font-weight: bold;">{prefix}:</span>
            <span style="color: #333; margin-left: 5px;">{message}</span>
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
