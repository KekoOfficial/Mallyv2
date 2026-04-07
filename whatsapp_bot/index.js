const { default: makeWASocket, useMultiFileAuthState, delay, disconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    })

    // Vinculación por Código (Solo si no hay sesión)
    if (!sock.authState.creds.registered) {
        const nmbr = "5959XXXXXXXX" // Cámbialo por tu MY_NUMBER
        setTimeout(async () => {
            let code = await sock.requestPairingCode(nmbr)
            console.log(`\n🔥 CÓDIGO DE VINCULACIÓN: ${code}\n`)
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)

    // Captura de argumentos para envío automático
    const videoPath = process.argv[2]
    const targetChat = process.argv[3]

    if (videoPath && targetChat) {
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update
            if (connection === 'open') {
                console.log("📤 Enviando al canal de WhatsApp...")
                await sock.sendMessage(targetChat, { 
                    video: { url: videoPath }, 
                    caption: "🔥 *MALLY SERIES* 😈" 
                })
                await delay(3000)
                process.exit(0)
            }
        })
    }
}
start()
