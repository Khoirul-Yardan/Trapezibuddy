# Fix: Python Character Not Appearing After Installation

## Problem
After building and installing the desktop app:
- ✅ Electron UI (chat, buttons, tasks) works
- ❌ Python character NOT visible
- ❌ Chat doesn't respond to AI

## Root Causes & Solutions

### Cause 1: Backend Not Included in Installer

#### Check If Backend Is Missing
```bash
# After installing the app
# Try to find backend folder:
cd "C:\Program Files\TrapeziBuddy"
dir backend
# If shows "File not found" → backend is missing
```

#### Solution: Verify Build Steps
```bash
# 1. Make sure dist/main/main.exe exists
dir dist\main\main.exe
# Should show file > 100 MB

# 2. Clean and rebuild
rmdir /s /q dist
rmdir /s /q desktop-app\dist
build.bat
# Watch for: "Python backend compiled successfully"

# 3. Check build log for errors
# Step [2/4] must complete without errors
```

#### Verify Files Included
```batch
@REM In build.bat, after `build.bat` completes:
@REM Check if backend is in electron-builder output:
dir desktop-app\dist\win-unpacked\resources\backend\main.exe
@REM Should exist if backend is properly bundled
```

---

### Cause 2: Path Configuration Wrong

#### Current Fix Applied
In `desktop-app/src/main/main.js`:

```javascript
// ✅ FIXED path resolution
function getProjectRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, '..', 'app.asar.unpacked')
  }
  return path.join(__dirname, '..', '..', '..')
}

function startPythonCompanion(characterSize = 60) {
  if (app.isPackaged) {
    const backendExe = path.join(projectRoot, 'backend', 'main.exe')
    
    if (!fs.existsSync(backendExe)) {
      logger.error(`ERROR: Backend executable not found at ${backendExe}`)
      return  // ← This prevents crash, but character doesn't show
    }
    // ...spawn process
  }
}
```

#### If Character Still Missing
1. Check if error is being silently ignored
2. Look for debug logs in user data folder:
   - Windows: `C:\Users\<YourName>\AppData\Local\TrapeziBuddy\logs`
   - Or check app console: Press `Ctrl+Shift+I` → Console tab

3. Enable debugging in `desktop-app/src/main/main.js`:
```javascript
// Change stdio to capture output
pythonProcess = spawn(backendExe, args, {
  detached: false,
  stdio: 'pipe'  // ← Change from 'ignore' to 'pipe'
})

pythonProcess.stdout.on('data', (data) => {
  console.log('Python stdout:', data.toString())
})

pythonProcess.stderr.on('data', (data) => {
  console.error('Python stderr:', data.toString())
})
```

---

### Cause 3: Python Dependencies Missing

#### Problem
Character window shows but nothing renders, OR crashes with Python error

#### Solution: Verify Dependencies
```bash
# 1. Check requirements.txt
cat requirements.txt

# 2. Ensure all deps installed
pip install -r requirements.txt

# 3. Test Python backend locally
python main.py --character-size 60
# Should show character window

# 4. If error, test individual imports
python -c "from ai.ai_controller import AIController; print('OK')"
python -c "from character.character_widget import CharacterWidget; print('OK')"
```

#### If Deps Missing After Build
Add to `main.spec`:
```python
hiddenimports=[
    'ai', 'behavior', 'character', 'config', 'system', 'ui', 'utils',
    'PyQt5.QtWidgets', 'PyQt5.QtCore', 'PyQt5.QtGui',
    'requests', 'PIL', 'numpy'  # add any missing packages
]
```

Then rebuild:
```bash
build.bat
```

---

### Cause 4: main.exe Can't Run

#### Check If Executable Is Broken
```batch
@REM Test if main.exe works directly
dist\main\main.exe --character-size 60
@REM Should open character window

@REM If doesn't work, try with verbose output
dist\main\main.exe --character-size 60 --verbose
```

#### Common Issues
```
Error: "No module named 'main'"
→ main.py not found in build
→ Rebuild: make sure main.py in project root

Error: "DLL not found"
→ Python runtime issue
→ Delete dist/ folder
→ Rebuild fresh: build.bat

Error: "Permission denied"
→ File locked by another process
→ Close all Python windows
→ Close Electron app if running
→ Run build.bat again
```

---

### Cause 5: Settings Window Blocking Start

#### Symptom
App starts, shows settings dialog, but crashes when clicking "OK"

#### Solution
In `desktop-app/src/main/main.js`, check the startup flow:

```javascript
// If app starts with settings window (first run)
ipcMain.on('window:startApp', (_, data) => {
  const size = data?.characterSize ?? 60
  settingsWindow?.close()
  
  // ✅ This should work now:
  createCompanionWindow(size)
  createTray()
  startPythonCompanion(size)  // ← Add error logging here
})
```

If still crashes, test Python startup separately:
```bash
# Simulate what Electron does:
python main.py --skip-settings --character-size 60 --debug
```

---

## Diagnostic Checklist

Run through these checks:

### 1. Backend Executable
```batch
✓ dist\main\main.exe exists
✓ dist\main\main.exe is > 100 MB
✓ Can run: dist\main\main.exe --help
```

### 2. Build Configuration
```batch
✓ main.spec includes assets: datas=[(assets_dir, 'assets')]
✓ package.json has correct path: "from": "../../dist/main"
✓ package.json unpacks backend: "asarUnpack": ["backend/**/*"]
```

### 3. Python Startup
```batch
✓ python main.py (works locally)
✓ python main.py --skip-settings --character-size 60 (works)
✓ dist\main\main.exe --skip-settings --character-size 60 (works)
```

### 4. Electron Settings
```batch
✓ desktop-app\src\main\main.js loads without errors
✓ npm run dev (works before building installer)
✓ startPythonCompanion() called during app startup
```

### 5. Installation
```batch
✓ Installer created: desktop-app\dist\TrapeziBuddy Setup 0.1.0.exe
✓ Installer size > 300 MB
✓ Installer installs to: C:\Program Files\TrapeziBuddy
✓ Installed files include backend\ folder
```

---

## Testing After Install

### Quick Test
1. Install app: Double-click `TrapeziBuddy Setup 0.1.0.exe`
2. Run app from Start Menu
3. Check:
   - Settings dialog appears ✓
   - Click OK
   - Character window appears ✓
   - Can click chat button ✓

### Deep Test
```bash
# After installation, check app data
cd %APPDATA%\TrapeziBuddy
dir backend\
# Should show: main.exe

# Try manual spawn
start "TrapeziBuddy Backend" "C:\Program Files\TrapeziBuddy\resources\backend\main.exe"
# Character window should appear
```

---

## Rebuild Steps (If Still Broken)

```bash
# Step 1: Clean everything
rmdir /s /q dist
rmdir /s /q desktop-app\dist
rmdir /s /q desktop-app\node_modules

# Step 2: Test Python backend
python main.py
# Should see character window with animations

# Step 3: Rebuild installer
build.bat
# Watch ALL 4 steps complete successfully

# Step 4: Test installer
desktop-app\dist\TrapeziBuddy Setup 0.1.0.exe
# Should install and run without errors
```

---

## If Still Not Working

### Check Logs
```bash
# Windows app stores logs here:
C:\Users\<YourName>\AppData\Local\TrapeziBuddy\logs

# Show logs:
cd %APPDATA%\TrapeziBuddy
type logs\*.log
```

### Enable Debug Mode
Edit `desktop-app/src/main/main.js` and add:

```javascript
const logger = {
  info: (msg) => {
    console.log(`[INFO] ${msg}`)
    // Also write to file for diagnosis
  },
  error: (msg) => {
    console.error(`[ERROR] ${msg}`)
  }
}
```

Then rebuild and check console output:
```bash
# Press Ctrl+Shift+I after app starts
# → Developer Tools
# → Console tab
# Look for ERROR or startup messages
```

### Contact Support
If still not working, gather info:
```bash
# Create diagnostic report
python -c "import sys; print(f'Python: {sys.version}')"
node --version
npm --version

# Show build output:
build.bat > build_log.txt 2>&1
# Send this file for analysis
```

---

**Last Updated:** May 1, 2026
**Version:** 1.0
