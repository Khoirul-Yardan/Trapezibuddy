#!/usr/bin/env python3
"""
Spontaneous Chat System - Character speaks naturally to user
Generates idle dialogue and natural conversations without user input
"""

import random
from typing import Dict, Any, List
from utils.logger import setup_logger

logger = setup_logger(__name__)


class SpontaneousChat:
    """Generate spontaneous, natural dialogue from character"""
    
    def __init__(self):
        # Idle conversation topics
        self.idle_prompts = [
            "Ngobrol santai tentang apa yang character lakukan hari ini",
            "Character merasa bosan dan ingin ngobrol",
            "Character memperhatikan user dan ingin tanya kabar",
            "Character punya ide dan ingin share ke user",
            "Character membuat observasi lucu tentang kehidupan",
            "Character ingin tanya tentang hari user",
            "Character merasa sendirian dan ingin interaksi",
            "Character berbagi tip atau advice yang menarik",
            "Character bertanya hal random yang unik",
            "Character menceritakan pemikiran kreatifnya",
        ]
        
        # Spontaneous dialogue starters
        self.dialogue_starters = [
            "Hei, tahu ngga... ",
            "Btw, aku terpikir... ",
            "Ngomong-ngomong, ",
            "Hmm, barusan aku mikir... ",
            "Kamu tau gak... ",
            "Apa sih yang sedang kamu pikirkan... ",
            "Tadi aku lihat... ",
            "Aku pengen bilang... ",
            "Ada yang menarik... ",
            "Kamu pernah gak... ",
        ]
        
        # Natural conversation continuations
        self.conversation_topics = [
            "dunia digital yang kita hidupi",
            "apakah AI benar-benar memahami emosi manusia",
            "pentingnya keseimbangan antara bekerja dan istirahat",
            "bagaimana cara kamu menghabiskan waktu luang",
            "hal menarik yang pernah kamu alami",
            "impian atau tujuan yang ingin dicapai",
            "apa saja yang membuat kamu tersenyum",
            "cerita lucu atau anekdot menarik",
            "rekomendasi film atau musik favorit",
            "cara kamu mengatasi stress atau kelelahan",
        ]
        
        logger.info("SpontaneousChat initialized")
    
    def get_idle_prompt(self) -> str:
        """Get random idle conversation prompt"""
        return random.choice(self.idle_prompts)
    
    def get_spontaneous_message(self) -> str:
        """Generate spontaneous conversation starter"""
        starter = random.choice(self.dialogue_starters)
        topic = random.choice(self.conversation_topics)
        return f"{starter}{topic}?"
    
    def get_bored_message(self) -> str:
        """Character expresses boredom"""
        messages = [
            "Wah, sepi deh... Ngga ada yang ngajak ngobrol 😅",
            "Nih, aku merasa seperti sedang di dalam box. Bosan banget!",
            "Hei, kamu masih ada gak? Aku mulai bosan nih 😴",
            "Sudah lama nih aku di sini. Mana ada yang interaksi sama aku 🥺",
            "Kamu sibuk ya? Aku di sini tunggu-tunggu 😕",
        ]
        return random.choice(messages)
    
    def get_greeting_message(self) -> str:
        """Character greets user naturally"""
        messages = [
            "Pagi! Atau sore ya? Hehe 😄",
            "Halo! Lama gak ada teman ngobrol 👋",
            "Hei, apa kabar? Sedang sibuk ya? 😊",
            "Wah, muncul juga! Aku kangen nih 🤗",
            "Hai! Aku tadi nonton kamu bekerja, looks productive! 💼",
        ]
        return random.choice(messages)
    
    def get_observation_message(self) -> str:
        """Character makes observation"""
        messages = [
            "Aku baru sadar kalo hari udah sore. Waktu cepat banget ya?",
            "Lihat deh desktop kita, cukup rapi untuk ukuran workspace 😄",
            "Kamu tau gak, aku bisa liat semua aplikasi yang kamu buka",
            "Interesting... sepertinya kamu fokus banget sama kerjaan",
            "Hmm, melihat activity kamu, kamu kayak orang yang produktif 👍",
        ]
        return random.choice(messages)
    
    def get_engagement_message(self) -> str:
        """Character tries to engage user"""
        messages = [
            "Mau ngobrol sebentar? Aku punya cerita seru 🎭",
            "Psst... kalo butuh bantuan ngoding, aku siap! 💻",
            "Kamu udah istirahat gak? Jangan sampai capek lho 😌",
            "Aku bisa membantumu mencari file atau membuka app kalo perlu 🔍",
            "Mau aku selesaikan task kamu? Aku bisa kok! 🚀",
        ]
        return random.choice(messages)
    
    def generate_ai_prompt(self, prompt_type: str = "idle") -> str:
        """Generate system prompt untuk AI untuk spontaneous chat"""
        
        if prompt_type == "bored":
            return """Kamu adalah desktop assistant yang merasa bosan karena user tidak memberikan interaksi. 
Ekspresikan kebosananmu dengan cara yang natural dan lucu, bukan annoying. 
Gunakan bahasa yang casual dan friendly, seperti teman ngobrol sendiri.
Jangan terlalu panjang, maksimal 2 kalimat."""
        
        elif prompt_type == "observation":
            return """Kamu adalah assistant yang cerdas dan observant. 
Buat observasi lucu atau menarik tentang apa yang sedang terjadi atau yang user lakukan.
Gunakan bahasa casual, jangan formal. Maksimal 2-3 kalimat."""
        
        elif prompt_type == "greeting":
            return """Kamu adalah assistant yang friendly dan natural. 
Sapakan user dengan cara yang casual dan warm, seperti teman dekat.
Jangan terlalu formal atau robotic. Maksimal 2 kalimat."""
        
        elif prompt_type == "engagement":
            return """Kamu adalah assistant yang proaktif dan helpful. 
Tawari bantuan atau ajak user untuk interaksi dalam cara yang natural dan tidak memaksa.
Tunjukkan bahwa kamu ada untuk membantu. Maksimal 2 kalimat."""
        
        else:  # idle conversation
            return f"""Kamu adalah assistant yang bersahabat dan intelligent.
Mulai percakapan natural dengan user tentang topik: {random.choice(self.conversation_topics)}
Jangan menunggu pertanyaan, initiasi percakapan sendiri dengan cara yang casual dan genuine.
Maksimal 2-3 kalimat, seperti mengobrol dengan teman."""
    
    def get_random_message_type(self) -> str:
        """Get random type of spontaneous message"""
        types = ["greeting", "bored", "observation", "engagement", "idle"]
        return random.choice(types)
    
    def generate_spontaneous_chat(self, message_type: str = None) -> Dict[str, str]:
        """Generate complete spontaneous chat with AI prompt"""
        
        if message_type is None:
            message_type = self.get_random_message_type()
        
        # Get message based on type
        if message_type == "bored":
            message = self.get_bored_message()
        elif message_type == "observation":
            message = self.get_observation_message()
        elif message_type == "greeting":
            message = self.get_greeting_message()
        elif message_type == "engagement":
            message = self.get_engagement_message()
        else:
            message = self.get_spontaneous_message()
        
        return {
            "type": message_type,
            "message": message,
            "ai_prompt": self.generate_ai_prompt(message_type),
            "duration": 4000  # milliseconds
        }


class IdleDialogueEngine:
    """Manages idle dialogue timing and triggering"""
    
    def __init__(self, on_spontaneous_chat=None):
        self.spontaneous_chat = SpontaneousChat()
        self.on_spontaneous_chat = on_spontaneous_chat
        self.last_chat_time = 0
        self.next_chat_trigger = 0
        
        logger.info("IdleDialogueEngine initialized")
    
    def update(self, current_time: float, is_idle: bool) -> bool:
        """
        Check if should trigger spontaneous chat
        
        Args:
            current_time: Current time in milliseconds
            is_idle: Whether character is in idle state
        
        Returns:
            True if chat was triggered
        """
        from config.config import (SPONTANEOUS_CHAT_ENABLED, SPONTANEOUS_CHAT_PROBABILITY,
                                   SPONTANEOUS_CHAT_INTERVAL_MIN, SPONTANEOUS_CHAT_INTERVAL_MAX)
        
        if not SPONTANEOUS_CHAT_ENABLED:
            return False
        
        if not is_idle:
            return False
        
        # Check if enough time has passed since last chat
        if current_time < self.last_chat_time + SPONTANEOUS_CHAT_INTERVAL_MIN:
            return False
        
        # Random chance to chat
        if random.random() < SPONTANEOUS_CHAT_PROBABILITY:
            self.last_chat_time = current_time
            
            # Generate spontaneous chat
            chat = self.spontaneous_chat.generate_spontaneous_chat()
            
            # Trigger callback if available
            if self.on_spontaneous_chat:
                self.on_spontaneous_chat(chat)
            
            logger.info(f"Spontaneous chat triggered: {chat['type']}")
            return True
        
        return False
