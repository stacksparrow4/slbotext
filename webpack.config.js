const path = require("path");

const Websocket = require("ws");

var ws;

module.exports = {
    entry: "./src/main.js",
    mode: "development",
    output: {
        filename: "bot.js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap(
                    "AfterEmitPlugin",
                    (compilation) => {
                        if (!ws) {
                            ws = new Websocket("ws://localhost:9001/");
                        } else {
                            ws.send("reload");
                        }
                    }
                );
            },
        },
    ],
};
