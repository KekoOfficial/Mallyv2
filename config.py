# --- 🛡️ CONFIGURACIÓN PRIVADA IMPERIO MP ---

# 🤖 TELEGRAM BOT TOKEN
# El token que te dio @BotFather para el bot receptor
TELEGRAM_TOKEN = "TU_BOT_TOKEN_AQUI" 

# 📲 WHATSAPP DESTINO (CANAL/GRUPO)
# El ID del grupo donde quieres que se publique el video principal
# Formato: 1234567890-1234567890@g.us
WHATSAPP_ID = "ID_DEL_CANAL_WHATSAPP@g.us"

# 📱 TU NÚMERO PRIVADO
# Solo para la vinculación inicial por Pairing Code en Termux
# Formato: 5959XXXXXXXX (Sin el +)
MY_NUMBER = "5959XXXXXXXX"

# 🎬 MALLY SERIES SETTINGS
MAX_DURATION = 180  # 3 minutos (Eficiencia Galería)
CAPTION_TEXT = "🔥 *MALLY SERIES* - Nuevo Contenido 😈"

# 📂 BASE DE DATOS Y RUTAS
BASE_DIR = "media"
VIDEO_TEMP = f"{BASE_DIR}/videos"
HISTORY_DB = f"{BASE_DIR}/history.json" # Aquí se guarda lo "Ya enviado"
