// make big defensive circle
// circle go brbrbr

import canvasUtil from "../canvasUtil.js";
import { getMySnake, getSnakes, distanceBetween2 } from "./util.js";

const PATH_RESOLUTION = 50; // 50 points on the path

const endgameObjective = {
    name: "DEFENSIVE CIRCLE ENDGAME",
    path: [],
    isChosen: 0,

    getPriority: function () {
        this.isChosen++;

        const myLength = getMySnake().segments.length;
        // TODO: maybe a check about snake position and overall "goodness" of making a defensive circle here
        // this corresponds to a score of about 5000
        const targetScore = 1500;
        //const targetScore = 5000;
        if (myLength * 13.9 >= targetScore) {
            return 0.9;
        } else {
            this.path = [];
            return -10000;
        }
    },

    // this function is stolen from pathfindingObjective, but slightly adapted for circle stuff
    // look at this.path and determine next target point
    findCurrI: function () {
        // this is the orignal dumb way - your progress increases linearly with time
        // this doesnt account for boosts
        //return Math.ceil(BASE_SPEED * (Date.now() - this.pathTime) / this.stepSize);

        // find cloest point and aim for the "next" point
        // TODO: this very much breaks when the path is self intersecting, or
        // close the being self intersecting
        let bestI = 0;
        for (let i = 1; i < this.path.length; i++) {
            if (distanceBetween2(window.snake, this.path[i]) < distanceBetween2(window.snake, this.path[bestI])) {
                bestI = i;
            }
        }
        
        // +2 adds some smoothing to make snake movements seem natural
        return bestI % this.path.length;
    },

    genCirclePath: function(radius, turnSgn) {
        const me = getMySnake();
        const center = {
            xx: me.xx + radius * Math.cos(me.ang + turnSgn * Math.PI / 2),
            yy: me.yy + radius * Math.sin(me.ang + turnSgn * Math.PI / 2),
        };

        this.path = [];
        for (let i = 0; i < PATH_RESOLUTION; ++i) {
            const angle = (i / PATH_RESOLUTION) * (2 * Math.PI);
            this.path.push({
                xx: center.xx + radius * Math.cos(angle),
                yy: center.yy + radius * Math.sin(angle)
            });
        }
    },

    getAction: function () {
        if (this.isChosen > 1 || this.path.length === 0) {
            // generate a big circle thing
            // TODO: changing radius depending on food and safety
            const radius = 500 - 10 * getSnakes().length;
            const turn = -1; // or +1 to turn in opposite direction
            this.genCirclePath(radius, turn);
        }
        this.isChosen = 0;

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
