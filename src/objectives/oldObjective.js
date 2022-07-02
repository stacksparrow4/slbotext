// import canvasUtil from "../canvasUtil.js";
// template goal which makes the snake tend towards the center

import bot from "../bot";

const oldObjective = {
    name: "THE METHOD USED BY THE ORIGINAL BOT",

    getAction: (bot) => {
        bot.every();
        const boost = !bot.checkCollision() && bot.foodAccel();
        bot.computeFoodGoal();
        return {  target_x: bot.currentFood.x,  target_y: bot.currentFood.y, boost: boost };
    },

    getPriority: (bot) => {
        return 100;
    },

    drawDebug: (bot) => {
        return;
    },
};

export default oldObjective;