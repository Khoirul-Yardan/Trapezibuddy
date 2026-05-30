# Bubble Dialog - speech bubble for character dialogue
from PySide6.QtWidgets import QWidget, QLabel, QVBoxLayout
from PySide6.QtCore import Qt, QTimer, Signal, QSize, QRect
from PySide6.QtGui import QColor, QPainter, QPainterPath, QFont, QLinearGradient, QPen
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
        self.pointer_height = 20  # Increased for better visibility
        self.pointer_width = 25
        
        # Position tracking for following character
        self.follow_target_x = None
        self.follow_target_y = None
        self.is_following = False
        
        # Colors - improved design with better aesthetics
        self.bubble_color = QColor(255, 255, 255)  # White background
        self.bubble_accent = QColor(230, 242, 255)  # Light blue accent (more subtle)
        self.text_color = QColor(30, 30, 50)  # Darker text for better readability
        self.border_color = QColor(100, 160, 220)  # Nice blue border
        self.border_width = 2
        self.shadow_color = QColor(0, 0, 0, 80)  # Darker shadow for depth
        
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
            x, y: Screen position for bubble (center of character)
        """
        self.text_content = text
        
        # Calculate bubble size based on text length - IMPROVED
        lines = text.split('\n')
        line_count = len(lines)
        max_line_width = max(len(line) for line in lines) if lines else 0
        
        # Better width estimation - account for actual character sizes
        # Use 9px per character for better accuracy
        char_width = 9
        line_height = 26  # INCREASED from 24 for better text spacing
        
        padding = 30  # Increased padding for better text breathing room
        min_width = 200  # INCREASED from 180 for better minimum size
        max_width = 450  # INCREASED from 400 to accommodate longer text
        
        self.bubble_width = max(min_width, min(max_width, max_line_width * char_width + padding * 2))
        self.bubble_height = max(80, line_count * line_height + padding * 2)  # INCREASED min height from 70
        
        # Set widget size (add extra padding for shadow/effects)
        total_height = self.bubble_height + self.pointer_height + 5
        self.setFixedSize(self.bubble_width + 50, total_height + 15)
        
        # Position bubble - LEBIH DEKAT ke character
        # Place directly above character (reduce distance further)
        window_x = x - self.width() // 2
        window_y = y - total_height - 5  # Lebih dekat! (was -10 before)
        
        # Clamp to screen bounds
        screen_geometry = self.screen().availableGeometry() if self.screen() else QRect(0, 0, 1920, 1080)
        window_x = max(0, min(window_x, screen_geometry.width() - self.width()))
        window_y = max(10, min(window_y, screen_geometry.height() - self.height()))
        
        self.move(window_x, window_y)
        
        # Track position for following
        self.follow_target_x = x
        self.follow_target_y = y
        self.is_following = True
        
        # Start following position updates
        self.follow_timer.start(50)  # Update every 50ms
        
        # Show bubble
        self.show()
        self.raise_()
        
        logger.debug(f"Showing bubble at ({window_x}, {window_y}): '{text[:30]}...'")
        
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
        total_height = self.bubble_height + self.pointer_height + 5
        new_x = x - self.width() // 2
        new_y = y - total_height - 5  # Lebih dekat! (was -10 before)
        
        # Clamp to screen
        screen_geometry = self.screen().availableGeometry() if self.screen() else QRect(0, 0, 1920, 1080)
        new_x = max(0, min(new_x, screen_geometry.width() - self.width()))
        new_y = max(10, min(new_y, screen_geometry.height() - self.height()))
        
        self.move(new_x, new_y)
    
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
        """Paint the speech bubble with improved design"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)
        
        # Bubble position (with padding)
        bubble_x = 12
        bubble_y = 3
        
        # Draw shadow (double layer for depth)
        shadow_offset_1 = 2
        shadow_offset_2 = 4
        shadow_path_1 = QPainterPath()
        shadow_path_1.addRoundedRect(
            bubble_x + shadow_offset_1, bubble_y + shadow_offset_1,
            self.bubble_width, self.bubble_height,
            self.corner_radius, self.corner_radius
        )
        shadow_color_fade = QColor(0, 0, 0, 30)
        painter.fillPath(shadow_path_1, shadow_color_fade)
        
        shadow_path_2 = QPainterPath()
        shadow_path_2.addRoundedRect(
            bubble_x + shadow_offset_2, bubble_y + shadow_offset_2,
            self.bubble_width, self.bubble_height,
            self.corner_radius, self.corner_radius
        )
        painter.fillPath(shadow_path_2, self.shadow_color)
        
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
        
        # Draw bubble fill with gradient (improved)
        gradient = QLinearGradient(bubble_x, bubble_y, bubble_x, bubble_y + self.bubble_height)
        gradient.setColorAt(0, self.bubble_accent)  # Light blue top
        gradient.setColorAt(0.5, self.bubble_color)  # White middle
        gradient.setColorAt(1, self.bubble_color)   # White bottom
        painter.fillPath(path, gradient)
        
        # Draw bubble border (with anti-aliasing)
        border_pen = QPen()
        border_pen.setColor(self.border_color)
        border_pen.setWidth(self.border_width)
        border_pen.setCapStyle(Qt.RoundCap)
        border_pen.setJoinStyle(Qt.RoundJoin)
        painter.setPen(border_pen)
        painter.drawPath(path)
        
        # Draw text with excellent rendering - IMPROVED STYLING
        painter.setPen(self.text_color)
        font = QFont("Segoe UI", 12)  # INCREASED from 10 to 12 for better readability
        font.setStyleStrategy(QFont.PreferAntialias)
        font.setLetterSpacing(QFont.PercentageSpacing, 102)
        painter.setFont(font)
        
        # IMPROVED text rectangle - more padding and proper sizing
        text_rect = QRect(
            int(bubble_x + 15), int(bubble_y + 10),
            int(self.bubble_width - 30), int(self.bubble_height - 20)
        )
        
        painter.setRenderHint(QPainter.TextAntialiasing, True)
        painter.setRenderHint(QPainter.SmoothPixmapTransform, True)
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
