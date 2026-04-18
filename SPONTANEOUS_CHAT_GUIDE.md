#!/usr/bin/env python3
"""
Spontaneous Chat System - User Guide

Fitur:
======
Character sekarang bisa berbicara ke user secara natural tanpa menunggu input:

1. AUTONOMOUS DIALOGUE
   - Character berbicara saat sedang IDLE (bosan, greeting, observasi, etc)
   - Tidak perlu user input untuk character berbicara
   - Dialogue ditampilkan dalam bubble (speech bubble) di atas character

2. DIALOGUE TYPES
   - "greeting": Sapaan natural ke user (Halo! Lama gak ada...)
   - "bored": Character merasa bosan (Wah sepi deh... Aku bosan!)
   - "observation": Character membuat observasi lucu (Kamu fokus banget...)
   - "engagement": Character menawarkan bantuan (Mau aku bantu ngoding?)
   - "idle": Conversation starter casual (Btw, aku terpikir...)

3. SMART TIMING
   - Dialogue muncul setiap 15-45 detik (random)
   - Hanya muncul saat character IDLE (bukan saat sedang berjalan)
   - Probability 30% per idle period (configurable)

4. NATURAL INTERACTION
   - Indonesian language dengan emoji untuk personality
   - Casual tone seperti teman ngobrol
   - Durasi tampilan 4 detik per message

CONFIGURATION:
===============
Edit config.py untuk customize:

  SPONTANEOUS_CHAT_ENABLED = True              # Enable/disable system
  SPONTANEOUS_CHAT_PROBABILITY = 0.3           # 30% chance per idle
  SPONTANEOUS_CHAT_INTERVAL_MIN = 15000        # Min wait time (ms)
  SPONTANEOUS_CHAT_INTERVAL_MAX = 45000        # Max wait time (ms)
  SPONTANEOUS_CHAT_DURATION = 4000             # Show duration (ms)

INTEGRATION DENGAN AI (OLLAMA):
================================
Untuk dialogue yang lebih dynamic dan personalized:

1. Uncomment bagian di main_window.py - _on_spontaneous_chat()
2. Uncomment lines untuk AI processing:
   
   # Generate more natural response via AI
   ai_prompt = chat_dict.get('ai_prompt', '')
   result = self.ai_controller.process_ollama(ai_prompt)
   if result:
       ai_message = result.get('response', message)
       self.show_character_dialog(ai_message, duration=duration)

3. Restart aplikasi

Dengan AI enabled:
   - Character akan generate dialogue yang lebih unik dan personal
   - Menggunakan llama2 model via Ollama
   - Lebih natural tapi sedikit lebih slow (1-2 detik latency)

TECHNICAL ARCHITECTURE:
=======================

SpontaneousChat (system/spontaneous_chat.py)
  └─ Generates dialogue messages by type
  └─ Manages dialogue pools dan prompts

IdleDialogueEngine
  └─ Tracks timing between chats
  └─ Probability-based triggering
  └─ Emits signal ke BehaviorController

BehaviorController (behavior/behavior_controller.py)
  └─ Integrates IdleDialogueEngine
  └─ Tracks idle state
  └─ Emits spontaneous_chat_triggered signal

DesktopAssistantWindow (main_window.py)
  └─ Connects spontaneous_chat_triggered signal
  └─ Calls _on_spontaneous_chat() handler
  └─ Displays via show_character_dialog()

BubbleDialog (character/bubble_dialog.py)
  └─ Renders speech bubble dengan text
  └─ Follows character position
  └─ Auto-hide setelah duration

CONTOH PENGGUNAAN:
==================

1. Run aplikasi normal:
   python main.py

2. Character akan mulai berbicara setelah beberapa saat idle

3. Observasi:
   - Dialogue muncul di bubble atas character
   - Tidak mengganggu user interaction
   - Character tetap bisa bergerak saat berbicara

4. Customize dialogue:
   Edit SpontaneousChat class di system/spontaneous_chat.py
   - Tambah/edit self.idle_prompts
   - Tambah/edit self.dialogue_starters
   - Tambah/edit self.conversation_topics

DEBUGGING:
===========

Enable logging untuk melihat spontaneous chat events:

  # Di main_window.py, logger sudah ada
  # Check console output untuk messages seperti:
  # "15:56:12 - system.spontaneous_chat - INFO - Spontaneous chat triggered: bored"

Untuk test tanpa run full app:
  python test_spontaneous_chat.py

FITUR FUTURE (Optional):
========================
- Character mood system (happy, sad, tired, excited)
- Context awareness (berbicara tentang apa yang user lakukan)
- Memory system (remember previous conversations)
- Voice synthesis untuk audio dialogue
- Multi-language support
- Dynamic personality learning

TROUBLESHOOTING:
=================

Q: Character tidak berbicara?
A: Check:
   - SPONTANEOUS_CHAT_ENABLED = True in config.py
   - Character sedang IDLE (bukan WALK/INTERACT state)
   - Tunggu 15-45 detik untuk first chat
   - Check console logs untuk errors

Q: Terlalu banyak chat?
A: Kurangi SPONTANEOUS_CHAT_PROBABILITY (default 0.3 = 30%)

Q: Chat terlalu cepat hilang?
A: Naikkan SPONTANEOUS_CHAT_DURATION

Q: Chat tidak selalu berbicara?
A: Normal! Sistem probabilistic - tidak guarantee 100% setiap idle
"""

if __name__ == "__main__":
    print(__doc__)
