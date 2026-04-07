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

// ⚙️ NÚMERO DE VINCULACIÓN (Asegúrate que sea el tuyo)
const MI_NUMERO = "595986114722" 

async function startImperio() {
    const authPath = './auth'
    const { state, saveCreds } = await useMultiFileAuthState(authPath)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'), // Emulación profesional
        syncFullHistory: false
    })

    // --- 🛠️ PROTOCOLO DE VINCULACIÓN ---
    if (!sock.authState.creds.registered) {
        console.log("⏳ Generando código de vinculación...")
        await delay(5000)
        try {
            let code = await sock.requestPairingCode(MI_NUMERO)
            console.log(`TU CÓDIGO DE VINCULACIÓN ES: ${code}`)
        } catch (err) {
            console.log("❌ ERROR_GENERANDO_CODIGO")
        }
    }

    // --- ✅ GESTIÓN DE EVENTOS ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log("\n✅ [CONECTADO CON ÉXITO]");
            
            // --- 🔍 ESCÁNER DE CANALES (NEWSLETTERS) ---
            try {
                // Esto buscará todos los canales donde eres admin o seguidor
                const newsletters = await sock.newsletterQueryResult()
                console.log("-------------------------------------------")
                console.log("📋 CANALES DETECTADOS (Copia el ID exacto):")
                newsletters.forEach(n => {
                    console.log(`📌 NOMBRE: ${n.name} | ID: ${n.id}`);
                });
                console.log("-------------------------------------------\n")
            } catch (e) {
                console.log("⚠️ No se pudieron listar los canales automáticamente.");
            }

            // --- 🎬 LÓGICA DE ENVÍO DE VIDEO ---
            const videoPath = process.argv[2]
            const targetChat = process.argv[3]

            if (videoPath && targetChat && videoPath !== 'VINCULAR') {
                try {
                    console.log(`🚀 Intentando publicar en: ${targetChat}...`)
                    await sock.sendMessage(targetChat, { 
                        video: { url: videoPath }, 
                        caption: "🔥 *MALLY SERIES* 😈",
                        mimetype: 'video/mp4'
                    })
                    console.log("✅ ¡VIDEO PUBLICADO CON ÉXITO!")
                    await delay(2000)
                    process.exit(0)
                } catch (err) {
                    console.log(`❌ ERROR DE ENVÍO: ${err.message}`)
                    process.exit(1)
                }
            }
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode
            if (statusCode !== DisconnectReason.loggedOut) {
                startImperio()
            } else {
                console.log("🚫 Sesión cerrada. Borrando 'auth' y reiniciando...")
                fs.rmSync(authPath, { recursive: true, force: true })
                process.exit(1)
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

startImperio().catch(err => console.error("Fallo crítico:", err))
