import telebot
import os
import subprocess
import sys
from config import TELEGRAM_TOKEN, ADMIN_ID, WHATSAPP_ID, VIDEO_TEMP, DEBUG

bot = telebot.TeleBot(TELEGRAM_TOKEN)

def puente_whatsapp(video_path, target_id):
    """Llama al motor de Node.js para enviar el video"""
    try:
        print(f"📤 [WHATSAPP] Enviando a: {target_id}")
        subprocess.run(['node', 'whatsapp_bot/index.js', video_path, target_id], check=True)
        return True
    except Exception as e:
        print(f"❌ [ERROR] Fallo en el puente: {e}")
        return False

@bot.message_handler(commands=['start'])
def bienvenida(message):
    if message.from_user.id != ADMIN_ID: return
    bot.reply_to(message, "👑 **IMPERIO MP V2000 ONLINE**\n\nComandos:\n/conectar - Recibir código de WhatsApp\n/estado - Check del sistema")

@bot.message_handler(commands=['conectar'])
def solicitar_codigo(message):
    if message.from_user.id != ADMIN_ID: return
    
    bot.send_message(ADMIN_ID, "⏳ **Generando código de vinculación...**\nRevisa esta pantalla en unos segundos.")
    
    try:
        # Ejecutamos node para forzar la salida del código
        # El index.js debe estar configurado para imprimir "TU CÓDIGO DE VINCULACIÓN ES: XXXX"
        process = subprocess.Popen(
            ['node', 'whatsapp_bot/index.js', 'VINCULAR'],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        for line in process.stdout:
            if "TU CÓDIGO DE VINCULACIÓN ES:" in line:
                codigo = line.split(":")[1].strip()
                bot.send_message(ADMIN_ID, f"🔥 **CÓDIGO IMPERIO MP:**\n\n`{codigo}`\n\nPonlo en tu WhatsApp ahora.", parse_mode="Markdown")
                break
    except Exception as e:
        bot.send_message(ADMIN_ID, f"❌ Error: {e}")

@bot.message_handler(content_types=['video'])
def procesar_mally(message):
    if message.from_user.id != ADMIN_ID: return
    
    from processor.process import procesar_video
    v_id = message.video.file_unique_id
    
    bot.reply_to(message, "📥 **Video detectado.** Procesando...")

    try:
        # Descarga
        file_info = bot.get_file(message.video.file_id)
        downloaded = bot.download_file(file_info.file_path)
        
        if not os.path.exists(VIDEO_TEMP): os.makedirs(VIDEO_TEMP)
        raw_path = f"{VIDEO_TEMP}/{v_id}_raw.mp4"
        
        with open(raw_path, 'wb') as f:
            f.write(downloaded)

        # Edición
        video_final = procesar_video(raw_path)

        # Envío
        if puente_whatsapp(video_final, WHATSAPP_ID):
            bot.send_message(ADMIN_ID, "✅ **Video enviado al canal con éxito.**")
        
        # Limpieza
        os.remove(raw_path)
        os.remove(video_final)

    except Exception as e:
        bot.send_message(ADMIN_ID, f"❌ **Error Crítico:** {e}")

if __name__ == "__main__":
    print(f"🚀 [SISTEMA] Imperio MP activo para el admin: {ADMIN_ID}")
    bot.infinity_polling()
