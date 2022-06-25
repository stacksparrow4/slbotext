const path = require("path");

module.exports = {
    entry: "./src/main.js",
    mode: "development",
    output: {
        filename: "bot.js",
        path: path.resolve(__dirname, "dist"),
    },
};
