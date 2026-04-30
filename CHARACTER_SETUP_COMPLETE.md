# ✨ Character Animation System - Complete Setup Guide

## 📋 Summary

The character animation system is now **fully functional** and uses the actual sprite assets from the `assets/Sprite Sheet Contents` folder. All emotions and movements are properly set up and ready to use!

### ✓ What's Working

1. **Character Animations** - 7 different animation states:
   - `idle` - Neutral standing position (7 frames)
   - `happy` - Happy emotion (7 frames)
   - `sad` - Sad emotion (7 frames)
   - `worried` - Worried emotion (7 frames)
   - `neglected` - Neglected emotion (7 frames)
   - `walk_left` - Walking left (7 frames)
   - `walk_right` - Walking right (7 frames)

2. **Frame-Based Animation** - Each animation has 7 individual frames loaded from PNG files
3. **Smooth Playback** - 7 FPS animation speed for smooth character movement
4. **Auto-Loading** - Sprites automatically load from assets folder when application starts

---

## 📁 File Structure

```
assets/
└── Sprite Sheet Contents/
    ├── Happy/                 ✓ 7 frames - gugugaga_happy_001.png - 007.png
    ├── Neutral/              ✓ 7 frames - gugugaga_neutral_001.png - 007.png
    ├── Run Left Side/        ✓ 7 frames - gugugaga_runs_001.png - 007.png
    ├── Run Right Side/       ✓ 7 frames - gugugaga_runs_001.png - 007.png
    ├── Sad/                  ✓ 7 frames - gugugaga_sad_001.png - 007.png
    ├── Worried/              ✓ 7 frames - gugugaga_worried_001.png - 007.png
    └── Neglected/            ✓ 7 frames - gugugaga_neglected_001.png - 007.png
```

---

## 🚀 How to Use

### Option 1: Run the Main Application
```bash
python main.py
```
- Character will automatically load all animations
- You can interact with the character using chat and commands
- Emotions change based on AI responses and behavior

### Option 2: Run the Animation Demo
```bash
python test_animation_demo.py
```
- A demo window with buttons to test each animation
- Click buttons to see each emotion and movement in action
- Great for testing and development

### Option 3: Run the Sprite Loading Test
```bash
python test_sprite_loading.py
```
- Verify that all sprites are loading correctly
- Shows frame count for each emotion folder
- Useful for debugging sprite loading issues

---

## 🎨 Core Components

### 1. **Animation Controller** (`character/animation.py`)
Manages animation playback:
- `FrameSequenceAnimation` - Loads individual frame files
- `Animation` - Handles spritesheet animations
- `AnimationController` - Controls current animation and frame updates

### 2. **Character Widget** (`character/character_widget.py`)
Renders character on screen:
- `load_frame_sequence()` - Loads animations from individual frame files
- `set_animation()` - Switches to different animation
- `paintEvent()` - Renders current frame

### 3. **Asset Generator** (`utils/asset_generator.py`)
Creates sprite configuration:
- `load_frame_sequence_from_folder()` - Loads frames from a folder
- `get_sprite_config()` - Returns animation config (NEW - now loads from assets)

### 4. **Main Window** (`main_window.py`)
Manages the main application:
- `load_character_sprites()` - Loads all animations from config
- Connects animations to behavior system
- Handles emotion state changes

---

## 🔄 Animation Flow

```
1. Application Start
   ↓
2. get_sprite_config() checks for Sprite Sheet Contents folder
   ↓
3. For each emotion folder (Happy, Sad, etc.):
   - Load all PNG files in order
   - Create FrameSequenceAnimation with 7 frames
   - Store in animation config
   ↓
4. main_window.load_character_sprites() loads each animation
   ↓
5. Character widget displays current animation
   ↓
6. Behavior system triggers animation changes
   ↓
7. CharacterWidget updates frame at 7 FPS
```

---

## 💻 How to Change Animations

### In Code
```python
# Set a specific animation
character_widget.set_animation("happy")

# Available animations:
# - "idle" (default)
# - "happy"
# - "sad"
# - "worried"
# - "neglected"
# - "walk_left"
# - "walk_right"
```

### Through Behavior System
The behavior controller automatically triggers animations:
```python
behavior_controller.animation_changed.connect(character_widget.set_animation)
```

### Through AI System
When AI generates responses, it can set emotions:
```python
# Example: AI detects negative sentiment
character_widget.set_animation("sad")
```

---

## ⚙️ Configuration

### Animation Speed
Edit FPS in `utils/asset_generator.py`:
```python
"fps": 7,  # Change this value (default: 7)
```

### Add New Animation States
1. Add folder to `assets/Sprite Sheet Contents/`
2. Add to `emotion_map` in `get_sprite_config()`:
   ```python
   emotion_map = {
       "your_state": "Folder Name",
       # ... other states
   }
   ```

### Character Size
Set in UI settings or programmatically:
```python
character_widget.set_character_size(80)  # 80% of normal size
```

---

## 🐛 Troubleshooting

### Character Not Showing
1. Check logs for errors:
   ```bash
   # Look for error messages about sprite loading
   python test_sprite_loading.py
   ```

2. Verify assets exist:
   ```
   assets/Sprite Sheet Contents/Neutral/
   ```

3. Check PNG files are readable:
   - Open one manually to verify

### Animation Not Playing
1. Verify animation name matches config:
   ```python
   # Check available animations
   sprite_config = get_sprite_config()
   print(sprite_config.keys())
   ```

2. Check FPS setting - if too high, animation plays too fast

3. Verify frames are loading:
   ```bash
   python test_sprite_loading.py
   ```

### Slow Performance
1. Reduce FPS value:
   ```python
   "fps": 5,  # Slower animation, better performance
   ```

2. Reduce character size:
   ```python
   character_widget.set_character_size(50)  # 50% size
   ```

3. Check system resources

---

## 📊 Technical Details

### Frame Loading Process
1. **Scan Folder** - Find all PNG files in emotion folder
2. **Sort Files** - Sort by filename (alphanumeric order)
3. **Load Pixmaps** - Convert each PNG to QPixmap
4. **Create Animation** - Create FrameSequenceAnimation with loaded frames
5. **Register** - Add to AnimationController

### Animation Playback
1. **Timer Tick** - Every ~40ms (ANIMATION_FRAME_INTERVAL)
2. **Calculate Frame** - Based on elapsed time and FPS
3. **Get Pixmap** - Retrieve correct frame from animation
4. **Scale & Draw** - Scale to character size and draw on screen

### Memory Usage
- 7 emotions × 7 frames each = 49 frames
- Each frame is PNG loaded into memory
- Total memory: ~5-10 MB (depends on image size)

---

## 🎯 Next Steps

### To Integrate with AI
1. Detect emotion in AI response
2. Map emotion to animation:
   ```python
   emotion_to_animation = {
       "happy": "happy",
       "sad": "sad",
       "neutral": "idle",
       "worried": "worried",
   }
   ```
3. Trigger animation:
   ```python
   emotion = detect_emotion(ai_response)
   animation = emotion_to_animation.get(emotion, "idle")
   character_widget.set_animation(animation)
   ```

### To Add New Emotions
1. Create new folder in `assets/Sprite Sheet Contents/`
2. Add 7 PNG frames (named sequentially)
3. Update `emotion_map` in `asset_generator.py`
4. Restart application

### To Change Animation Speed
1. Edit FPS in `get_sprite_config()`:
   ```python
   "fps": 10,  # Increase for faster animation
   ```

---

## ✨ Features

✓ **Automatic Asset Loading** - No manual configuration needed
✓ **7 Emotion States** - Full emotional expression support
✓ **Smooth Animation** - Frame-based interpolation
✓ **Performance Optimized** - Efficient frame rendering
✓ **Easy Integration** - Simple API for behavior system
✓ **Extensible** - Easy to add new animations
✓ **Fallback Support** - Placeholder animations if assets missing

---

## 📝 Summary

The character system is now **fully functional and production-ready**. All sprite assets are automatically loaded from the `assets/Sprite Sheet Contents` folder and integrated with the behavior system. The character displays 7 different animations (emotions and movements) with smooth 7 FPS playback.

**Ready to run!** Just execute `python main.py` and the character will appear with all animations working.
