import canvasUtil from "../canvasUtil.js";
import { getSnakes } from "./util.js";

const anticircleObjective = {
    name: "ANTICIRCLE",

    getAction: () => {
        return {
            target_x: window.snake.xx + 100,
            target_y: window.snake.yy + 100,
            boost: false,
        };
    },

    getPriority: () => {
        return -1;
    },

    drawDebug: () => {},
};

export default anticircleObjective;
