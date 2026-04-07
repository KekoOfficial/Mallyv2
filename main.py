import telebot
import os
import subprocess
import sys
from config import TELEGRAM_TOKEN, VIDEO_TEMP, WHATSAPP_ID, DEBUG

# Inicializar Bot de Telegram
bot = telebot.TeleBot(TELEGRAM_TOKEN)

def puente_whatsapp(video_path, target_id):
    """
    🚀 Lanza el motor de Node.js heredando la terminal 
    para que puedas interactuar con las opciones 1 y 2.
    """
    try:
        if DEBUG:
            print(f"📡 [PUENTE] Enviando a WhatsApp: {video_path}")
        
        # Ejecutamos con shell para que sea interactivo en Termux
        # Pasamos el video_path y el ID del grupo como argumentos
        resultado = subprocess.run(
            ['node', 'whatsapp_bot/index.js', video_path, target_id],
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ [ERROR] El motor de WhatsApp falló: {e}")
        return False
    except Exception as ex:
        print(f"⚠️ [ALERTA] Error inesperado en el puente: {ex}")
        return False

@bot.message_handler(content_types=['video'])
def manejar_video_entrante(message):
    from processor.process import es_nuevo, registrar_video, procesar_video
    
    v_id = message.video.file_unique_id
    
    # 1. Filtro de duplicados
    if not es_nuevo(v_id):
        print(f"⚠️ [OMNI] Video {v_id} detectado como 'YA ENVIADO'. Omitiendo...")
        return

    print(f"📥 [OMNI] Nuevo video en cola. Procesando...")
    
    # 2. Descarga de Telegram
    try:
        file_info = bot.get_file(message.video.file_id)
        downloaded = bot.download_file(file_info.file_path)
        
        if not os.path.exists(VIDEO_TEMP):
            os.makedirs(VIDEO_TEMP)
            
        raw_path = f"{VIDEO_TEMP}/{v_id}_raw.mp4"
        with open(raw_path, 'wb') as f:
            f.write(downloaded)

        # 3. Edición (Corte Mally Series)
        video_final = procesar_video(raw_path)

        # 4. Envío a WhatsApp
        if puente_whatsapp(video_final, WHATSAPP_ID):
            # 5. Registro y limpieza si el envío fue exitoso
            registrar_video(v_id)
            print(f"✅ [IMPERIO] Ciclo completado para {v_id}")
        
        # Limpieza de archivos temporales para ahorrar espacio
        if os.path.exists(raw_path): os.remove(raw_path)
        if os.path.exists(video_final): os.remove(video_final)

    except Exception as e:
        print(f"❌ [ERROR CRÍTICO] Fallo en el flujo: {e}")

if __name__ == "__main__":
    print(f"""
    👑 IMPERIO MP V2000 - OMNI SYSTEM 👑
    ------------------------------------
    🔥 Estado: ACTIVO
    🎬 Canal: {WHATSAPP_ID}
    🤖 Bot: @{bot.get_me().username}
    ------------------------------------
    """)
    
    try:
        print("🚀 Esperando videos en Telegram...")
        bot.infinity_polling()
    except KeyboardInterrupt:
        print("\n🛑 Sistema apagado por el General. ¡Hasta la próxima!")
        sys.exit()
