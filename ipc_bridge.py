"""
IPC Bridge — File-based communication between Python character and Electron UI.

Python writes character state (position, visibility).
Electron writes commands (show_bubble, hide_character, show_character).
"""

import json
import os
from utils.logger import setup_logger

logger = setup_logger(__name__)

# IPC directory — shared between Python and Electron
IPC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.ipc')
STATE_FILE = os.path.join(IPC_DIR, 'python_state.json')
COMMANDS_FILE = os.path.join(IPC_DIR, 'electron_commands.json')


class IPCBridge:
    """File-based IPC bridge for Python <-> Electron communication"""

    def __init__(self):
        os.makedirs(IPC_DIR, exist_ok=True)
        self._last_command_id = 0
        # Initialize clean command state
        self._write_safe(COMMANDS_FILE, {"command": None, "id": 0})
        logger.info(f"IPCBridge initialized, dir: {IPC_DIR}")

    def write_state(self, state_dict: dict):
        """Write Python character state for Electron to read"""
        self._write_safe(STATE_FILE, state_dict)

    def read_commands(self) -> dict:
        """Read and consume commands from Electron. Returns dict or None."""
        data = self._read_safe(COMMANDS_FILE)
        if not data:
            return None

        cmd_id = data.get('id', 0)
        if cmd_id > self._last_command_id and data.get('command'):
            self._last_command_id = cmd_id
            return data
        return None

    def _write_safe(self, filepath: str, data: dict):
        """Write JSON file with atomic rename to prevent corruption"""
        try:
            tmp = filepath + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False)
            if os.path.exists(filepath):
                os.replace(tmp, filepath)
            else:
                os.rename(tmp, filepath)
        except Exception as e:
            logger.debug(f"IPC write error: {e}")

    def _read_safe(self, filepath: str) -> dict:
        """Read JSON file safely"""
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception:
            pass
        return None

    def cleanup(self):
        """Clean up IPC files"""
        try:
            for f in [STATE_FILE, COMMANDS_FILE]:
                if os.path.exists(f):
                    os.remove(f)
        except Exception as e:
            logger.debug(f"IPC cleanup error: {e}")
