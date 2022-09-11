// make big circle
// circle go brbrbr

import canvasUtil from "../canvasUtil.js";
import bot from "../bot.js";
import { getMySnake, getSnakes, distanceBetween2 } from "./util.js";

const pathfindingObjective = {
    getPriority: function () {
        return 1;
    },

    getAction: function () {
        return {
            target_x: 0
            target_y: 0
            boost: false,
        };
    },

    drawDebug: function () {

    },
};

export default endgameObjective;
