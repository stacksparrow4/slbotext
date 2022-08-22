import canvasUtil from "../canvasUtil.js";
import { getSnakes } from "./util";

// its bad when youre less than 1.5 radii from the center of a snake
const CLOSEST_MULT = 2.5;

// attracted to in front of an opponents head according to gaussian distribution
const FRONT_DIST = 190;
const FRONT_MULT = 10000;

const ENABLE_THRESHOLD = -1e-10;

const DEBUG_GAP = 50;
const DEBUG_RAD = DEBUG_GAP * 10;
const DEBUG_NORM = 2;
const DEBUG_SHOW_AHEAD = 20;
const DEBUG_RAY_LEN = 10;

function normDist(pointA, pointB) {
    return (Math.pow(pointA.xx - pointB.xx, 2) + Math.pow(pointA.yy - pointB.yy, 2));
}

const getPointGradientFunction = () => {
    const snakes = getSnakes();

    return (point) => {
        let val = 0;
        let dx = 0;
        let dy = 0;
        for (const s of snakes) {
            const inFront = {
                xx: s.xx + FRONT_DIST * Math.cos(s.ang),
                yy: s.yy + FRONT_DIST * Math.sin(s.ang)
            };
            const frontDist = normDist(point, inFront) / (-s.radius * FRONT_MULT);
            const dval = Math.exp(frontDist);
            val += dval;
            dx += 2 * (inFront.xx - point.xx) / (s.radius * FRONT_MULT) * dval;
            dy += 2 * (inFront.yy - point.yy) / (s.radius * FRONT_MULT) * dval;

            const dist = normDist(point, s) / (s.radius * CLOSEST_MULT);
            val -= 1 / Math.pow(dist, 4);
            dx -= 2 * (s.xx - point.xx) / Math.pow(dist, 5);
            dy -= 2 * (s.yy - point.yy) / Math.pow(dist, 5);

            for (const seg of s.segments) {
                const dist = normDist(point, seg) / (s.radius * CLOSEST_MULT);
                val -= 1 / Math.pow(dist, 4);
                dx -= 2 * (seg.xx - point.xx) / Math.pow(dist, 5);
                dy -= 2 * (seg.yy - point.yy) / Math.pow(dist, 5);
            }
        }

        return {
            val: val,
            dx: dx,
            dy: dy
        };
    };
};

const avoidObjective = {
    name: "AVOID",

    gradFunc: null,

    tick: function () {
        this.gradFunc = getPointGradientFunction();
    },

    getAction: function () {
        const { dx, dy, val } = this.gradFunc(window.snake);

        const len = Math.sqrt(
            Math.pow(dx, 2) + Math.pow(dy, 2)
        );
        const dir_x = (100 * dx) / len;
        const dir_y = (100 * dy) / len;

        return {
            target_x: window.snake.xx + dir_x,
            target_y: window.snake.yy + dir_y,
            boost: false,
        };
    },

    getPriority: function () {
        /*const { val } = this.gradFunc(window.snake);
        const normalised = val / ENABLE_THRESHOLD;
        return Math.max(-1, Math.min(1, normalised));*/
        return 100;
    },

    drawDebug: function () {
        if (window.visualDebugging) {
            const startX = window.snake.xx - DEBUG_RAD;
            const endX = window.snake.xx + DEBUG_RAD;
            const startY = window.snake.yy - DEBUG_RAD;
            const endY = window.snake.yy + DEBUG_RAD;

            const cachedVals = [];
            for (let xx = startX; xx <= endX; xx += DEBUG_GAP) {
                for (let yy = startY; yy <= endY; yy += DEBUG_GAP) {
                    cachedVals.push(this.gradFunc({ xx: xx, yy: yy }).val);
                }
            }

            let i = 0;
            for (let xx = startX; xx <= endX; xx += DEBUG_GAP) {
                for (let yy = startY; yy <= endY; yy += DEBUG_GAP) {
                    const col = Math.min(
                        Math.floor((255 * cachedVals[i]) / DEBUG_NORM),
                        255
                    );
                    canvasUtil.drawCircle(
                        { xx, yy },
                        `rgb(${col}, ${col}, ${col})`,
                        true
                    );
                    i++;
                }
            }
        }

        let prev_x = window.snake.xx;
        let prev_y = window.snake.yy;

        for (let i = 0; i < DEBUG_SHOW_AHEAD; i++) {
            const dirGrad = this.gradFunc({ xx: prev_x, yy: prev_y });

            if (i === 0 && dirGrad.val > ENABLE_THRESHOLD) {
                // We are not enabled, dont show visual
                //return;
            }

            const len = Math.sqrt(
                Math.pow(dirGrad.dx, 2) + Math.pow(dirGrad.dy, 2)
            );
            const dir_x = (DEBUG_RAY_LEN * dirGrad.dx) / len;
            const dir_y = (DEBUG_RAY_LEN * dirGrad.dy) / len;

            const curr_x = prev_x + dir_x;
            const curr_y = prev_y + dir_y;

            const p1 = canvasUtil.point(prev_x, prev_y);
            const p2 = canvasUtil.point(curr_x, curr_y);

            canvasUtil.drawLine(p1, p2, "#0f0", 3);

            prev_x = curr_x;
            prev_y = curr_y;
        }
    },
};

export default avoidObjective;
