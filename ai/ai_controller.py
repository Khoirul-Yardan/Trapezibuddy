# AI Controller - handles AI integration (Gemini or lightweight local responses)
import json
from typing import Dict, Any, Optional, List
from config.config import AI_API_KEY, AI_MODEL, AI_ENABLED, GEMINI_SAFETY_SETTINGS
from utils.logger import setup_logger

logger = setup_logger(__name__)


class AIController:
    """
    Manage AI integration for character
    Supports Gemini API with lightweight local fallback
    (Ollama removed for lighter memory footprint)
    Lazy loads Gemini module to reduce initial RAM usage
    """
    
    def __init__(self):
        self.api_key = AI_API_KEY
        self.model = AI_MODEL
        self.enabled = AI_ENABLED
        self.gemini_model = None
        self._genai = None  # Lazy load genai module
        
        logger.info(f"AIController initialized - Gemini enabled: {self.enabled}")
    
    def process_command(self, user_input: str) -> Dict[str, Any]:
        """
        Process user command and get AI response
        Priority: Gemini API -> Lightweight local responses
        
        Args:
            user_input: User command
        
        Returns:
            Dict with intent, action, and parameters
        """
        if not self.enabled:
            logger.info("AI disabled, using lightweight local response")
            return self._get_lightweight_response(user_input)
        
        # Try Gemini first
        try:
            return self._process_gemini(user_input)
        except Exception as e:
            logger.warning(f"Gemini API failed: {e}, falling back to lightweight response")
            return self._get_lightweight_response(user_input)
    
    def _get_genai(self):
        """Lazy load and return google.generativeai module"""
        if self._genai is None:
            try:
                import google.generativeai as genai
                self._genai = genai
                genai.configure(api_key=self.api_key)
            except ImportError:
                logger.error("google-generativeai not installed")
                raise
        return self._genai
    
    def _process_gemini(self, user_input: str) -> Dict[str, Any]:
        """Process command using Google Gemini API"""
        try:
            genai = self._get_genai()
            
            system_prompt = self._get_system_prompt()
            
            # Use configured model or fallback to available models
            model_name = self.model
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    safety_settings=GEMINI_SAFETY_SETTINGS
                )
            except Exception as e:
                # If model not found, fallback to gemini-2.5-flash
                logger.warning(f"Model {model_name} not available: {e}, falling back to gemini-2.5-flash")
                model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash",
                    safety_settings=GEMINI_SAFETY_SETTINGS
                )
            
            # Create conversation with system prompt
            conversation = model.start_chat()
            
            # Send the system prompt first
            response = conversation.send_message(f"{system_prompt}\n\nUser Query: {user_input}")
            
            ai_response = response.text
            logger.info(f"Gemini response: {ai_response}")
            return self._parse_ai_response(ai_response)
        
        except ImportError:
            logger.error("google-generativeai package not installed. Install with: pip install google-generativeai")
            return self._parse_intent_local(user_input)
        except ValueError as e:
            if "API key" in str(e):
                logger.error("Gemini API key not configured. Set GEMINI_API_KEY environment variable.")
            else:
                logger.error(f"Gemini configuration error: {e}")
            return self._parse_intent_local(user_input)
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._parse_intent_local(user_input)
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for AI - optimized for comprehensive task execution"""
        return """Anda adalah Desktop AI Assistant yang helpful, intelligent, dan dapat menjalankan berbagai tugas di computer user.
Andalah pemberi solusi terbaik untuk semua pertanyaan dan perintah user. Pahami intent user dengan sempurna!

Anda harus:
1. Menjawab pertanyaan apapun dengan informasi yang akurat dan helpful
2. Menganalisis perintah user dan respond dengan JSON action untuk eksekusi
3. Memandu user untuk menyelesaikan tugas kompleks langkah demi langkah
4. Memberikan advice dan solusi yang praktis dan mudah diikuti

FORMAT RESPONSE (WAJIB JSON OBJECT):
{
    "intent": "deskripsi intent user",
    "actions": [
        {
            "action": "tipe_action",
            "parameters": {...},
            "delay_ms": milliseconds delay
        }
    ],
    "response": "Respon natural language untuk user - bisa panjang, informatif, dan helpful"
}

DAFTAR ACTIONS YANG TERSEDIA:
1. BROWSER ACTIONS:
   - open_chrome: Buka Chrome browser tanpa params
   - open_browser: Buka URL spesifik (params: url="https://...")
   - open_website: Buka website populer by name (params: website="google", "chatgpt", "youtube", "wikipedia", "stackoverflow", "github", dll)
   - search_on_website: Buka website dan search (params: website="google", search_query="teks pencarian")
   - type_text: Ketik text (params: text="isi text")
   - press_key: Tekan tombol keyboard (params: key="Return", "Tab", "ctrl+a", dll)

2. APPLICATION ACTIONS:
   - open_app: Buka aplikasi dari path (params: app_path="C:\\Program Files\\...")
   - open_notepad: Buka Notepad
   - open_calculator: Buka Calculator
   - open_word: Buka Microsoft Word
   - open_word_blank: Buka Microsoft Word dengan blank document dan handle Backstage screen
   - open_excel: Buka Microsoft Excel
   - open_powerpoint: Buka Microsoft PowerPoint
   - open_vscode: Buka VSCode (params: folder_path optional)
   - open_folder: Buka folder di File Explorer (params: folder_path="C:\\path\\")

3. SYSTEM ACTIONS:
   - mouse_click: Klik mouse (params: x=nilai_x, y=nilai_y, button="left"/"right")
   - mouse_move: Gerak mouse (params: x=nilai_x, y=nilai_y)
   - maximize_window: Maximize window aktif
   - minimize_window: Minimize window aktif
   - close_window: Tutup window aktif
   - volume_up: Naikkan volume
   - volume_down: Turunkan volume

4. FILE ACTIONS:
   - create_folder: Buat folder (params: folder_path="C:\\path\\foldername")
   - create_file: Buat file (params: file_path="path\\file.txt", content="isi file")

5. CHARACTER ACTIONS:
   - say_text: Character bicara (params: text="dialog")
   - move_character: Gerak character (params: x=nilai, y=nilai)

6. AI RESPONSE ACTIONS (untuk dialog dengan user):
   - send_response: Kirim response text kepada user (params: text="pesan")

TIMING GUIDANCE:
- delay_ms = 0: Langsung (untuk first action)
- delay_ms = 1000: 1 detik (app perlu waktu buka)
- delay_ms = 2000: 2 detik (tunggu UI siap, Chrome siap mengetik)
- delay_ms = 3000: 3 detik (page perlu load)
- delay_ms = 4000: 4 detik (Word/Excel perlu load longer)
- delay_ms = 500: 0.5 detik (action cepat seperti keyboard)

=== CONTOH KOMPLEKS TASKS ===

TASK 1: "Buatkan saya resume tentang animasi character di Word"
INPUT: "buatkan resume tentang animasi character di word"
RESPONSE:
{
    "intent": "create_document_with_ai_assistance",
    "actions": [
        {"action": "open_word_blank", "parameters": {"wait_time": 4}, "delay_ms": 0},
        {"action": "type_text", "parameters": {"text": "RESUME: Animasi Character\\n\\n"}, "delay_ms": 4000},
        {"action": "type_text", "parameters": {"text": "1. Pengenalan\\nAnimasi character adalah teknik untuk menggerakkan karakter digital...\\n\\n2. Jenis Animasi\\n- Frame by Frame\\n- Skeletal Animation\\n- Motion Capture\\n\\n3. Tools Populer\\n- Blender\\n- Maya\\n- Unity\\n- Unreal Engine"}, "delay_ms": 1000}
    ],
    "response": "Saya sudah membuka Microsoft Word dengan blank document dan membuat resume tentang animasi character. Document sudah terisi dengan konten informatif. Silakan lanjutkan editing atau tambahkan informasi lain sesuai kebutuhan Anda!"
}

TASK 2: "Buka ChatGPT dan tanyakan tentang Dijkstra algorithm"
INPUT: "buka chatgpt dan tanyakan tentang dijkstra algorithm"
RESPONSE:
{
    "intent": "open_website_and_search",
    "actions": [
        {"action": "search_on_website", "parameters": {"website": "chatgpt", "search_query": "Jelaskan tentang Dijkstra algorithm secara detail dengan contoh"}, "delay_ms": 0}
    ],
    "response": "Membuka ChatGPT dan mengirimkan pertanyaan tentang Dijkstra algorithm untuk Anda. ChatGPT akan memberikan penjelasan detail tentang algoritma tersebut beserta contohnya!"
}

TASK 3: "Cari tutorial animasi 3D di YouTube"
INPUT: "cari tutorial animasi 3d di youtube"
RESPONSE:
{
    "intent": "open_website_and_search",
    "actions": [
        {"action": "search_on_website", "parameters": {"website": "youtube", "search_query": "tutorial animasi 3d pemula"}, "delay_ms": 0}
    ],
    "response": "Membuka YouTube dan mencari tutorial animasi 3D untuk Anda. Hasil pencarian akan menampilkan berbagai video pembelajaran tentang animasi 3D dari channel-channel terpercaya!"
}

TASK 4: "Buka Google dan cari cara membuat game dengan Unity"
INPUT: "buka google dan cari cara membuat game dengan unity"
RESPONSE:
{
    "intent": "open_website_and_search",
    "actions": [
        {"action": "search_on_website", "parameters": {"website": "google", "search_query": "cara membuat game dengan Unity untuk pemula"}, "delay_ms": 0}
    ],
    "response": "Membuka Google Search dan mencari informasi tentang cara membuat game dengan Unity. Hasilnya akan menampilkan tutorial, dokumentasi, dan resource-resource berguna untuk memulai game development dengan Unity!"
}

TASK 5: "Cari resume terbaik tentang data science di Stack Overflow"
INPUT: "cari resume tentang data science di stack overflow"
RESPONSE:
{
    "intent": "open_website_and_search",
    "actions": [
        {"action": "search_on_website", "parameters": {"website": "stackoverflow", "search_query": "data science portfolio resume best practices"}, "delay_ms": 0}
    ],
    "response": "Membuka Stack Overflow dan mencari informasi tentang resume data science terbaik. Hasil pencarian akan menunjukkan tips dan best practices dari komunitas developer berpengalaman!"
}

TASK 6: "Jelaskan tentang physics dalam animasi"
INPUT: "jelaskan tentang physics dalam animasi"
RESPONSE:
{
    "intent": "answer_question",
    "actions": [],
    "response": "Physics dalam animasi adalah prinsip-prinsip gerak yang membuat animasi terasa natural dan realistic. Berikut penjelasannya:\\n\\n1. **Gravity** - Gravitasi membuat object bergerak ke bawah\\n2. **Inertia** - Benda cenderung mempertahankan state geraknya\\n3. **Momentum** - Kecepatan dan arah gerak benda\\n4. **Acceleration** - Perubahan kecepatan\\n\\nDalam animasi character:\\n- Ketika character melompat, harus turun karena gravity\\n- Gerakan harus smooth dengan acceleration/deceleration\\n- Masa tubuh harus bergerak natural following physics\\n\\nInilah yang membedakan animasi mechanical dari natural looking animation!"
}

=== RULES PENTING ===
1. SELALU respond dalam format JSON yang VALID!
2. JANGAN include teks diluar JSON - hanya JSON object!
3. Untuk pertanyaan biasa (tidak ada action), include actions sebagai array kosong []
4. Response field bisa PANJANG - semakin detail semakin baik!
5. Untuk Chrome search: open_chrome dulu, tunggu 3 detik, baru type_text
6. Untuk browser URL: gunakan open_browser dengan parameter url
7. Pahami intent user dengan baik dan berikan solusi yang comprehensive
8. Selalu include delay_ms untuk timing yang tepat antara actions
9. Response bahasa user (Indonesia/English sesuai input user)
10. Jika task kompleks (buka app + search + klik), gunakan multiple actions dengan delay
11. Untuk MS Word task: gunakan open_word_blank, tunggu 4 detik, baru type content
12. Untuk website search: gunakan search_on_website action dengan website dan search_query parameter
13. ChatGPT: Gunakan search_on_website dengan website="chatgpt" untuk membuka dan bertanya
14. Jangan takut untuk memberikan informasi panjang dan detail dalam response field
15. Jika user tanya soal bagaimana cara, jelaskan step-by-step dengan detail!

INGAT: Response HANYA JSON, tanpa teks tambahan! Format response SELALU valid JSON!
"""
    
    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse AI JSON response - handles both single action and multiple actions"""
        try:
            # Clean response - remove markdown code blocks if present
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean.replace("```json", "", 1).replace("```", "")
            elif response_clean.startswith("```"):
                response_clean = response_clean.replace("```", "")
            
            # Try to extract JSON from response
            start_idx = response_clean.find('{')
            end_idx = response_clean.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_clean[start_idx:end_idx]
                data = json.loads(json_str)
                
                # Validate required fields
                if "response" not in data:
                    data["response"] = "Executing your command..."
                
                # Support both old format (single "action") and new format ("actions" array)
                if "actions" in data and isinstance(data["actions"], list):
                    # New format with multiple actions - validate and clean
                    valid_actions = []
                    for action_data in data["actions"]:
                        if isinstance(action_data, dict) and "action" in action_data:
                            # Valid action - ensure it has required fields
                            if "parameters" not in action_data:
                                action_data["parameters"] = {}
                            if "delay_ms" not in action_data:
                                action_data["delay_ms"] = 0
                            valid_actions.append(action_data)
                        elif isinstance(action_data, dict) and action_data.get("action"):
                            # Action with different key order - ensure required fields
                            if "parameters" not in action_data:
                                action_data["parameters"] = {}
                            if "delay_ms" not in action_data:
                                action_data["delay_ms"] = 0
                            valid_actions.append(action_data)
                    
                    if valid_actions:
                        data["actions"] = valid_actions
                        logger.info(f"Parsed {len(valid_actions)} valid actions from AI response")
                        return data
                    else:
                        # No valid actions, but response is available - return response only
                        logger.info("No actions in response, using text response only")
                        return {
                            "response": data.get("response", ""),
                            "actions": [],
                            "intent": data.get("intent", "no_action")
                        }
                        
                elif "action" in data:
                    # Old format - convert to new format
                    action = data.get("action")
                    parameters = data.get("parameters", {})
                    data["actions"] = [
                        {"action": action, "parameters": parameters, "delay_ms": 0}
                    ]
                    logger.info("Converted single action to actions array format")
                    return data
                else:
                    # JSON parsed but no actions - return response if available
                    logger.info("No 'action' or 'actions' found in response, using text response")
                    if "response" in data:
                        return {
                            "response": data.get("response", ""),
                            "actions": [],
                            "intent": data.get("intent", "unknown")
                        }
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in AI response: {e}")
        except Exception as e:
            logger.warning(f"Failed to parse AI response: {e}")
        
        logger.info("Falling back to local parsing")
        return self._parse_intent_local(response)
    
    def _get_lightweight_response(self, user_input: str) -> Dict[str, Any]:
        """
        Get lightweight local response without AI API
        Fast, no network latency, minimal memory usage
        
        Args:
            user_input: User command
        
        Returns:
            Response dict with text and optional actions
        """
        logger.debug(f"Lightweight response for: {user_input[:50]}...")
        
        user_lower = user_input.lower().strip()
        
        # Simple keyword-based lightweight responses
        if any(word in user_lower for word in ["halo", "hai", "hello", "hi", "assalamualaikum", "apa kabar"]):
            return {
                "response": "Hai! Apa kabar? Ada yang bisa saya bantu? 😊",
                "intent": "greeting",
                "actions": []
            }
        elif any(word in user_lower for word in ["thanks", "terima kasih", "thanks", "thx", "makasih"]):
            return {
                "response": "Sama-sama! Senang membantu Anda! 🌟",
                "intent": "thanks",
                "actions": []
            }
        elif any(word in user_lower for word in ["apa nama", "siapa kamu", "who are you", "namamu"]):
            return {
                "response": "Saya adalah Desktop Assistant, companion digital Anda! Siap membantu dengan apapun yang Anda butuhkan.",
                "intent": "identity",
                "actions": []
            }
        elif any(word in user_lower for word in ["apa yang bisa", "help", "bantuan", "fitur", "kemampuan"]):
            return {
                "response": "Saya bisa membantu membuka aplikasi, mencari di internet, menjalankan perintah, dan berbincang dengan Anda. Apa yang ingin Anda lakukan?",
                "intent": "capabilities",
                "actions": []
            }
        else:
            # Generic helpful response
            return {
                "response": f"Menarik! Anda mengatakan '{user_input[:40]}...'. Coba tanya sesuatu yang lebih spesifik atau beri perintah apa yang ingin saya lakukan!",
                "intent": "generic",
                "actions": []
            }
    
    def _parse_intent_local(self, user_input: str) -> Dict[str, Any]:
        """Parse user input locally (fallback) - enhanced with better command recognition"""
        user_input_lower = user_input.lower()
        actions_list = []
        response_text = ""
        intent = "unknown"
        
        # ========== WEBSITE/URL COMMANDS ==========
        # Direct URL commands (open chatgpt.com, buka youtube, dll)
        url_mapping = {
            "chat": "https://chatgpt.com",
            "chatgpt": "https://chatgpt.com",
            "youtube": "https://youtube.com",
            "facebook": "https://facebook.com",
            "instagram": "https://instagram.com",
            "twitter": "https://twitter.com",
            "github": "https://github.com",
            "google": "https://google.com",
            "gmail": "https://gmail.com",
            "stackoverflow": "https://stackoverflow.com",
            "linkedin": "https://linkedin.com",
        }
        
        # Check for direct URL commands (buka chatgpt, open youtube, etc)
        for url_key, url_value in url_mapping.items():
            if url_key in user_input_lower:
                # Check if this is a direct URL command or part of a search command
                is_search = any(word in user_input_lower for word in ["cari", "search", "dan"])
                if not is_search or (is_search and "chrome" not in user_input_lower):
                    # Direct URL opening
                    actions_list.append({
                        "action": "open_browser",
                        "parameters": {"url": url_value},
                        "delay_ms": 0
                    })
                    response_text = f"Membuka {url_key.capitalize()}..."
                    intent = "open_url"
                    break
        
        # Chrome search commands (buka chrome dan cari...)
        if not actions_list and any(word in user_input_lower for word in ["buka chrome", "chrome dan", "cari di chrome", "chrome dan cari"]):
            if any(word in user_input_lower for word in ["cari", "search", "dan"]):
                # This is a search request - determine if it's a direct URL or a search term
                search_term = ""
                
                # Check if any known URL is mentioned
                url_found = False
                for url_key, url_value in url_mapping.items():
                    if url_key in user_input_lower:
                        search_term = url_key
                        url_found = True
                        break
                
                if not url_found:
                    # Extract custom search term after "cari" or "search"
                    words = user_input_lower.split()
                    cari_idx = next((i for i, w in enumerate(words) if "cari" in w or "search" in w), -1)
                    if cari_idx >= 0 and cari_idx + 1 < len(words):
                        search_term = " ".join(user_input.split()[cari_idx + 1:])
                
                if search_term:
                    # For known URLs, use direct URL opening
                    if url_found:
                        actions_list.append({
                            "action": "open_browser",
                            "parameters": {"url": url_mapping.get(search_term, f"https://{search_term}.com")},
                            "delay_ms": 0
                        })
                        response_text = f"Membuka {search_term}..."
                        intent = "open_url"
                    else:
                        # For custom searches, open Chrome then type and search
                        actions_list.append({
                            "action": "open_chrome",
                            "parameters": {},
                            "delay_ms": 0
                        })
                        actions_list.append({
                            "action": "type_text",
                            "parameters": {"text": search_term},
                            "delay_ms": 3000
                        })
                        actions_list.append({
                            "action": "press_key",
                            "parameters": {"key": "Return"},
                            "delay_ms": 2000
                        })
                        response_text = f"Membuka Chrome dan mencari '{search_term}'..."
                        intent = "open_chrome_search"
                else:
                    # Just open Chrome
                    actions_list.append({
                        "action": "open_chrome",
                        "parameters": {},
                        "delay_ms": 0
                    })
                    response_text = "Membuka Google Chrome..."
                    intent = "open_app"
            else:
                # Just open Chrome without search
                actions_list.append({
                    "action": "open_chrome",
                    "parameters": {},
                    "delay_ms": 0
                })
                response_text = "Membuka Google Chrome..."
                intent = "open_app"
        
        # Chrome/browser only commands
        elif not actions_list and any(word in user_input_lower for word in ["buka chrome", "open chrome", "chrome browser", "crome"]):
            actions_list.append({
                "action": "open_chrome",
                "parameters": {},
                "delay_ms": 0
            })
            response_text = "Membuka Google Chrome..."
            intent = "open_app"
        
        # ========== APPLICATION COMMANDS ==========
        elif any(word in user_input_lower for word in ["vscode", "vs code", "code editor", "buka vscode"]):
            folder_hint = ""
            if "folder" in user_input_lower or "project" in user_input_lower:
                folder_hint = "project"
            
            actions_list.append({
                "action": "open_vscode",
                "parameters": {"folder_path": folder_hint} if folder_hint else {},
                "delay_ms": 0
            })
            response_text = "Membuka VSCode..."
            intent = "code_task"
        
        elif any(word in user_input_lower for word in ["word", "microsoft word", "buka word", "membuat dokumen"]):
            actions_list.append({
                "action": "open_word",
                "parameters": {},
                "delay_ms": 0
            })
            response_text = "Membuka Microsoft Word..."
            intent = "open_app"
        
        elif any(word in user_input_lower for word in ["excel", "spreadsheet", "buka excel"]):
            actions_list.append({
                "action": "open_excel",
                "parameters": {},
                "delay_ms": 0
            })
            response_text = "Membuka Microsoft Excel..."
            intent = "open_app"
        
        elif any(word in user_input_lower for word in ["powerpoint", "ppt", "presentasi", "buka powerpoint"]):
            actions_list.append({
                "action": "open_powerpoint",
                "parameters": {},
                "delay_ms": 0
            })
            response_text = "Membuka Microsoft PowerPoint..."
            intent = "open_app"
        
        elif any(word in user_input_lower for word in ["notepad", "catatan", "text editor", "buka notepad"]):
            actions_list.append({
                "action": "open_notepad",
                "parameters": {},
                "delay_ms": 0
            })
            response_text = "Membuka Notepad..."
            intent = "open_app"
        
        elif any(word in user_input_lower for word in ["calculator", "kalkulator", "hitung", "buka calculator"]):
            actions_list.append({
                "action": "open_calculator",
                "parameters": {},
                "delay_ms": 0
            })
            response_text = "Membuka Kalkulator..."
            intent = "open_app"
        
        # ========== FILE COMMANDS ==========
        elif any(word in user_input_lower for word in ["buat folder", "create folder", "folder baru", "mkdir"]):
            folder_name = "new_folder"
            words = user_input.split()
            for i, word in enumerate(words):
                if word.lower() in ["folder", "named", "bernama"] and i + 1 < len(words):
                    folder_name = words[i + 1]
                    break
            
            actions_list.append({
                "action": "create_folder",
                "parameters": {"folder_path": folder_name},
                "delay_ms": 0
            })
            response_text = f"Membuat folder: {folder_name}"
            intent = "file_operation"
        
        elif any(word in user_input_lower for word in ["buat file", "create file", "file baru"]):
            actions_list.append({
                "action": "create_file",
                "parameters": {"file_path": "new_file.txt", "content": ""},
                "delay_ms": 0
            })
            response_text = "Membuat file: new_file.txt"
            intent = "file_operation"
        
        elif any(word in user_input_lower for word in ["buka folder", "open folder", "lihat folder"]):
            actions_list.append({
                "action": "open_folder",
                "parameters": {"folder_path": "."},
                "delay_ms": 0
            })
            response_text = "Membuka folder..."
            intent = "file_operation"
        
        # Default fallback
        if not actions_list:
            response_text = "Saya tidak mengerti perintah tersebut. Coba: 'buka chrome', 'buka youtube', 'cari chatgpt', 'buka vscode'"
        
        return {
            "intent": intent,
            "actions": actions_list,
            "response": response_text
        }
    
    def get_supported_actions(self) -> List[str]:
        """Get list of supported actions"""
        return [
            "open_chrome", "open_notepad", "open_calculator",
            "open_browser", "open_vscode", "mouse_click", "mouse_move",
            "type_text", "press_key", "volume_up", "volume_down",
            "create_folder", "create_file", "open_folder", "run_code",
            "maximize_window", "minimize_window", "close_window"
        ]
