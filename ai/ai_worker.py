# AI Worker - runs AI processing in background thread
from PySide6.QtCore import QThread, Signal
from typing import Dict, Any
from utils.logger import setup_logger

logger = setup_logger(__name__)


class AIWorker(QThread):
    """
    Worker thread for AI processing
    Prevents UI freezing during AI API calls
    """
    
    # Signal emitted when AI response is ready
    response_ready = Signal(dict)
    # Signal emitted on error
    error_occurred = Signal(str)
    
    def __init__(self, ai_controller, user_input: str):
        super().__init__()
        self.ai_controller = ai_controller
        self.user_input = user_input
        
    def run(self):
        """Run in background thread"""
        try:
            logger.debug(f"AI Worker: Processing input in background thread")
            result = self.ai_controller.process_command(self.user_input)
            logger.debug(f"AI Worker: Got response, emitting signal")
            self.response_ready.emit(result)
        except Exception as e:
            logger.error(f"AI Worker error: {e}")
            self.error_occurred.emit(str(e))
