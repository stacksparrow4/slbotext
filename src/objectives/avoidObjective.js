import canvasUtil from "../canvasUtil.js";
import { getSnakes } from "./util";

// can attack snakes within this radial distance
const ATTACK_DIST = 600;
const VISIBLE_DIST = 600;

// its bad when youre less than 1.5 radii from the center of a snake
const CLOSEST_MULT = 2;

// attracted to in front of an opponents head according to gaussian distribution
// attracted to this point this far in front of the head, when other snake is not boosting
const FRONT_DIST_DEFAULT = 0;
// attracted to this point this far in front of the head, when other snake is boosting
const FRONT_DIST_BOOST = 20;
// radius of attraction
const FRONT_MULT = 9;
// magnitude of attraction
const FRONT_MAGNITUDE = 3;

const ENABLE_THRESHOLD = -1e-10;

const DEBUG_GAP = 50;
const DEBUG_RAD = DEBUG_GAP * 10;
const DEBUG_NORM = 2;
const DEBUG_SHOW_AHEAD = 10;
const DEBUG_RAY_LEN = 25;

const getPointGradientFunction = () => {
    const snakes = getSnakes();

    return (currPoint) => {
        let val = 0;
        let dx = 0;
        let dy = 0;

        let targets = [];
        let avoids = [];

        for (const s of snakes) {
            const speed_mult = window.snake.sp / 5.78 * 2 / 2.4;
            const front_dist = Math.max(0, (speed_mult - 1) * FRONT_DIST_BOOST) + FRONT_DIST_DEFAULT;
            targets.push({
                xx: currPoint.xx - (s.xx + front_dist * Math.cos(s.ang)),
                yy: currPoint.yy - (s.yy + front_dist * Math.sin(s.ang)),
                ang: s.ang,
                radius: s.radius,
                priority: s.segments.length // currently ignoring this, but will be useful later
            });
            avoids.push({
                xx: currPoint.xx - s.xx,
                yy: currPoint.yy - s.yy,
                radius: s.radius,
            });
            for (const seg of s.segments) {
                avoids.push({
                    xx: currPoint.xx - seg.xx,
                    yy: currPoint.yy - seg.yy,
                    radius: s.radius,
                });
            }
        }
        targets = targets
            .map(point => ({ ...point, dist: point.xx * point.xx + point.yy * point.yy }))
            .filter(point => (point.dist <= VISIBLE_DIST * VISIBLE_DIST));
        avoids = avoids
            .map(point => ({ ...point, dist: point.xx * point.xx + point.yy * point.yy }))
            .filter(point => (point.dist <= VISIBLE_DIST * VISIBLE_DIST));

        // e^(-r^2) * (x cos theta + y sin theta)
        // for (const target of targets) {
        //     // TODO: condition to determine if kill is suitable
        //     // e.g. visible map not dense, mass large enough to boost, mass not to large to be clumsy, reasonably close to the snake
        //     if (target.dist <= ATTACK_DIST * ATTACK_DIST) {
        //         const r = target.radius * FRONT_MULT;
        //         const expr1 = FRONT_MAGNITUDE * Math.exp(target.dist / (-r * r));
        //         const expr2 = -target.xx * Math.cos(target.ang) + -target.yy * Math.sin(target.ang);
        //         val += expr1 * expr2;
        //         dx += expr1 * (Math.cos(target.ang) - 2 * target.xx / (-r * r) * expr2);
        //         dy += expr1 * (Math.sin(target.ang) - 2 * target.yy / (-r * r) * expr2);
        //     }
        // }

        // -r^(-6)
        for (const avoid of avoids) {
            const r = avoid.radius * CLOSEST_MULT;
            val -= 1 / Math.pow(avoid.dist / (r * r), 6);
            dx -= -6 * 2 * avoid.xx / (r * r) / Math.pow(avoid.dist / (r * r), 7);
            dy -= -6 * 2 * avoid.yy / (r * r) / Math.pow(avoid.dist / (r * r), 7);
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
        console.log(val);

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
        const { val } = this.gradFunc(window.snake);
        const normalised = val / ENABLE_THRESHOLD;
        return Math.max(-1, Math.min(1, normalised));
        //return 100;
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
            const cachedMin = Math.min(...cachedVals);
            const cachedMax = Math.max(...cachedVals);

            let i = 0;
            for (let xx = startX; xx <= endX; xx += DEBUG_GAP) {
                for (let yy = startY; yy <= endY; yy += DEBUG_GAP) {
                    const col = Math.min(
                        Math.floor(255 * (cachedVals[i] - cachedMin) / (cachedMax - cachedMin)),
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
