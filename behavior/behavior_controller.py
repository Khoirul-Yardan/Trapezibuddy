# Behavior Controller - manages character behavior and FSM
from PySide6.QtCore import QTimer, QObject, Signal
import random
from behavior.fsm import FSM, State
from config.config import (IDLE_DURATION_MIN, IDLE_DURATION_MAX, WALK_DURATION_MIN, 
                           WALK_DURATION_MAX, WALK_SPEED, GRAVITY_ENABLED, 
                           GRAVITY_ACCELERATION, MAX_FALL_SPEED, GROUND_LEVEL_OFFSET)
from system.spontaneous_chat import IdleDialogueEngine
from utils.logger import setup_logger

logger = setup_logger(__name__)


class BehaviorController(QObject):
    """
    Controls character behavior using FSM
    Emits signals for animation and movement
    Includes physics simulation for gravity
    Includes spontaneous dialogue system
    """
    
    # Signals
    animation_changed = Signal(str)  # Emits animation name (idle, walk_left, walk_right)
    walk_started = Signal(str)  # Emits direction (left, right)
    walk_stopped = Signal()
    position_changed = Signal(int, int)  # Emits x, y
    spontaneous_chat_triggered = Signal(dict)  # Emits chat dict with message & type
    
    def __init__(self, window_width: int = 800, screen_height: int = 600, window_height: int = 512):
        super().__init__()
        self.fsm = FSM()
        self.window_width = window_width
        self.screen_height = screen_height
        self.window_height = window_height
        
        # Start at center of screen, near top
        self.current_x = self.window_width // 2
        self.current_y = 100  # Near top
        
        # Physics variables
        self.velocity_y = 0  # Vertical velocity for gravity
        self.is_falling = False  # Whether character is currently falling
        # Ground level accounts for window height to prevent character from falling off screen
        # Formula: screen_height - window_height - buffer = where window bottom reaches taskbar
        self.ground_level = max(self.screen_height - self.window_height - GROUND_LEVEL_OFFSET, 100)
        
        # Spontaneous chat system
        self.dialogue_engine = IdleDialogueEngine(on_spontaneous_chat=self._on_spontaneous_chat)
        self.idle_start_time = 0
        self.current_idle_duration = 0
        
        # Setup FSM callbacks
        self.fsm.set_state_callback(State.IDLE, self._on_enter_idle)
        self.fsm.set_state_callback(State.WALK_LEFT, self._on_enter_walk_left)
        self.fsm.set_state_callback(State.WALK_RIGHT, self._on_enter_walk_right)
        self.fsm.set_state_callback(State.INTERACT, self._on_enter_interact)
        
        # Behavior timer
        self.behavior_timer = QTimer()
        self.behavior_timer.timeout.connect(self._update_behavior)
        self.behavior_timer.start(100)  # Update behavior every 100ms
        
        # Physics/gravity timer (runs faster for smooth gravity)
        self.physics_timer = QTimer()
        self.physics_timer.timeout.connect(self._update_physics)
        self.physics_timer.start(50)  # Physics update every 50ms
        
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
        
        logger.info(f"BehaviorController initialized - screen: {window_width}x{screen_height}, gravity: {GRAVITY_ENABLED}")
        self.fsm.set_state(State.IDLE)
    
    def _update_behavior(self):
        """Update behavior based on FSM state"""
        pass  # Main loop just continues, state timers handle transitions
    
    def _update_physics(self):
        """Update physics - handle gravity"""
        if not GRAVITY_ENABLED:
            return
        
        old_y = self.current_y
        
        # Apply gravity
        if self.current_y < self.ground_level:
            # Character is above ground - apply gravity
            self.is_falling = True
            self.velocity_y = min(self.velocity_y + GRAVITY_ACCELERATION, MAX_FALL_SPEED)
            self.current_y = min(self.current_y + self.velocity_y, self.ground_level)
        else:
            # Character is at or below ground - stop falling
            self.current_y = self.ground_level
            self.velocity_y = 0
            self.is_falling = False
        
        # Emit position change if Y changed
        if old_y != self.current_y:
            self.position_changed.emit(self.current_x, int(self.current_y))
    
    def apply_upward_force(self, force: float = -5):
        """Apply upward force (for jumping or manual upward movement)"""
        self.velocity_y = force
        logger.debug(f"Upward force applied: {force}")
    
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
            self.position_changed.emit(self.current_x, int(self.current_y))
    
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
        import time
        self.animation_changed.emit("idle")
        self._stop_walking()
        self.idle_duration = random.randint(IDLE_DURATION_MIN, IDLE_DURATION_MAX)
        self.idle_start_time = time.time() * 1000  # Current time in milliseconds
        self.state_timer.start(self.idle_duration)
        logger.debug("Entered IDLE state")
        
        # Check for spontaneous chat trigger
        self.dialogue_engine.update(self.idle_start_time, is_idle=True)
    
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
        
        # If gravity is enabled and position is above ground, enable falling
        if GRAVITY_ENABLED and y < self.ground_level:
            self.current_y = y
            self.is_falling = True
            self.velocity_y = 0  # Reset velocity when manually set
        else:
            # Position at or below ground
            self.current_y = self.ground_level if GRAVITY_ENABLED else y
            self.velocity_y = 0
            self.is_falling = False
        
        self.position_changed.emit(x, int(self.current_y))
        logger.debug(f"Position set to ({x}, {int(self.current_y)}), falling: {self.is_falling}")
    
    def move_character_vertical(self, delta_y: int):
        """Move character up or down by delta"""
        new_y = self.current_y + delta_y
        
        # Allow free upward movement
        if delta_y < 0:  # Moving up
            self.current_y = new_y
            self.velocity_y = 0  # Reset gravity when manually moving up
            self.is_falling = False
        else:
            # Moving down - let gravity handle it
            self.set_position(self.current_x, new_y)
        
        self.position_changed.emit(self.current_x, int(self.current_y))
        logger.debug(f"Vertical move: delta={delta_y}, new_y={int(self.current_y)}")
    
    def _on_spontaneous_chat(self, chat_dict: dict):
        """Handle spontaneous chat trigger from IdleDialogueEngine"""
        logger.info(f"Spontaneous chat: {chat_dict['type']}")
        self.spontaneous_chat_triggered.emit(chat_dict)
    
    def cleanup(self):
        """Cleanup timers"""
        self.behavior_timer.stop()
        self.physics_timer.stop()
        self.walk_timer.stop()
        self.state_timer.stop()
