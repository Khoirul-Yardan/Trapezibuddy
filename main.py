import pygame
import win32gui
import win32con
import win32api
import os
import sys

# ─────────────────────────────
# CONFIG
# ─────────────────────────────
WIDTH, HEIGHT = 300, 300
FPS = 24
# Warna untuk keying (transparansi)
FUCHSIA = (255, 0, 255)  # Ganti ke magenta solid

START_X = 100
START_Y = 100

ASSETS = "assets"

# mapping folder animasi
ANIMATIONS = {
    "happy": "Happy",
    "sad": "Sad",
    "neutral": "Neutral",
    "worried": "Worried",
    "neglected": "Neglected",
    "run_left": "Run Left Side",
    "run_right": "Run Right Side"
}

# ─────────────────────────────
# INIT
# ─────────────────────────────
pygame.init()
# Buat screen dengan SRCALPHA untuk transparansi
screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.NOFRAME | pygame.SRCALPHA)
clock = pygame.time.Clock()

hwnd = pygame.display.get_wm_info()['window']

# Set window agar transparan (layered window)
win32gui.SetWindowLong(
    hwnd,
    win32con.GWL_EXSTYLE,
    win32gui.GetWindowLong(hwnd, win32con.GWL_EXSTYLE) | win32con.WS_EX_LAYERED | win32con.WS_EX_TRANSPARENT
)

# Set transparansi berdasarkan warna key (magenta)
win32gui.SetLayeredWindowAttributes(
    hwnd,
    win32api.RGB(*FUCHSIA),  # Gunakan warna magenta sebagai transparan
    0,
    win32con.LWA_COLORKEY  # Ganti dari LWA_ALPHA ke LWA_COLORKEY
)

# always on top
win32gui.SetWindowPos(
    hwnd,
    win32con.HWND_TOPMOST,
    START_X,
    START_Y,
    0,
    0,
    win32con.SWP_NOSIZE
)

# ─────────────────────────────
# LOAD ALL ANIMATIONS
# ─────────────────────────────
def load_frames(folder):
    frames = []
    if not os.path.exists(folder):
        print(f"Folder not found: {folder}")
        return frames

    files = [f for f in os.listdir(folder) if f.endswith(".png")]
    files.sort()  # Urutkan sesuai nama
    
    for file in files:
        path = os.path.join(folder, file)
        try:
            img = pygame.image.load(path).convert_alpha()
            frames.append(img)
            print(f"Loaded: {file}")
        except Exception as e:
            print(f"Error loading {file}: {e}")
    
    print(f"Loaded {len(frames)} frames from {folder}")
    return frames

# Load semua animasi
animations = {}
for key, folder in ANIMATIONS.items():
    path = os.path.join(ASSETS, folder)
    if os.path.exists(path):
        frames = load_frames(path)
        if frames:
            animations[key] = frames
    else:
        print(f"Path not found: {path}")

if not animations:
    print("ERROR: Tidak ada assets yang berhasil dimuat!")
    print(f"Current directory: {os.getcwd()}")
    print(f"Assets path: {os.path.abspath(ASSETS)}")
    pygame.quit()
    sys.exit()

current_anim = "neutral" if "neutral" in animations else list(animations.keys())[0]
print(f"Starting animation: {current_anim}")

frame_index = 0
animation_speed = 0.2

# ─────────────────────────────
# DRAG
# ─────────────────────────────
dragging = False
drag_start_x = 0
drag_start_y = 0

# ─────────────────────────────
# MAIN LOOP
# ─────────────────────────────
running = True
while running:
    clock.tick(FPS)
    
    # Fill dengan warna magenta (akan jadi transparan)
    screen.fill(FUCHSIA)
    
    # Dapatkan frame saat ini
    frames = animations[current_anim]
    frame_index = (frame_index + animation_speed) % len(frames)
    current_frame = frames[int(frame_index)]
    
    # Scale frame (opsional)
    current_frame = pygame.transform.scale(current_frame, (200, 200))
    
    # Posisi gambar (center di window)
    blit_x = (WIDTH - current_frame.get_width()) // 2
    blit_y = (HEIGHT - current_frame.get_height()) // 2
    
    # Blit ke screen
    screen.blit(current_frame, (blit_x, blit_y))
    
    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        
        # Ganti animasi dengan keyboard
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_1:
                current_anim = "neutral" if "neutral" in animations else current_anim
                print("Neutral")
            elif event.key == pygame.K_2:
                current_anim = "happy" if "happy" in animations else current_anim
                print("Happy")
            elif event.key == pygame.K_3:
                current_anim = "sad" if "sad" in animations else current_anim
                print("Sad")
            elif event.key == pygame.K_4:
                current_anim = "worried" if "worried" in animations else current_anim
                print("Worried")
            elif event.key == pygame.K_5:
                current_anim = "neglected" if "neglected" in animations else current_anim
                print("Neglected")
            elif event.key == pygame.K_6:
                current_anim = "run_left" if "run_left" in animations else current_anim
                print("Run Left")
            elif event.key == pygame.K_7:
                current_anim = "run_right" if "run_right" in animations else current_anim
                print("Run Right")
            frame_index = 0  # Reset animasi saat ganti
        
        # Drag window
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:  # Left click
                mx, my = pygame.mouse.get_pos()
                # Cek apakah klik pada gambar
                img_rect = current_frame.get_rect(center=(WIDTH//2, HEIGHT//2))
                if img_rect.collidepoint(mx, my):
                    dragging = True
                    drag_start_x, drag_start_y = mx, my
        
        elif event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1:
                dragging = False
        
        elif event.type == pygame.MOUSEMOTION:
            if dragging:
                mx, my = pygame.mouse.get_pos()
                dx = mx - drag_start_x
                dy = my - drag_start_y
                
                # Dapatkan posisi window saat ini
                wx, wy, _, _ = win32gui.GetWindowRect(hwnd)
                
                # Pindahkan window
                win32gui.SetWindowPos(
                    hwnd,
                    win32con.HWND_TOPMOST,
                    wx + dx,
                    wy + dy,
                    0,
                    0,
                    win32con.SWP_NOSIZE
                )
                
                # Reset drag start position
                drag_start_x, drag_start_y = mx, my
    
    pygame.display.update()

pygame.quit()