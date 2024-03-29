// import canvasUtil from "../canvasUtil.js";
// template goal which makes the snake tend towards the center

import bot from "../bot";

const oldObjective = {
    name: "THE METHOD USED BY THE ORIGINAL BOT",

    getAction: (bot) => {
        const boost = !bot.checkCollision() && bot.foodAccel();
        bot.computeFoodGoal();
        return {
            target_x: bot.currentFood.xx,
            target_y: bot.currentFood.yy,
            boost: boost,
        };
    },

    getPriority: (bot) => {
        return -100;
    },

    drawDebug: (bot) => {
        return;
    },
};

export default oldObjective;
