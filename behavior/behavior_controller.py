# Behavior Controller - manages character behavior and FSM
from PySide6.QtCore import QTimer, QObject, Signal
import random
from behavior.fsm import FSM, State
from config.config import IDLE_DURATION_MIN, IDLE_DURATION_MAX, WALK_DURATION_MIN, WALK_DURATION_MAX, WALK_SPEED
from utils.logger import setup_logger

logger = setup_logger(__name__)


class BehaviorController(QObject):
    """
    Controls character behavior using FSM
    Emits signals for animation and movement
    """
    
    # Signals
    animation_changed = Signal(str)  # Emits animation name (idle, walk_left, walk_right)
    walk_started = Signal(str)  # Emits direction (left, right)
    walk_stopped = Signal()
    position_changed = Signal(int, int)  # Emits x, y
    
    def __init__(self, window_width: int = 800):
        super().__init__()
        self.fsm = FSM()
        self.window_width = window_width
        # Start at center of screen
        self.current_x = self.window_width // 2
        self.current_y = 100  # Near top
        
        # Setup FSM callbacks
        self.fsm.set_state_callback(State.IDLE, self._on_enter_idle)
        self.fsm.set_state_callback(State.WALK_LEFT, self._on_enter_walk_left)
        self.fsm.set_state_callback(State.WALK_RIGHT, self._on_enter_walk_right)
        self.fsm.set_state_callback(State.INTERACT, self._on_enter_interact)
        
        # Behavior timer
        self.behavior_timer = QTimer()
        self.behavior_timer.timeout.connect(self._update_behavior)
        self.behavior_timer.start(100)  # Update behavior every 100ms
        
        # Walking
        self.is_walking = False
        self.walk_direction = None
        self.walk_target_x = None
        self.walk_timer = QTimer()
        self.walk_timer.timeout.connect(self._update_walk)
        self.walk_timer.start(50)  # Walk update every 50ms
        
        # State duration
        self.state_timer = QTimer()
        self.idle_duration = random.randint(IDLE_DURATION_MIN, IDLE_DURATION_MAX)
        self.walk_duration = random.randint(WALK_DURATION_MIN, WALK_DURATION_MAX)
        self.state_timer.timeout.connect(self._on_state_timeout)
        
        logger.info(f"BehaviorController initialized - screen_width: {window_width}")
        self.fsm.set_state(State.IDLE)
    
    def _update_behavior(self):
        """Update behavior based on FSM state"""
        pass  # Main loop just continues, state timers handle transitions
    
    def _update_walk(self):
        """Update character walking"""
        if not self.is_walking or self.walk_target_x is None:
            return
        
        old_x = self.current_x
        
        # Move towards target
        if self.walk_direction == "left":
            if self.current_x > self.walk_target_x:
                self.current_x = max(self.current_x - WALK_SPEED, self.walk_target_x)
            else:
                logger.debug(f"Reached walk target on left: {self.walk_target_x}")
                self._stop_walking()
        elif self.walk_direction == "right":
            if self.current_x < self.walk_target_x:
                self.current_x = min(self.current_x + WALK_SPEED, self.walk_target_x)
            else:
                logger.debug(f"Reached walk target on right: {self.walk_target_x}")
                self._stop_walking()
        
        # Only emit if position changed
        if old_x != self.current_x:
            self.position_changed.emit(self.current_x, self.current_y)
    
    def _on_state_timeout(self):
        """Handle state timeout and transition"""
        current_state = self.fsm.get_state()
        
        if current_state == State.IDLE:
            # Random chance to walk
            if random.random() < 0.6:
                direction = random.choice(["left", "right"])
                if direction == "left":
                    self.fsm.set_state(State.WALK_LEFT)
                else:
                    self.fsm.set_state(State.WALK_RIGHT)
            else:
                self.idle_duration = random.randint(IDLE_DURATION_MIN, IDLE_DURATION_MAX)
                self.state_timer.start(self.idle_duration)
        
        elif current_state == State.WALK_LEFT or current_state == State.WALK_RIGHT:
            self.fsm.set_state(State.IDLE)
    
    def _on_enter_idle(self):
        """Enter idle state"""
        self.animation_changed.emit("idle")
        self._stop_walking()
        self.idle_duration = random.randint(IDLE_DURATION_MIN, IDLE_DURATION_MAX)
        self.state_timer.start(self.idle_duration)
        logger.debug("Entered IDLE state")
    
    def _on_enter_walk_left(self):
        """Enter walk left state"""
        self.animation_changed.emit("walk_left")
        self.walk_direction = "left"
        # Walk to random position on left side of screen, but leave margin
        self.walk_target_x = random.randint(100, max(100, self.window_width // 3))
        self.is_walking = True
        self.walk_timer.start()
        self.walk_duration = random.randint(WALK_DURATION_MIN, WALK_DURATION_MAX)
        self.state_timer.start(self.walk_duration)
        logger.debug(f"Entered WALK_LEFT state - target: {self.walk_target_x}")
    
    def _on_enter_walk_right(self):
        """Enter walk right state"""
        self.animation_changed.emit("walk_right")
        self.walk_direction = "right"
        # Walk to random position on right side of screen, but leave margin
        self.walk_target_x = random.randint(max(self.window_width // 2, 200), self.window_width - 200)
        self.is_walking = True
        self.walk_timer.start()
        self.walk_duration = random.randint(WALK_DURATION_MIN, WALK_DURATION_MAX)
        self.state_timer.start(self.walk_duration)
        logger.debug(f"Entered WALK_RIGHT state - target: {self.walk_target_x}")
    
    def _on_enter_interact(self):
        """Enter interact state"""
        self.animation_changed.emit("interact")
        logger.debug("Entered INTERACT state")
        self.state_timer.start(1000)  # 1 second interact
    
    def _stop_walking(self):
        """Stop walking"""
        self.is_walking = False
        self.walk_target_x = None
        self.walk_timer.stop()
        self.walk_stopped.emit()
    
    def force_state(self, state: State):
        """Force change to specific state"""
        self.state_timer.stop()
        self.fsm.set_state(state)
    
    def get_current_position(self) -> tuple:
        """Get current character position"""
        return (self.current_x, self.current_y)
    
    def set_position(self, x: int, y: int):
        """Set character position (for dragging)"""
        self.is_walking = False
        self.walk_timer.stop()
        self.current_x = x
        self.current_y = y
        self.position_changed.emit(x, y)
        logger.debug(f"Position set to ({x}, {y})")
    
    def cleanup(self):
        """Cleanup timers"""
        self.behavior_timer.stop()
        self.walk_timer.stop()
        self.state_timer.stop()
