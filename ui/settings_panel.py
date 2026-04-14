# Settings Panel - Initial configuration dialog
from PySide6.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QLabel, QSlider, QPushButton, QGroupBox
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont
from config.config import CHARACTER_MIN_SIZE, CHARACTER_MAX_SIZE, CHARACTER_SIZE
from utils.logger import setup_logger

logger = setup_logger(__name__)


class SettingsPanel(QDialog):
    """
    Initial settings panel shown at startup
    Allows user to configure:
    - Character size
    - Other preferences
    """
    
    settings_changed = Signal(dict)  # Emits settings dict
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Settings to return
        self.settings = {
            'character_size': CHARACTER_SIZE,
            'accepted': False
        }
        
        self._setup_ui()
        logger.info("SettingsPanel initialized")
    
    def _setup_ui(self):
        """Setup UI elements"""
        self.setWindowTitle("Desktop Assistant - Initial Settings")
        self.setFixedWidth(400)
        self.setStyleSheet("""
            QDialog {
                background-color: #f5f5f5;
                border-radius: 10px;
            }
            QGroupBox {
                color: #333;
                border: 1px solid #ddd;
                border-radius: 5px;
                margin-top: 10px;
                padding-top: 10px;
                font-weight: bold;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 3px 0 3px;
            }
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 10px;
                font-weight: bold;
                font-size: 12px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:pressed {
                background-color: #3d8b40;
            }
            QSlider::groove:horizontal {
                background: #ddd;
                height: 8px;
                margin: 0;
                border-radius: 4px;
            }
            QSlider::handle:horizontal {
                background: #4CAF50;
                width: 18px;
                margin: -5px -9px;
                border-radius: 9px;
            }
            QLabel {
                color: #333;
            }
        """)
        
        # Main layout
        layout = QVBoxLayout()
        layout.setSpacing(15)
        layout.setContentsMargins(20, 20, 20, 20)
        
        # Title
        title = QLabel("🤖 Desktop Assistant Settings")
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title.setFont(title_font)
        layout.addWidget(title)
        
        # Character Size Group
        size_group = QGroupBox("Character Size")
        size_layout = QVBoxLayout()
        
        # Size description
        size_desc = QLabel("Adjust the character display size:")
        size_desc.setStyleSheet("color: #666;")
        size_layout.addWidget(size_desc)
        
        # Slider for size
        size_container = QHBoxLayout()
        self.size_slider = QSlider(Qt.Horizontal)
        self.size_slider.setMinimum(CHARACTER_MIN_SIZE)
        self.size_slider.setMaximum(CHARACTER_MAX_SIZE)
        self.size_slider.setValue(CHARACTER_SIZE)
        self.size_slider.setTickPosition(QSlider.TicksBelow)
        self.size_slider.setTickInterval(10)
        self.size_slider.valueChanged.connect(self._on_size_changed)
        
        self.size_label = QLabel(f"{CHARACTER_SIZE}%")
        self.size_label.setMinimumWidth(40)
        self.size_label.setStyleSheet("font-weight: bold; color: #4CAF50;")
        
        size_container.addWidget(QLabel("Size:"))
        size_container.addWidget(self.size_slider)
        size_container.addWidget(self.size_label)
        size_layout.addLayout(size_container)
        
        # Size preview info
        size_info = QLabel("Small = 50% | Normal = 100% | Large = 150%+")
        size_info.setStyleSheet("color: #999; font-size: 11px;")
        size_layout.addWidget(size_info)
        
        size_group.setLayout(size_layout)
        layout.addWidget(size_group)
        
        # Buttons
        button_layout = QHBoxLayout()
        button_layout.setSpacing(10)
        
        # Start button
        start_btn = QPushButton("Start Application ✓")
        start_btn.setMinimumHeight(40)
        start_btn.clicked.connect(self._on_start_clicked)
        button_layout.addWidget(start_btn)
        
        layout.addStretch()
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
    
    def _on_size_changed(self, value):
        """Handle size slider change"""
        self.settings['character_size'] = value
        self.size_label.setText(f"{value}%")
        logger.debug(f"Character size changed to: {value}%")
    
    def _on_start_clicked(self):
        """Start application with selected settings"""
        self.settings['accepted'] = True
        logger.info(f"Settings accepted: {self.settings}")
        self.accept()
    
    def get_settings(self) -> dict:
        """Get current settings"""
        return self.settings.copy()
