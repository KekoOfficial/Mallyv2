const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    delay, 
    DisconnectReason 
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')

// ⚙️ CONFIGURACIÓN MANUAL (Asegúrate de que coincida con tu config.py)
const MI_NUMERO = "595986114722" 

async function startImperio() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Imperio MP", "Chrome", "1.0"]
    })

    // --- 🛠️ MODO VINCULACIÓN (Desde Telegram) ---
    if (!sock.authState.creds.registered) {
        // Esperamos un momento para que el motor arranque
        await delay(2000)
        try {
            let code = await sock.requestPairingCode(MI_NUMERO)
            // IMPORTANTE: Este formato lo lee el main.py para enviártelo a Telegram
            console.log(`TU CÓDIGO DE VINCULACIÓN ES: ${code}`)
        } catch (err) {
            console.log("❌ Error al generar código")
        }
    }

    // --- ✅ GESTIÓN DE CONEXIÓN ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log("✅ CONECTADO CON ÉXITO")
            
            // Lógica de envío de video si se pasan argumentos desde Python
            const videoPath = process.argv[2]
            const targetChat = process.argv[3]

            if (videoPath && targetChat && videoPath !== 'VINCULAR') {
                try {
                    await sock.sendMessage(targetChat, { 
                        video: { url: videoPath }, 
                        caption: "🔥 *MALLY SERIES* 😈" 
                    })
                    await delay(2000)
                    process.exit(0)
                } catch (err) {
                    process.exit(1)
                }
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startImperio()
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

// Ejecutar motor
startImperio()
