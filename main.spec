# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec for TrapeziBuddy Desktop Assistant
Bundles Python backend with all assets and dependencies

Build command:
    pyinstaller --noconfirm main.spec
"""
import sys
import os

# Increase recursion limit for complex modules
sys.setrecursionlimit(5000)

# Get assets directory (use getcwd() since __file__ not available in spec context)
current_dir = os.getcwd()
assets_dir = os.path.join(current_dir, 'assets')

print(f'[PyInstaller Build Info]')
print(f'  Current directory: {current_dir}')
print(f'  Assets directory: {assets_dir}')
print(f'  Assets exists: {os.path.exists(assets_dir)}')

# Prepare datas list with proper error handling
datas = []
if os.path.exists(assets_dir):
    datas.append((assets_dir, 'assets'))
    print(f'  [OK] Adding assets to build')
else:
    print(f'  [WARN] Assets directory not found at {assets_dir}')

# Hidden imports - ensure all dependencies are bundled
hidden_imports = [
    # Project modules
    'ai',
    'ai.ai_controller',
    'ai.ai_worker',
    'behavior',
    'behavior.behavior_controller',
    'behavior.fsm',
    'character',
    'character.animation',
    'character.bubble_dialog',
    'character.character_widget',
    'config',
    'config.config',
    'system',
    'system.action_executor',
    'system.spontaneous_chat',
    'ui',
    'ui.chat_panel',
    'ui.settings_panel',
    'utils',
    'utils.asset_generator',
    'utils.logger',
    'utils.sprite_scanner',
    # Qt/GUI dependencies
    'PySide6',
    'PySide6.QtWidgets',
    'PySide6.QtCore',
    'PySide6.QtGui',
    'PySide6.QtNetwork',
    'PyQt5',
    'PyQt5.QtWidgets',
    'PyQt5.QtCore',
    'PyQt5.QtGui',
    # Image processing
    'PIL',
    'PIL.Image',
    'PIL.ImageDraw',
    # Networking
    'requests',
]

# Build the Analysis
a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'scipy', 'pandas', 'numpy'],  # Exclude unnecessary large packages
    noarchive=False,
    optimize=0,
)

# Create the PYZ archive
pyz = PYZ(a.pure)

# Create the executable
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='main',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

# Collect all files into distribution directory
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='main',
)
