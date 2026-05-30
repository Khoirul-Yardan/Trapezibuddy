# Character Selection Dialog - Initial character picker when app starts
from PySide6.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QLabel, QFrame
from PySide6.QtCore import Qt, Signal, QSize
from PySide6.QtGui import QFont, QColor, QPixmap, QIcon
from utils.logger import setup_logger

logger = setup_logger(__name__)


class CharacterSelectionDialog(QDialog):
    """
    Character selection dialog shown at application startup
    Allows user to choose between different characters:
    - Character 1 (Size) - default character
    - Character 2 (Goldship) - alternative character
    """
    
    character_selected = Signal(str)  # Emits 'size' or 'goldship'
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.selected_character = None
        
        self._setup_ui()
        logger.info("CharacterSelectionDialog initialized")
    
    def _setup_ui(self):
        """Setup the UI for character selection"""
        self.setWindowTitle("Select Your Character")
        self.setFixedSize(600, 400)
        self.setWindowFlags(Qt.Dialog | Qt.WindowStaysOnTopHint)
        self.setAttribute(Qt.WA_TranslucentBackground, False)
        
        # Stylesheet for modern appearance
        self.setStyleSheet("""
            QDialog {
                background-color: #f0f0f0;
                border-radius: 10px;
            }
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 14px;
                padding: 15px;
                min-height: 100px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:pressed {
                background-color: #3d8b40;
            }
            QLabel {
                color: #333;
                font-weight: bold;
            }
            #titleLabel {
                font-size: 24px;
                margin-bottom: 20px;
            }
            #cardFrame {
                background-color: white;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 15px;
            }
            #cardFrame:hover {
                border: 2px solid #4CAF50;
                background-color: #f9f9f9;
            }
        """)
        
        # Main layout
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(30, 30, 30, 30)
        main_layout.setSpacing(20)
        
        # Title
        title = QLabel("Choose Your Character")
        title_font = QFont()
        title_font.setPointSize(20)
        title_font.setBold(True)
        title.setFont(title_font)
        title.setAlignment(Qt.AlignCenter)
        title.setObjectName("titleLabel")
        main_layout.addWidget(title)
        
        # Subtitle
        subtitle = QLabel("Pick the character you want to interact with")
        subtitle_font = QFont()
        subtitle_font.setPointSize(11)
        subtitle.setFont(subtitle_font)
        subtitle.setAlignment(Qt.AlignCenter)
        subtitle.setStyleSheet("color: #666; margin-bottom: 20px;")
        main_layout.addWidget(subtitle)
        
        # Characters layout
        characters_layout = QHBoxLayout()
        characters_layout.setSpacing(20)
        
        # Character 1 - Size (Default)
        character1_frame = self._create_character_card(
            "Character 1",
            "Size",
            "Default friendly character\nwith fun animations",
            "size"
        )
        characters_layout.addWidget(character1_frame)
        
        # Character 2 - Goldship
        character2_frame = self._create_character_card(
            "Character 2",
            "Goldship",
            "Alternative character\nwith unique style",
            "goldship"
        )
        characters_layout.addWidget(character2_frame)
        
        main_layout.addLayout(characters_layout)
        
        # Spacer
        main_layout.addStretch()
    
    def _create_character_card(self, title: str, name: str, description: str, character_id: str) -> QFrame:
        """
        Create a character selection card
        
        Args:
            title: Card title (e.g., "Character 1")
            name: Character name (e.g., "Size")
            description: Character description
            character_id: ID to emit when selected (e.g., "size" or "goldship")
        
        Returns:
            QFrame with card layout
        """
        frame = QFrame()
        frame.setObjectName("cardFrame")
        frame.setCursor(Qt.PointingHandCursor)
        
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(15)
        
        # Card title
        card_title = QLabel(title)
        card_title_font = QFont()
        card_title_font.setPointSize(12)
        card_title_font.setBold(True)
        card_title.setFont(card_title_font)
        card_title.setStyleSheet("color: #666;")
        layout.addWidget(card_title)
        
        # Character name (big)
        char_name = QLabel(name)
        char_name_font = QFont()
        char_name_font.setPointSize(18)
        char_name_font.setBold(True)
        char_name.setFont(char_name_font)
        char_name.setStyleSheet("color: #4CAF50;")
        layout.addWidget(char_name)
        
        # Description
        desc = QLabel(description)
        desc_font = QFont()
        desc_font.setPointSize(10)
        desc.setFont(desc_font)
        desc.setStyleSheet("color: #999; line-height: 1.5;")
        desc.setAlignment(Qt.AlignLeft | Qt.AlignTop)
        layout.addWidget(desc)
        
        # Select button
        select_btn = QPushButton(f"Select {name}")
        select_btn.clicked.connect(lambda: self._select_character(character_id))
        layout.addWidget(select_btn)
        
        layout.addStretch()
        
        return frame
    
    def _select_character(self, character_id: str):
        """
        Handle character selection
        
        Args:
            character_id: ID of selected character ('size' or 'goldship')
        """
        self.selected_character = character_id
        logger.info(f"Character selected: {character_id}")
        self.character_selected.emit(character_id)
        self.accept()
    
    def get_selected_character(self) -> str:
        """Get the selected character ID"""
        return self.selected_character
