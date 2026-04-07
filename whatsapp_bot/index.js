const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeInMemoryStore, 
    fetchLatestBaileysVersion, 
    DisconnectReason 
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const readline = require('readline')
const qrcode = require('qrcode-terminal')

// Configuración de la terminal para preguntas
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startImperio() {
    // 1. Gestión de Sesión Persistente
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const { version, isLatest } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Lo manejamos manual por la opción 1
        browser: ["Imperio MP", "Safari", "1.0"] // Identificador del dispositivo
    })

    // 2. Lógica de Vinculación (Si no hay sesión guardada)
    if (!sock.authState.creds.registered) {
        console.clear()
        console.log("👑 --- MALLY V2: CONFIGURACIÓN DE ACCESO --- 👑")
        console.log("\nSelecciona el método de conexión:")
        console.log("1. Escanear Código QR (Cámara)")
        console.log("2. Vincular con Código de 8 dígitos (Número de celular)")
        
        const opcion = await question("\n👉 Elige una opción (1 o 2): ")

        if (opcion === '1') {
            console.log("\n📷 Generando QR... Escanea con tu WhatsApp:")
            sock.ev.on('connection.update', (update) => {
                const { qr } = update
                if (qr) qrcode.generate(qr, { small: true })
            })
        } else if (opcion === '2') {
            const numero = await question("\n📱 Introduce tu número (ej: 5959XXXXXXXX): ")
            // Limpiar el número de símbolos
            const cleanNumber = numero.replace(/[^0-9]/g, '')
            
            setTimeout(async () => {
                let code = await sock.requestPairingCode(cleanNumber)
                console.log(`\n🔥 TU CÓDIGO DE VINCULACIÓN ES: ${code}`)
                console.log("⚠️ Ingresa este código en tu WhatsApp (Dispositivos Vinculados)\n")
            }, 3000)
        }
    }

    // 3. Manejo de Conexión y Envío
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log("\n✅ [IMPERIO MP] ¡CONECTADO CON ÉXITO! 😈")
            console.log("🚀 El sistema Mally Series está listo.\n")

            // Lógica de envío automático si viene de Python
            const videoPath = process.argv[2]
            const targetChat = process.argv[3]

            if (videoPath && targetChat) {
                try {
                    console.log(`📤 Enviando video a: ${targetChat}`)
                    await sock.sendMessage(targetChat, { 
                        video: { url: videoPath }, 
                        caption: "🔥 *MALLY SERIES* 😈" 
                    })
                    await delay(3000) // Espera para asegurar el buffer
                    process.exit(0)
                } catch (err) {
                    console.log("❌ Error al enviar:", err)
                    process.exit(1)
                }
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('⚠️ Conexión cerrada. ¿Reintentando?:', shouldReconnect)
            if (shouldReconnect) startImperio()
        }
    })

    // Guardar credenciales automáticamente
    sock.ev.on('creds.update', saveCreds)
}

// Ejecutar motor
startImperio()
