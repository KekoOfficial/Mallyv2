@bot.message_handler(content_types=['video'])
def recibir_video(message):
    v_id = message.video.file_unique_id # ID único de Telegram

    if ya_enviado(v_id):
        print(f"⚠️ Video {v_id} ya existe en el canal. Omitiendo...")
        return

    # Si es nuevo, procede:
    file_info = bot.get_file(message.video.file_id)
    # ... (descarga y proceso FFmpeg) ...
    
    video_final = procesar_video(path)
    enviar_a_whatsapp(video_final)
    
    # Guardar en memoria
    registrar_envio(v_id)
