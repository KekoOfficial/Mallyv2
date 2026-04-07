import subprocess
import time
import os
from config import WHATSAPP_ID, DEBUG

def enviar_a_whatsapp(video_path):
    """
    🔥 Motor de Envío (V2000)
    Llama al script de Node.js para inyectar el video al canal.
    """
    if DEBUG:
        print(f"🚀 [SISTEMA] Preparando envío: {video_path}")
    
    try:
        # Ejecutamos el script de envío pasando el video como argumento
        # Usamos check_call para que Python espere a que Node termine
        subprocess.check_call(['node', 'whatsapp_bot/send.js', video_path, WHATSAPP_ID])
        
        if DEBUG:
            print("✅ [IMPERIO MP] Video entregado con éxito.")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ [ERROR CRÍTICO] Fallo en el motor de WhatsApp: {e}")
    except Exception as ex:
        print(f"⚠️ [ALERTA] Error inesperado: {ex}")

def limpiar_basura(video_path):
    """Elimina el video procesado para no llenar la memoria de Termux."""
    try:
        if os.path.exists(video_path):
            os.remove(video_path)
            if DEBUG:
                print(f"🗑️ Memoria liberada: {video_path}")
    except:
        pass

if __name__ == "__main__":
    print("""
    👑  IMPERIO MP - V2000 OMNI  👑
    --------------------------------
    🔥 Estado: ACTIVO
    🎬 Sistema: MALLY SERIES
    📱 Plataforma: TERMUX + BAILEYS
    --------------------------------
    """)
    
    # Aquí puedes arrancar el bot de Telegram
    # Importamos aquí para evitar ciclos si es necesario
    from telegram_bot.bot import bot
    
    try:
        print("🤖 Bot de Telegram escuchando...")
        bot.infinity_polling()
    except KeyboardInterrupt:
        print("\n🛑 Sistema apagado por el General.")
