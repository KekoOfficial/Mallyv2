const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function startImperio() {
    // La carpeta 'auth' guardará la sesión para que no se pierda al apagar
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false // Desactivamos QR para usar código
    })

    // Lógica de Pairing Code para Termux
    if (!sock.authState.creds.registered) {
        const phoneNumber = "595XXXXXXXXX" // Tu número con código de país
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber)
            console.log(`\n🔥 CÓDIGO DE VINCULACIÓN: ${code}\n`)
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', (update) => {
        const { connection } = update
        if(connection === 'open') console.log("✅ IMPERIO MP CONECTADO")
    })

    return sock
}
