const WebSocket = require('ws');

class NotificationDistributor {
    constructor(server) {
        this.wss = new WebSocket.Server({ server, path: '/notification' });
        this.sessionsMap = {};

        this.wss.on('connection', (ws) => this.handleConnection(ws));
    }

    handleConnection(ws) {
        console.log(`Nieuwe WebSocket-verbinding`);

        ws.on('message', (message) => this.handleTextMessage(ws, message));
        ws.on('close', () => this.handleClose(ws));
        ws.on('error', (error) => this.handleTransportError(ws, error));
    }

    handleTextMessage(ws, message) {
        console.log(`Bericht ontvangen: ${message}`);
        const command = message.toString();

        if (command.startsWith("notify ")) {
            this.notify(command.split(" ")[1], ws);
        } else if (command.startsWith("subscribe ")) {
            this.subscribe(command.split(" ")[1], ws);
        } else if (command.startsWith("unsubscribe ")) {
            this.unsubscribe(command.split(" ")[1], ws);
        } else {
            console.warn(`Niet-ondersteund bericht: '${command}'`);
        }
    }

    handleTransportError(ws, error) {
        console.error(`Transport error met WebSocket`, error);
    }

    handleClose(ws) {
        console.log(`WebSocket verbinding gesloten`);
        // Verwijder de WebSocket uit alle topics waarop hij geabonneerd is
        Object.keys(this.sessionsMap).forEach(topic => {
            this.unsubscribe(topic, ws);
        });
    }

    subscribe(topic, ws) {
        console.log(`Abonneren WebSocket op topic: ${topic}`);
        if (!this.sessionsMap[topic]) {
            this.sessionsMap[topic] = new Set();
        }
        this.sessionsMap[topic].add(ws);
    }

    unsubscribe(topic, ws) {
        console.log(`Afmelden WebSocket van topic: ${topic}`);
        const subscribers = this.sessionsMap[topic];
        if (subscribers) {
            subscribers.delete(ws);
            if (subscribers.size === 0) {
                delete this.sessionsMap[topic];
            }
        }
    }

    notify(topic, fromSession = null) {
        console.log(`Notificatie naar topic: ${topic}`);
        const subscribers = this.sessionsMap[topic];
        if (!subscribers || subscribers.size === 0) {
            return;
        }

        subscribers.forEach((client) => {
            if (client !== fromSession && client.readyState === WebSocket.OPEN) {
                try {
                    console.log(`Notificatie verzonden naar client`);
                    client.send(`notify ${topic}`);
                } catch (error) {
                    console.error(`Error bij versturen notificatie`, error);
                    this.unsubscribe(topic, client); // Verwijder client bij een fout
                }
            }
        });
    }
}

module.exports = NotificationDistributor;
