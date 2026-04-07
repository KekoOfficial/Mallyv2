const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    delay, 
    DisconnectReason,
    Browsers
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')

// ⚙️ Traemos el número desde el entorno o lo fijamos
const MI_NUMERO = "595986114722" 

async function startImperio() {
    // Definimos la ruta de autenticación
    const authPath = './auth'
    const { state, saveCreds } = await useMultiFileAuthState(authPath)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        // 🖥️ Emulación de Navegador Real (Evita el bloqueo de WhatsApp)
        browser: Browsers.ubuntu('Chrome'), 
        syncFullHistory: false,
        markOnlineOnConnect: true
    })

    // --- 🛠️ MODO VINCULACIÓN INTELIGENTE ---
    if (!sock.authState.creds.registered) {
        console.log("⏳ Iniciando protocolo de vinculación...")
        await delay(5000) // Espera de seguridad para evitar spam
        
        try {
            // Solicitamos el código de emparejamiento
            let code = await sock.requestPairingCode(MI_NUMERO)
            // Formato exacto que lee tu main.py
            console.log(`TU CÓDIGO DE VINCULACIÓN ES: ${code}`)
        } catch (err) {
            console.log("❌ ERROR_GENERANDO_CODIGO: Reintenta en un momento.")
        }
    }

    // --- ✅ GESTIÓN DE EVENTOS ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log("✅ CONECTADO CON ÉXITO: Imperio MP V2000 está en línea.")
            
            // Lógica de envío de video (Argumentos desde Python)
            const videoPath = process.argv[2]
            const targetChat = process.argv[3]

            if (videoPath && targetChat && videoPath !== 'VINCULAR') {
                try {
                    await sock.sendMessage(targetChat, { 
                        video: { url: videoPath }, 
                        caption: "🔥 *MALLY SERIES* - Contenido Imperial 😈",
                        mimetype: 'video/mp4'
                    })
                    console.log("🎬 VIDEO_ENVIADO")
                    await delay(3000)
                    process.exit(0)
                } catch (err) {
                    console.log(`❌ ERROR_ENVIO: ${err.message}`)
                    process.exit(1)
                }
            }
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut

            console.log(`📡 Conexión cerrada. Razón: ${statusCode}. Reconectando: ${shouldReconnect}`)

            if (shouldReconnect) {
                startImperio()
            } else {
                console.log("🚫 Sesión cerrada permanentemente. Limpiando datos...")
                if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true })
                process.exit(1)
            }
        }
    })

    // Guardar credenciales automáticamente
    sock.ev.on('creds.update', saveCreds)
}

// Ejecutar el motor con manejo de errores global
startImperio().catch(err => {
    console.error("💥 Error fatal en el motor:", err)
})
