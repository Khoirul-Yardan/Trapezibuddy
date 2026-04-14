# Bubble Dialog - speech bubble for character dialogue
from PySide6.QtWidgets import QWidget, QLabel, QVBoxLayout
from PySide6.QtCore import Qt, QTimer, Signal, QSize
from PySide6.QtGui import QColor, QPainter, QPainterPath, QFont
from utils.logger import setup_logger

logger = setup_logger(__name__)


class BubbleDialog(QWidget):
    """
    Speech bubble widget for character dialogue
    Displays text in a rounded bubble with pointer
    """
    
    dialog_closed = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Bubble properties
        self.text_content = ""
        self.bubble_width = 250
        self.bubble_height = 100
        self.corner_radius = 15
        self.pointer_height = 15
        self.pointer_width = 20
        
        # Position tracking for following character
        self.follow_target_x = None
        self.follow_target_y = None
        self.is_following = False
        
        # Colors
        self.bubble_color = QColor(255, 255, 255)  # White background
        self.text_color = QColor(0, 0, 0)  # Black text
        self.border_color = QColor(100, 100, 100)  # Gray border
        self.border_width = 2
        
        # Auto-close timer
        self.auto_close_timer = QTimer()
        self.auto_close_timer.timeout.connect(self.hide_bubble)
        
        # Position update timer (for following)
        self.follow_timer = QTimer()
        self.follow_timer.timeout.connect(self._update_follow_position)
        
        # Setup
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.Tool | Qt.NoDropShadowWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        
        logger.debug("BubbleDialog initialized")
    
    def show_text(self, text: str, duration: int = 3000, x: int = 0, y: int = 0):
        """
        Show text in bubble
        
        Args:
            text: Text to display
            duration: How long to show (ms), 0 = indefinite
            x, y: Screen position for bubble
        """
        self.text_content = text
        
        # Calculate bubble size based on text length
        lines = text.split('\n')
        line_count = len(lines)
        max_line_width = max(len(line) for line in lines)
        
        # Estimate width and height
        char_width = 8  # Approximate pixel width per character
        line_height = 20
        
        padding = 20
        self.bubble_width = max(150, min(300, max_line_width * char_width + padding * 2))
        self.bubble_height = max(60, line_count * line_height + padding * 2)
        
        # Set widget size
        total_height = self.bubble_height + self.pointer_height + 20
        self.setFixedSize(self.bubble_width + 40, total_height)
        
        # Position bubble above character
        self.move(x - self.width() // 2, y - total_height)
        
        # Track position for following
        self.follow_target_x = x
        self.follow_target_y = y
        self.is_following = True
        
        # Start following position updates
        self.follow_timer.start(50)  # Update every 50ms
        
        # Show bubble
        self.show()
        self.raise_()
        
        logger.debug(f"Showing bubble: '{text[:30]}...' at ({x}, {y})")
        
        # Auto-close if duration > 0
        if duration > 0:
            self.auto_close_timer.start(duration)
    
    def _update_follow_position(self):
        """Update bubble position to follow target"""
        if self.is_following and self.follow_target_x is not None:
            self.update_position(self.follow_target_x, self.follow_target_y)
    
    def hide_bubble(self):
        """Hide the bubble"""
        self.auto_close_timer.stop()
        self.follow_timer.stop()
        self.is_following = False
        self.hide()
        self.dialog_closed.emit()
        logger.debug("Bubble hidden")
    
    def update_position(self, x: int, y: int):
        """
        Update bubble position (for following character movement)
        
        Args:
            x, y: Center screen coordinates of character
        """
        total_height = self.bubble_height + self.pointer_height + 20
        new_x = x - self.width() // 2
        new_y = y - total_height
        self.move(new_x, new_y)
        logger.debug(f"Bubble position updated to: ({new_x}, {new_y})")
    
    def set_colors(self, bubble_color: QColor = None, text_color: QColor = None, 
                   border_color: QColor = None):
        """Set bubble colors"""
        if bubble_color:
            self.bubble_color = bubble_color
        if text_color:
            self.text_color = text_color
        if border_color:
            self.border_color = border_color
        self.update()
    
    def paintEvent(self, event):
        """Paint the speech bubble"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # Bubble position (with padding)
        bubble_x = 20
        bubble_y = 10
        
        # Create rounded rectangle path for bubble
        path = QPainterPath()
        path.addRoundedRect(
            bubble_x, bubble_y,
            self.bubble_width, self.bubble_height,
            self.corner_radius, self.corner_radius
        )
        
        # Add pointer (triangle at bottom center)
        pointer_x = bubble_x + self.bubble_width // 2
        pointer_y = bubble_y + self.bubble_height
        
        pointer_path = QPainterPath()
        pointer_path.moveTo(pointer_x - self.pointer_width // 2, pointer_y)
        pointer_path.lineTo(pointer_x + self.pointer_width // 2, pointer_y)
        pointer_path.lineTo(pointer_x, pointer_y + self.pointer_height)
        pointer_path.closeSubpath()
        
        # Combine paths
        path.addPath(pointer_path)
        
        # Draw bubble fill
        painter.fillPath(path, self.bubble_color)
        
        # Draw bubble border
        painter.setPen(self.border_color)
        painter.drawPath(path)
        
        # Draw text
        painter.setPen(self.text_color)
        font = QFont()
        font.setPointSize(10)
        painter.setFont(font)
        
        text_rect = event.rect().adjusted(
            bubble_x + 10, bubble_y + 10,
            -(bubble_x + 10), -self.pointer_height - 10
        )
        
        painter.drawText(
            text_rect,
            Qt.AlignCenter | Qt.TextWordWrap,
            self.text_content
        )
        
        painter.end()
    
    def mouseDoubleClickEvent(self, event):
        """Close bubble on double-click"""
        self.hide_bubble()
    
    def set_character_colors(self, character_name: str = "default"):
        """Set colors based on character type"""
        if character_name.lower() == "user":
            # User message - light blue
            self.set_colors(
                bubble_color=QColor(200, 230, 255),
                text_color=QColor(0, 0, 0),
                border_color=QColor(0, 100, 200)
            )
        elif character_name.lower() == "assistant":
            # Assistant message - light green
            self.set_colors(
                bubble_color=QColor(200, 255, 200),
                text_color=QColor(0, 0, 0),
                border_color=QColor(0, 150, 0)
            )
        else:
            # Default - white
            self.set_colors(
                bubble_color=QColor(255, 255, 255),
                text_color=QColor(0, 0, 0),
                border_color=QColor(100, 100, 100)
            )
