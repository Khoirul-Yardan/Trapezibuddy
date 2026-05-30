# Hints Dialog - Shows tips and keyboard shortcuts on startup
from PySide6.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QLabel, QCheckBox
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QFont, QColor, QIcon
from utils.logger import setup_logger

logger = setup_logger(__name__)


class HintsDialog(QDialog):
    """
    Shows tips and keyboard shortcuts to user on startup
    Can be dismissed or reminded later
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.dont_show_again = False
        
        self._setup_ui()
        logger.info("HintsDialog initialized")
    
    def _setup_ui(self):
        """Setup the UI for hints display"""
        self.setWindowTitle("💡 Tips & Shortcuts")
        self.setFixedSize(500, 400)
        self.setWindowFlags(Qt.Dialog | Qt.WindowStaysOnTopHint)
        self.setAttribute(Qt.WA_TranslucentBackground, False)
        
        # Stylesheet
        self.setStyleSheet("""
            QDialog {
                background-color: #f5f5f5;
                border-radius: 10px;
            }
            QLabel {
                color: #333;
            }
            #titleLabel {
                font-size: 18px;
                font-weight: bold;
                color: #4CAF50;
                margin-bottom: 10px;
            }
            #hintsContent {
                font-size: 11px;
                line-height: 1.6;
                color: #555;
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
            }
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 8px 15px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QCheckBox {
                color: #666;
                font-size: 10px;
            }
        """)
        
        # Main layout
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(15)
        
        # Title
        title = QLabel("💡 Tips & Keyboard Shortcuts")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title.setFont(title_font)
        title.setAlignment(Qt.AlignCenter)
        title.setStyleSheet("color: #4CAF50; margin-bottom: 10px;")
        main_layout.addWidget(title)
        
        # Hints content
        hints_text = """
<b>🎮 KEYBOARD SHORTCUTS:</b>
<b>B</b> - Toggle character movement & chat
<b>A</b> / <b>D</b> - Decrease / Increase size
<b>W</b> / <b>S</b> - Move up / down
<b>Q</b> / <b>E</b> - Move left / right
<b>F1</b> - Show settings
<b>ESC</b> - Exit app

<b>📌 TIPS:</b>
• Press <b>B</b> to enable character movement
• Drag character with mouse to reposition
• Character only moves when movement is enabled
• Use <b>A/D</b> to resize character
• Chat panel appears when you press <b>B</b>

<b>✨ FEATURES:</b>
• Lightweight AI chat integration
• Desktop companion with animations
• Customizable character size
• Always-on-top window
        """
        
        hints_label = QLabel(hints_text)
        hints_label.setObjectName("hintsContent")
        hints_label.setAlignment(Qt.AlignTop | Qt.AlignLeft)
        hints_label.setWordWrap(True)
        main_layout.addWidget(hints_label)
        
        # Dont show again checkbox
        dont_show_cb = QCheckBox("Don't show this again")
        dont_show_cb.setChecked(False)
        dont_show_cb.stateChanged.connect(self._on_dont_show_changed)
        dont_show_cb.setStyleSheet("color: #666; font-size: 10px; padding: 5px;")
        main_layout.addWidget(dont_show_cb)
        
        # Button layout
        button_layout = QHBoxLayout()
        button_layout.addStretch()
        
        # Got it button
        got_it_btn = QPushButton("Got it! 👍")
        got_it_btn.setMinimumWidth(100)
        got_it_btn.clicked.connect(self.accept)
        button_layout.addWidget(got_it_btn)
        
        main_layout.addLayout(button_layout)
    
    def _on_dont_show_changed(self, state):
        """Handle dont show again checkbox"""
        self.dont_show_again = (state == Qt.Checked)
        logger.info(f"Don't show hints again: {self.dont_show_again}")
    
    def should_show_again(self) -> bool:
        """Check if hints should be shown again"""
        return not self.dont_show_again
