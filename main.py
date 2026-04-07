import telebot
import os
import subprocess
from config import TELEGRAM_TOKEN, VIDEO_TEMP, WHATSAPP_ID
from processor.process import es_nuevo, registrar_video, procesar_video

bot = telebot.TeleBot(TELEGRAM_TOKEN)

def puente_whatsapp(video_path):
    try:
        # Lanza el motor Node con el video y el ID del canal
        subprocess.check_call(['node', 'whatsapp_bot/index.js', video_path, WHATSAPP_ID])
    except Exception as e:
        print(f"❌ Error en el motor de WhatsApp: {e}")

@bot.message_handler(content_types=['video'])
def on_video(message):
    v_id = message.video.file_unique_id
    
    if not es_nuevo(v_id):
        print(f"⚠️ [OMNI] Video {v_id} ya existe en el canal. Omitiendo...")
        return

    print(f"📥 [OMNI] Nuevo video detectado. Descargando...")
    file_info = bot.get_file(message.video.file_id)
    downloaded = bot.download_file(file_info.file_path)
    
    raw_path = f"{VIDEO_TEMP}/{v_id}_raw.mp4"
    with open(raw_path, 'wb') as f:
        f.write(downloaded)

    # Procesar y Enviar
    ready_video = procesar_video(raw_path)
    puente_whatsapp(ready_video)
    
    # Registro y Limpieza
    registrar_video(v_id)
    if os.path.exists(raw_path): os.remove(raw_path)
    if os.path.exists(ready_video): os.remove(ready_video)

if __name__ == "__main__":
    print("👑 IMPERIO MP V2000 - SISTEMA TOTALMENTE ACTUALIZADO 👑")
    bot.infinity_polling()
