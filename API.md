# API Documentation - Desktop Assistant 2D

Complete API reference untuk semua komponen.

---

## Table of Contents

1. [AnimationController](#animationcontroller)
2. [CharacterWidget](#characterwidget)
3. [BehaviorController](#behaviorcontroller)
4. [FSM](#fsm)
5. [AIController](#aicontroller)
6. [ActionExecutor](#actionexecutor)
7. [DesktopAssistantWindow](#desktopassistantwindow)

---

## AnimationController

Manages sprite animations dan frame updates.

### Import
```python
from character.animation import AnimationController, Animation
```

### Constructor
```python
controller = AnimationController(width=256, height=256)
```

**Parameters:**
- `width` (int): Widget width in pixels
- `height` (int): Widget height in pixels

### Methods

#### `add_animation(animation: Animation)`
Add animation ke controller.

```python
anim = Animation("idle", pixmap, 64, 64, 4, fps=10)
controller.add_animation(anim)
```

#### `set_animation(animation_name: str) → bool`
Switch ke animation berbeda.

```python
success = controller.set_animation("walk_left")
```

**Returns:** True if successful

#### `update_frame() → QPixmap`
Update dan return current frame.

```python
frame = controller.update_frame()
```

#### `get_current_frame() → QPixmap`
Get current frame tanpa advance.

```python
frame = controller.get_current_frame()
```

#### `load_sprite_image(image_path: str) → QPixmap`
Load sprite image dari file.

```python
pixmap = controller.load_sprite_image("assets/sprites/idle.png")
```

#### `create_placeholder_animation(name: str, color: str = "#FF0000") → bool`
Create placeholder animation.

```python
controller.create_placeholder_animation("idle", "#0000FF")
```

---

## Animation

Represents single animation sequence.

### Constructor
```python
anim = Animation(
    name="idle",
    pixmap=sprite_pixmap,
    frame_width=64,
    frame_height=64,
    num_frames=4,
    fps=10
)
```

**Parameters:**
- `name` (str): Animation name
- `pixmap` (QPixmap): Spritesheet image
- `frame_width` (int): Width of each frame
- `frame_height` (int): Height of each frame
- `num_frames` (int): Number of frames in animation
- `fps` (int): Frames per second

### Properties
- `name` (str): Animation name
- `frame_width` (int): Frame width
- `frame_height` (int): Frame height
- `num_frames` (int): Number of frames
- `fps` (int): Frames per second
- `frames` (List[QPixmap]): Extracted frames

### Methods

#### `get_frame(frame_index: int) → QPixmap`
Get specific frame (with wrapping).

```python
frame = anim.get_frame(0)
```

---

## CharacterWidget

Main display widget untuk character.

### Import
```python
from character.character_widget import CharacterWidget
```

### Constructor
```python
widget = CharacterWidget(parent=None)
```

### Signals

#### `position_changed(int, int)`
Emitted ketika widget di-drag.

```python
widget.position_changed.connect(lambda x, y: print(f"New position: {x}, {y}"))
```

### Methods

#### `set_animation(animation_name: str)`
Switch animation.

```python
widget.set_animation("walk_left")
```

#### `load_spritesheet(...) → bool`
Load spritesheet dan create animation.

```python
widget.load_spritesheet(
    "idle",
    "assets/sprites/idle.png",
    frame_width=64,
    frame_height=64,
    num_frames=4,
    fps=10
)
```

#### `update_animation()`
Update animation frame (called internally by timer).

#### `cleanup()`
Cleanup resources.

```python
widget.cleanup()
```

### Events

#### Mouse Events
- `mousePressEvent` - Start drag
- `mouseMoveEvent` - Drag movement
- `mouseReleaseEvent` - End drag
- `paintEvent` - Render frame

---

## BehaviorController

Manages character behavior using FSM.

### Import
```python
from behavior.behavior_controller import BehaviorController
```

### Constructor
```python
controller = BehaviorController(window_width=1920)
```

**Parameters:**
- `window_width` (int): Screen width for boundary calculations

### Signals

#### `animation_changed(str)`
Emitted ketika animation berubah.

```python
controller.animation_changed.connect(lambda anim: print(f"Animation: {anim}"))
```

#### `walk_started(str)`
Emitted ketika character mulai walk.

```python
controller.walk_started.connect(lambda direction: print(f"Walking {direction}"))
```

#### `walk_stopped()`
Emitted ketika character berhenti walk.

```python
controller.walk_stopped.connect(lambda: print("Stopped"))
```

#### `position_changed(int, int)`
Emitted ketika position berubah.

```python
controller.position_changed.connect(lambda x, y: print(f"Position: {x}, {y}"))
```

### Methods

#### `force_state(state: State)`
Force change ke specific state.

```python
from behavior.fsm import State
controller.force_state(State.WALK_LEFT)
```

#### `set_position(x: int, y: int)`
Set character position (untuk dragging).

```python
controller.set_position(100, 200)
```

#### `get_current_position() → tuple`
Get current position.

```python
x, y = controller.get_current_position()
```

#### `cleanup()`
Cleanup timers.

```python
controller.cleanup()
```

---

## FSM (Finite State Machine)

State machine untuk behavior.

### Import
```python
from behavior.fsm import FSM, State
```

### State Enum
```python
class State(Enum):
    IDLE = "idle"
    WALK_LEFT = "walk_left"
    WALK_RIGHT = "walk_right"
    INTERACT = "interact"
```

### Constructor
```python
fsm = FSM()
```

### Methods

#### `set_state_callback(state: State, callback: Callable)`
Register callback untuk state entry.

```python
fsm.set_state_callback(State.IDLE, lambda: print("Entered IDLE"))
```

#### `transition(event: str) → bool`
Attempt state transition.

```python
success = fsm.transition("walk")
```

**Available events:**
- From IDLE: `walk`, `interact`
- From WALK_LEFT/RIGHT: `stop`, `turn`
- From INTERACT: `done`

#### `set_state(state: State)`
Set current state directly.

```python
fsm.set_state(State.IDLE)
```

#### `get_state() → State`
Get current state.

```python
current = fsm.get_state()
```

---

## AIController

AI command processing.

### Import
```python
from ai.ai_controller import AIController
```

### Constructor
```python
ai = AIController()
```

Configuration dari `config/config.py`:
- `AI_TYPE`: "openai" atau "local"
- `AI_ENABLED`: True/False
- `AI_API_KEY`: OpenAI API key
- `OLLAMA_URL`: Ollama server URL

### Methods

#### `process_command(user_input: str) → Dict[str, Any]`
Process command dan return action.

```python
result = ai.process_command("buka chrome")
# Returns:
# {
#     "intent": "open_app",
#     "action": "open_chrome",
#     "parameters": {},
#     "response": "Membuka Google Chrome..."
# }
```

**Return Dict:**
- `intent` (str): Command intent
- `action` (str): Action to execute
- `parameters` (dict): Action parameters
- `response` (str): Natural language response

#### `get_supported_actions() → List[str]`
Get supported actions.

```python
actions = ai.get_supported_actions()
```

---

## ActionExecutor

Execute system actions.

### Import
```python
from system.action_executor import ActionExecutor
```

### Constructor
```python
executor = ActionExecutor()
```

### Methods

#### `execute(action_name: str, params: Dict = None) → bool`
Execute action.

```python
executor.execute("open_chrome")
executor.execute("mouse_click", {"x": 100, "y": 200})
executor.execute("type_text", {"text": "Hello"})
```

#### `get_available_actions() → list`
Get list of available actions.

```python
actions = executor.get_available_actions()
# ['open_app', 'open_chrome', 'open_notepad', ...]
```

### Available Actions

| Action | Parameters | Description |
|--------|-----------|---|
| `open_app` | app_path | Open application |
| `open_chrome` | - | Open Chrome |
| `open_notepad` | - | Open Notepad |
| `open_calculator` | - | Open Calculator |
| `open_browser` | url | Open URL |
| `mouse_click` | x, y, button | Click mouse |
| `mouse_move` | x, y, duration | Move mouse |
| `type_text` | text, interval | Type text |
| `press_key` | key | Press key |
| `maximize_window` | - | Maximize window |
| `minimize_window` | - | Minimize window |
| `close_window` | - | Close window |
| `volume_up` | - | Increase volume |
| `volume_down` | - | Decrease volume |

---

## DesktopAssistantWindow

Main application window.

### Import
```python
from main_window import DesktopAssistantWindow
```

### Constructor
```python
window = DesktopAssistantWindow()
```

### Properties
- `character_widget` (CharacterWidget): Character widget
- `behavior_controller` (BehaviorController): Behavior controller
- `ai_controller` (AIController): AI controller
- `action_executor` (ActionExecutor): Action executor

### Methods

#### `load_character_sprites(sprite_config: dict = None)`
Load character sprites.

```python
sprite_config = {
    "idle": {
        "path": "assets/sprites/idle.png",
        "frame_width": 64,
        "frame_height": 64,
        "num_frames": 4,
        "fps": 10
    }
}
window.load_character_sprites(sprite_config)
```

#### `process_voice_command(command: str)`
Process voice/text command.

```python
window.process_voice_command("buka chrome")
```

#### `show()`
Show window (dari QMainWindow).

```python
window.show()
```

#### `cleanup()`
Cleanup resources.

```python
window.cleanup()
```

---

## Usage Examples

### Complete Integration

```python
from PySide6.QtWidgets import QApplication
from main_window import DesktopAssistantWindow

app = QApplication([])
window = DesktopAssistantWindow()

# Load sprites
sprite_config = {
    "idle": {
        "path": "assets/sprites/idle.png",
        "frame_width": 64,
        "frame_height": 64,
        "num_frames": 4,
        "fps": 10
    }
}
window.load_character_sprites(sprite_config)

# Show window
window.show()

# Process commands
window.process_voice_command("buka chrome")

app.exec()
```

### Custom Behavior

```python
from behavior.behavior_controller import BehaviorController
from behavior.fsm import State

behavior = BehaviorController()

# Connect to animation changes
behavior.animation_changed.connect(lambda anim: print(f"Now: {anim}"))

# Force state
behavior.force_state(State.WALK_RIGHT)

# Get position
x, y = behavior.get_current_position()
```

### Direct AI Processing

```python
from ai.ai_controller import AIController

ai = AIController()

result = ai.process_command("buka notepad")
print(result)
# {
#     'intent': 'open_app',
#     'action': 'open_notepad',
#     'parameters': {},
#     'response': 'Membuka Notepad...'
# }
```

### Execute Actions

```python
from system.action_executor import ActionExecutor

executor = ActionExecutor()

# Open application
executor.execute("open_chrome")

# Mouse control
executor.execute("mouse_move", {"x": 500, "y": 500, "duration": 1})
executor.execute("mouse_click", {"x": 500, "y": 500})

# Keyboard
executor.execute("type_text", {"text": "Hello World"})
executor.execute("press_key", {"key": "enter"})
```

---

## Error Handling

Semua methods return atau raise exceptions:

```python
try:
    result = ai.process_command("command")
    if result["action"]:
        executor.execute(result["action"], result["parameters"])
except Exception as e:
    print(f"Error: {e}")
```

Check logger output untuk debug info:

```python
from utils.logger import setup_logger
logger = setup_logger(__name__)
logger.info("Message")
logger.debug("Debug info")
logger.error("Error message")
```

---

## Performance Notes

- Animation updates: ~150ms interval (configurable)
- Behavior updates: ~100ms polling
- Walk updates: ~50ms
- AI processing: ~1-5 seconds (depends on model)
- Action execution: Variable

---

## Thread Safety

Main components NOT thread-safe (designed untuk QApplication thread).

For threaded operations, use:
```python
from PySide6.QtCore import QTimer, Slot

def async_operation():
    timer = QTimer()
    timer.timeout.connect(on_timeout)
    timer.start(100)

@Slot()
def on_timeout():
    # Safe to update UI here
    widget.update()
```

---

**Reference complete! Check source code untuk more details.**
