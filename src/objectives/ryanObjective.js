import canvasUtil from "../canvasUtil.js";
// template goal which makes the snake tend towards the center

const ryanObjective = {
    name: "CENTER",

    getAction: (bot) => {
        return { target_x: 20000, target_y: 20000, boost: false };
    },

    getPriority: (bot) => {
        return 0;
    },

    drawDebug: (bot) => {
        const p1 = canvasUtil.point(20000, 20000);
        const p2 = canvasUtil.point(window.snake.xx, window.snake.yy);
        canvasUtil.drawLine(p1, p2, "#FFFFFF", 5);
        return;
    },
};

export default ryanObjective;