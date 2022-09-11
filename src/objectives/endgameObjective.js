// make big defensive circle
// circle go brbrbr

import canvasUtil from "../canvasUtil.js";
import bot from "../bot.js";
import { getMySnake, getSnakes, distanceBetween2 } from "./util.js";

const endgameObjective = {
    name: "DEFENSIVE CIRCLE ENDGAME",
    path: [],

    getPriority: function () {
        const myLength = getMySnake().segments.length;
        // TODO: maybe a check about snake position and overall "goodness" of making a defensive circle here
        // this corresponds to a score of about 5000
        const targetScore = 30;
        //const targetScore = 5000;
        if (myLength * 13.9 >= targetScore) {
            return 1;
        } else {
            return -10000;
        }
    },

    // this function is stolen from pathfindingObjective
    // look at this.path and determine next target point
    findCurrI: function () {
        // Find the first point that is not behind the snake.
        for (let i = 0; i < this.path.length; i++) {
            const relX = this.path[i].xx - window.snake.xx;
            const relY = this.path[i].yy - window.snake.yy;

            const dotProduct =
                Math.cos(window.snake.ang) * relX +
                Math.sin(window.snake.ang) * relY;

            if (dotProduct > 0) {
                return i + 1;
            }
        }

        // Sometimes happens due to lag
        return 0;
    },

    getAction: function () {
        if (this.path.length === 0) {
            // generate a big circle thing
            const me = getMySnake();
            const radius = 500; // TODO: changing radius depending on food and safety
            const turn = +1; // or -1 to turn in opposite direction
            const center = {
                xx: me.xx + radius * Math.cos(me.ang + turn * Math.PI / 2),
                yy: me.yy + radius * Math.sin(me.ang + turn * Math.PI / 2),
            };
            this.path = [];
            const PATH_RESOLUTION = 50; // 50 points on the path
            for (let i = 0; i < PATH_RESOLUTION; ++i) {
                const angle = (i / PATH_RESOLUTION) * (2 * Math.PI);
                this.path.push({
                    xx: center.xx + radius * Math.cos(angle),
                    yy: center.yy + radius * Math.sin(angle)
                });
            }
        }

        let currI = this.findCurrI();
        return {
            target_x: this.path[currI].xx,
            target_y: this.path[currI].yy,
            boost: false,
        };
    },

    drawDebug: function () {
        for (let i = 0; i < this.path.length; i++) {
            canvasUtil.drawLine(this.path[i], this.path[(i + 1) % this.path.length]);
        }
    },
};

export default endgameObjective;
