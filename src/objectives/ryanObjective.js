import canvasUtil from "../canvasUtil.js";
// template goal which makes the snake tend towards the center

const ryanObjective = {
    name: "RYAN DOING TESTING",

    getAction: (bot) => {
        const TARGET_DIST = 50
        const target1 = {
            xx: 20000 + TARGET_DIST,
            yy: 20000 + TARGET_DIST
        };
        const d1 = canvasUtil.getDistance2FromSnake(target1);
        const target2 = {
            xx: 20000 - TARGET_DIST,
            yy: 20000 - TARGET_DIST
        };
        const d2 = canvasUtil.getDistance2FromSnake(target2);
        // go to the further target
        const target = d1 > d2 ? target1 : target2;

        console.log(window.snake.sc);
        return { target_x: target.xx, target_y: target.yy, boost: true };
    },

    getPriority: (bot) => {
        return 10000;
    },

    drawDebug: (bot) => {
        return;
    },
};

export default ryanObjective;
