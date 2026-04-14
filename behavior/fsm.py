# Finite State Machine for character behavior
from enum import Enum
from typing import Callable, Dict, Optional
import random
from utils.logger import setup_logger

logger = setup_logger(__name__)


class State(Enum):
    """Available character states"""
    IDLE = "idle"
    WALK_LEFT = "walk_left"
    WALK_RIGHT = "walk_right"
    INTERACT = "interact"


class FSM:
    """Finite State Machine for character behavior"""
    
    def __init__(self):
        self.current_state: Optional[State] = None
        self.transitions: Dict[State, Dict[str, State]] = {}
        self.state_callbacks: Dict[State, Callable] = {}
        self.state_timers: Dict[State, int] = {}  # Duration in ms
        self._setup_transitions()
    
    def _setup_transitions(self):
        """Setup state transition rules"""
        self.transitions = {
            State.IDLE: {
                "walk": State.WALK_LEFT,
                "interact": State.INTERACT,
            },
            State.WALK_LEFT: {
                "stop": State.IDLE,
                "turn": State.WALK_RIGHT,
            },
            State.WALK_RIGHT: {
                "stop": State.IDLE,
                "turn": State.WALK_LEFT,
            },
            State.INTERACT: {
                "done": State.IDLE,
            }
        }
    
    def set_state_callback(self, state: State, callback: Callable):
        """Register callback for state entry"""
        self.state_callbacks[state] = callback
        logger.debug(f"Callback registered for state: {state.value}")
    
    def transition(self, event: str) -> bool:
        """Attempt to transition based on event"""
        if self.current_state is None:
            self.set_state(State.IDLE)
            return True
        
        if self.current_state in self.transitions:
            if event in self.transitions[self.current_state]:
                new_state = self.transitions[self.current_state][event]
                self.set_state(new_state)
                return True
        
        logger.warning(f"Invalid transition: {self.current_state.value} -> {event}")
        return False
    
    def set_state(self, state: State):
        """Set current state and call callback"""
        if self.current_state == state:
            return
        
        logger.info(f"State transition: {self.current_state.value if self.current_state else 'None'} -> {state.value}")
        self.current_state = state
        
        if state in self.state_callbacks:
            self.state_callbacks[state]()
    
    def get_state(self) -> State:
        """Get current state"""
        return self.current_state if self.current_state else State.IDLE
