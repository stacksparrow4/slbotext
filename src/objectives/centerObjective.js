import bot from "../bot.js";
import canvasUtil from "../canvasUtil.js";
// template goal which makes the snake tend towards the center

const centerObjective = {
    name: "CENTER",

    getAction: () => {
        return { target_x: bot.MID_X, target_y: bot.MID_Y, boost: false };
    },

    getPriority: (bot) => {
        return 0;
    },

    drawDebug: () => {
        const p1 = canvasUtil.point(bot.MID_X, bot.MID_Y);
        const p2 = canvasUtil.point(window.snake.xx, window.snake.yy);
        canvasUtil.drawLine(p1, p2, "#FFFFFF", 5);
        return;
    },
};

export default centerObjective;
