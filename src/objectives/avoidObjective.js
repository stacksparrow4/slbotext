import canvasUtil from "../canvasUtil.js";
import { getSnakes } from "./util";

const HEAD_DISTANCE_FACTOR = 30000;
const BODY_DISTANCE_FACTOR = 300;
const BASE_RAD = 15;

const ENABLE_THRESHOLD = 0.012;

const DEBUG_GAP = 50;
const DEBUG_RAD = DEBUG_GAP * 10;
const DEBUG_NORM = 2;
const DEBUG_SHOW_AHEAD = 20;
const DEBUG_RAY_LEN = 10;

const getPointGradientFunction = () => {
    const snakes = getSnakes();

    return (x, y) => {
        return snakes
            .map((s) => {
                const size_factor = s.radius / BASE_RAD;

                const distance_from_head =
                    Math.pow(s.xx - x, 2) + Math.pow(s.yy - y, 2);
                const head_value = Math.exp(
                    -distance_from_head / (HEAD_DISTANCE_FACTOR * size_factor)
                );
                const partial_x =
                    head_value * ((-2 * (x - s.xx)) / HEAD_DISTANCE_FACTOR);
                const partial_y =
                    head_value * ((-2 * (y - s.yy)) / HEAD_DISTANCE_FACTOR);

                const body_value = s.segments
                    .map((seg) => {
                        const distance_from_seg =
                            Math.pow(seg.xx - x, 2) + Math.pow(seg.yy - y, 2);
                        const seg_val = Math.exp(
                            -distance_from_seg /
                                (BODY_DISTANCE_FACTOR * size_factor)
                        );
                        const partial_x =
                            seg_val *
                            ((-2 * (x - seg.xx)) / BODY_DISTANCE_FACTOR);
                        const partial_y =
                            seg_val *
                            ((-2 * (y - seg.yy)) / BODY_DISTANCE_FACTOR);

                        return { val: seg_val, dx: partial_x, dy: partial_y };
                    })
                    .reduce(
                        (a, b) => ({
                            val: a.val + b.val,
                            dx: a.dx + b.dx,
                            dy: a.dy + b.dy,
                        }),
                        {
                            val: 0,
                            dx: 0,
                            dy: 0,
                        }
                    );
                return {
                    val: head_value + body_value.val,
                    dx: partial_x + body_value.dx,
                    dy: partial_y + body_value.dy,
                };
            })
            .reduce(
                (a, b) => ({
                    val: a.val + b.val,
                    dx: a.dx + b.dx,
                    dy: a.dy + b.dy,
                }),
                {
                    val: 0,
                    dx: 0,
                    dy: 0,
                }
            );
    };
};

const avoidObjective = {
    name: "AVOID",

    gradFunc: null,

    tick: function () {
        this.gradFunc = getPointGradientFunction();
    },

    getAction: function () {
        const dirGrad = this.gradFunc(window.snake.xx, window.snake.yy);

        const len = Math.sqrt(
            Math.pow(dirGrad.dx, 2) + Math.pow(dirGrad.dy, 2)
        );
        const dir_x = -(100 * dirGrad.dx) / len;
        const dir_y = -(100 * dirGrad.dy) / len;

        return {
            target_x: window.snake.xx + dir_x,
            target_y: window.snake.yy + dir_y,
            boost: false,
        };
    },

    getPriority: function () {
        const { val } = this.gradFunc(window.snake.xx, window.snake.yy);
        const normalised = val * 2 / ENABLE_THRESHOLD - 1;
        return Math.max(-1, Math.min(1, normalised));
    },

    drawDebug: function () {
        if (window.visualDebugging) {
            const startX = window.snake.xx - DEBUG_RAD;
            const endX = window.snake.xx + DEBUG_RAD;
            const startY = window.snake.yy - DEBUG_RAD;
            const endY = window.snake.yy + DEBUG_RAD;

            const cachedVals = [];
            for (let x = startX; x <= endX; x += DEBUG_GAP) {
                for (let y = startY; y <= endY; y += DEBUG_GAP) {
                    cachedVals.push(this.gradFunc(x, y).val);
                }
            }

            let i = 0;
            for (let x = startX; x <= endX; x += DEBUG_GAP) {
                for (let y = startY; y <= endY; y += DEBUG_GAP) {
                    const col = Math.min(
                        Math.floor((255 * cachedVals[i]) / DEBUG_NORM),
                        255
                    );
                    canvasUtil.drawCircle(
                        { x, y },
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
            const dirGrad = this.gradFunc(prev_x, prev_y);

            if (i === 0 && dirGrad.val < ENABLE_THRESHOLD) {
                // We are not enabled, dont show visual
                return;
            }

            const len = Math.sqrt(
                Math.pow(dirGrad.dx, 2) + Math.pow(dirGrad.dy, 2)
            );
            const dir_x = -(DEBUG_RAY_LEN * dirGrad.dx) / len;
            const dir_y = -(DEBUG_RAY_LEN * dirGrad.dy) / len;

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
