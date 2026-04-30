#!/usr/bin/env python3
"""
Test chat panel performance and responsiveness
"""

import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from PySide6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget, QLabel, QPushButton
from PySide6.QtCore import QTimer, Qt
from PySide6.QtGui import QFont

from ui.chat_panel import ChatPanel
from utils.logger import setup_logger

logger = setup_logger(__name__)


class ChatPerformanceTest(QMainWindow):
    """Test chat panel performance"""
    
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("Chat Panel Performance Test")
        self.setGeometry(100, 100, 600, 500)
        
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
        
        # Info label
        info = QLabel("Chat Panel Performance Test - Type quickly to test responsiveness")
        info.setFont(QFont("Arial", 11))
        layout.addWidget(info)
        
        # Create chat panel
        self.chat_panel = ChatPanel()
        
        # Buttons to test functionality
        test_layout = QVBoxLayout()
        
        btn_show = QPushButton("Show Chat Panel")
        btn_show.clicked.connect(self.chat_panel.show)
        test_layout.addWidget(btn_show)
        
        btn_test_messages = QPushButton("Add Test Messages (10)")
        btn_test_messages.clicked.connect(self.add_test_messages)
        test_layout.addWidget(btn_test_messages)
        
        btn_theme = QPushButton("Test Theme Switching")
        btn_theme.clicked.connect(self.test_theme_switching)
        test_layout.addWidget(btn_theme)
        
        btn_stress = QPushButton("Stress Test (50 messages)")
        btn_stress.clicked.connect(self.stress_test)
        test_layout.addWidget(btn_stress)
        
        layout.addLayout(test_layout)
        
        # Status label
        self.status_label = QLabel("Ready for testing")
        self.status_label.setStyleSheet("color: #0066cc; font-weight: bold;")
        layout.addWidget(self.status_label)
        
        # Performance metrics
        self.metrics_label = QLabel("Metrics: N/A")
        self.metrics_label.setStyleSheet("color: #666; font-size: 10px;")
        layout.addWidget(self.metrics_label)
        
        # Performance timer
        self.start_time = None
        
        logger.info("Chat Performance Test initialized")
    
    def add_test_messages(self):
        """Add 10 test messages"""
        import time
        
        self.status_label.setText("Adding 10 messages...")
        self.start_time = time.time()
        
        for i in range(10):
            if i % 2 == 0:
                self.chat_panel._add_message("You", f"Test message {i+1}: This is a test message to verify chat responsiveness", is_user=True)
            else:
                self.chat_panel._add_message("Assistant", f"Response {i+1}: Thanks for the message! I'm responding normally without any delays.", is_user=False)
        
        elapsed = time.time() - self.start_time
        self.status_label.setText(f"Added 10 messages in {elapsed:.2f}s")
        self.metrics_label.setText(f"Speed: {10/elapsed:.1f} messages/sec")
        logger.info(f"Added 10 messages in {elapsed:.2f}s ({10/elapsed:.1f} msg/sec)")
    
    def test_theme_switching(self):
        """Test rapid theme switching"""
        import time
        from config.config import CHAT_THEMES
        
        self.status_label.setText("Testing theme switching...")
        self.start_time = time.time()
        
        themes = list(CHAT_THEMES.keys())
        for _ in range(3):  # Cycle through themes 3 times
            for theme in themes:
                self.chat_panel._on_theme_changed(theme)
        
        elapsed = time.time() - self.start_time
        self.status_label.setText(f"Theme switching (9 changes) in {elapsed:.2f}s - OPTIMIZED (no re-render)")
        self.metrics_label.setText(f"Speed: {9/elapsed:.1f} switches/sec")
        logger.info(f"Theme switching complete: {elapsed:.2f}s ({9/elapsed:.1f} switches/sec)")
    
    def stress_test(self):
        """Add 50 messages quickly"""
        import time
        
        self.status_label.setText("Running stress test (50 messages)...")
        self.start_time = time.time()
        
        for i in range(50):
            if i % 2 == 0:
                self.chat_panel._add_message("You", f"Message {i+1}: Lorem ipsum dolor sit amet consectetur", is_user=True)
            else:
                self.chat_panel._add_message("Assistant", f"Response {i+1}: Sed do eiusmod tempor incididunt ut labore", is_user=False)
        
        elapsed = time.time() - self.start_time
        self.status_label.setText(f"Stress test complete: 50 messages in {elapsed:.2f}s")
        self.metrics_label.setText(f"Speed: {50/elapsed:.1f} messages/sec | Avg: {elapsed*1000/50:.1f}ms per message")
        logger.info(f"Stress test: 50 messages in {elapsed:.2f}s ({50/elapsed:.1f} msg/sec)")
    
    def closeEvent(self, event):
        """Cleanup on close"""
        self.chat_panel.close()
        event.accept()


def main():
    app = QApplication(sys.argv)
    
    logger.info("="*60)
    logger.info("Chat Panel Performance Test")
    logger.info("="*60)
    
    test = ChatPerformanceTest()
    test.show()
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
