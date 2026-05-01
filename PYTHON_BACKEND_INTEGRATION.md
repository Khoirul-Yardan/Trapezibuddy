# Python Backend Integration with Desktop-App UI

## Summary of Changes

### 1. Fixed Chrome Opening Issue ✓
The `open_chrome()` function in `system/action_executor.py` now uses multiple fallback strategies:
- Checks common installation paths (Program Files, AppData)
- Searches Chrome in system PATH
- Falls back to Windows `start chrome` command
- Final fallback: PowerShell `Start-Process chrome`

**Result**: Chrome now opens reliably from commands like "buka chrome"

### 2. Python Backend Chat Integration ✓
The desktop-app chat UI now communicates with the Python backend via `chat_bridge.py`.

**Architecture**:
```
User Input (Chat UI)
    ↓
chat.js (Electron Renderer)
    ↓
Main Process (main.js)
    ↓
callPythonBackend() spawns chat_bridge.py
    ↓
chat_bridge.py
    ↓
AIController (Gemini/OpenAI/Ollama)
    ↓
ActionExecutor (executes commands)
    ↓
Response sent back as JSON
    ↓
UI displays response + executes actions
```

## How It Works

### When User Sends Chat Message:

1. **Message enters UI** → User types in chat panel
2. **IPC to main process** → `api.chat.sendMessage(message)`
3. **Python backend called** → `callPythonBackend(userMessage)`
4. **Bridge execution** → `python chat_bridge.py --message "..." --execute-actions`
5. **AI processes** → AIController analyzes and responds
6. **Actions execute** → ActionExecutor runs any commands (open apps, etc.)
7. **Response returned** → JSON with response text and action count
8. **UI updates** → Chat displays AI response

## Key Files Modified

### `desktop-app/src/main/main.js`
```javascript
// New function: Spawn Python backend and handle response
async function callPythonBackend(userMessage)

// Updated handler: Chat messages now go to Python
ipcMain.handle('chat:sendMessage', async (_, userMessage) => {
  // Calls callPythonBackend instead of local dialog
})

// Logger setup for debugging
const logger = { info, error, warn }
```

### `system/action_executor.py`
```python
# Improved Chrome opening with 4 fallback strategies
def open_chrome(self, **kwargs):
    # Strategy 1: Check common paths
    # Strategy 2: Search in PATH
    # Strategy 3: Use 'start chrome'
    # Strategy 4: Use PowerShell
```

## Testing the Integration

### Test 1: Verify Python Bridge Works
```bash
cd C:\Users\ACER NITRO\Documents\DesktopAssistant
python chat_bridge.py --message "halo"
```
**Expected Output**: JSON with response text

### Test 2: Test Chrome Opening
```bash
python chat_bridge.py --message "buka chrome" --execute-actions
```
**Expected Output**: 
- Response: "Membuka Google Chrome..."
- Chrome window opens
- `"actions_executed": 1`

### Test 3: Run Full Desktop App
```bash
cd desktop-app
npm run dev
```
**Expected Behavior**:
1. Electron window opens
2. Type message in chat: "halo"
3. Character responds with AI message
4. Type: "buka chrome"
5. Chrome opens and AI confirms

### Test 4: Multiple Commands
Try these commands in the chat:
- "buka chrome" → Opens Chrome
- "buka word" → Opens Word
- "buka youtube" → Opens YouTube in browser
- "cari chatgpt di google" → Opens Google and searches ChatGPT
- "buka vscode" → Opens VS Code
- "tambah task" → Opens task modal (shows integration working)

## Features Now Available

### AI Commands
- AI analyzes natural language commands
- Supports Indonesian and English
- Executes multiple actions in sequence

### System Commands
- Open applications: Chrome, Word, Excel, PowerPoint, VS Code
- Open websites: ChatGPT, Google, YouTube, Wikipedia, GitHub, StackOverflow, etc.
- Search on websites
- Create resume in Word
- Manage tasks
- Control focus sessions

### Character Features
- Responds to chat with personality
- Hide/show during focus sessions
- Acknowledges tasks
- Reminds about deadlines (every 5 minutes)
- Spontaneous chat messages

## Configuration

### AI Settings (`config/config.py`)
```python
AI_ENABLED = True
AI_TYPE = "gemini"  # or "openai", "local"
AI_API_KEY = os.getenv("GEMINI_API_KEY", "")
```

### Environment Variables (if needed)
```bash
set GEMINI_API_KEY=your_api_key_here
# or for OpenAI
set OPENAI_API_KEY=your_openai_key_here
```

### Switch to Ollama (Local AI)
```python
# In config/config.py
AI_TYPE = "local"
OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama2"
```

## Logging & Debugging

### Check Logs While Running
The main process logs:
- `[Chat] User: ...` - User message received
- `[Python] Using executable: ...` - Python path
- `[Python] Script: ...` - Script path
- `[AI] Response: ...` - AI response text
- `[ERROR]` - Any errors encountered

### Debug Mode
Enable by checking console in Electron DevTools:
1. Press `F12` in app window
2. Go to Console tab
3. See all chat messages and responses

## Troubleshooting

### Issue: Python not found
**Solution**: 
- Ensure Python is installed
- Check `config/config.py` - AI_TYPE setting

### Issue: Chrome doesn't open
**Solution**: 
- Check if Chrome is installed
- Try command: `where chrome.exe` in PowerShell
- Check action_executor.py logs

### Issue: Chat doesn't respond
**Solution**:
1. Test bridge directly: `python chat_bridge.py --message "test"`
2. Check console for error messages
3. Ensure GEMINI_API_KEY or OPENAI_API_KEY is set (if using cloud AI)

### Issue: Actions don't execute
**Solution**:
- Check if `--execute-actions` flag is passed (it is, in main.js)
- Verify ActionExecutor methods exist
- Check console for action execution errors

## Advanced Usage

### Execute Actions Without Chat
```bash
python chat_bridge.py --message "buka chrome dan cari dijkstra" --execute-actions
```
This will:
1. Parse the command
2. Open Chrome
3. Search for "dijkstra"
4. Print response

### Without Executing Actions
```bash
python chat_bridge.py --message "buka word" # No --execute-actions flag
```
This will:
1. Parse and respond
2. NOT open Word
3. Just return what it would do

## Next Steps

### To Customize Responses
Edit `ai/ai_controller.py` - System prompt section

### To Add New Commands
Edit `system/action_executor.py` - Add new methods to `_setup_actions()`

### To Change Chat Theme
Edit `config/config.py` - Modify `CHAT_THEMES`

### To Adjust Focus Session
Edit `desktop-app/src/renderer/components/companion.js` - Line 470 (focusSeconds)

## Support

For issues or questions about:
- Python backend: Check `ai/ai_controller.py` and `system/action_executor.py`
- Electron UI: Check `desktop-app/src/renderer/components/` files
- Integration: Check `desktop-app/src/main/main.js` and `chat_bridge.py`

Logs are always available in the terminal when running `npm run dev`.
