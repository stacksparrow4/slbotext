const { WebSocketServer, WebSocket } = require("ws");

const wss = new WebSocketServer({ port: 9001 });

let clients = [];

wss.on("connection", function connection(ws) {
    ws.on("message", function message(data) {
        if (data.toString() === "reload") {
            clients = clients.filter(
                (client) => client.readyState === WebSocket.OPEN
            );

            console.log(`Triggering reload for ${clients.length} client(s)!`);

            for (let i = 0; i < clients.length; i++) {
                clients[i].send("extreload");
            }
        } else if (data.toString() === "iamclient") {
            console.log("Adding websocket client");
            clients.push(ws);
        }
    });
});
