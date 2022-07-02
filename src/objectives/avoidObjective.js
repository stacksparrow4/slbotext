import bot from "../bot.js";
import canvasUtil from "../canvasUtil.js";

// Helper function to get info about other snakes.
// Mainly just cleaning up the mess that is the snakes array
const getSnakes = () => {
    const alive_snakes = window.snakes.filter(
        (s) => s.alive_amt === 1 && s.id !== window.snake.id
    );

    return alive_snakes.map((s) => ({
        // Head is at s.xx, s.yy
        x: s.xx,
        y: s.yy,
        radius: bot.getSnakeWidth(s.sc) / 2,
        segments: s.pts
            .filter(
                (p) =>
                    !p.dying &&
                    canvasUtil.pointInRect(
                        {
                            x: p.xx,
                            y: p.yy,
                        },
                        bot.sectorBox
                    )
            )
            .map((p) => ({ x: p.xx, y: p.yy })),
    }));
};

const HEAD_DISTANCE_FACTOR = 30000;
const BODY_DISTANCE_FACTOR = 3000;
const DEBUG_GAP = 50;
const DEBUG_RAD = DEBUG_GAP * 10;
const DEBUG_NORM = 1;

const getEvaluationFunction = () => {
    const snakes = getSnakes();

    return (x, y) => {
        return snakes
            .map((s) => {
                const distance_from_head =
                    Math.pow(s.x - x, 2) + Math.pow(s.y - y, 2);
                const head_value = Math.exp(
                    -distance_from_head / HEAD_DISTANCE_FACTOR
                );
                const body_value = s.segments
                    .map((seg) => {
                        const distance_from_seg =
                            Math.pow(seg.x - x, 2) + Math.pow(seg.y - y, 2);
                        return Math.exp(
                            -distance_from_seg / BODY_DISTANCE_FACTOR
                        );
                    })
                    .reduce((a, b) => a + b, 0);
                return head_value + body_value;
            })
            .reduce((a, b) => a + b, 0);
    };
};

const avoidObjective = {
    getAction: () => {
        return { target_x: 20000, target_y: 20000, boost: false };
    },

    getPriority: () => {
        return 1;
    },

    drawDebug: () => {
        const evalFunction = getEvaluationFunction();

        const startX = window.snake.xx - DEBUG_RAD;
        const endX = window.snake.xx + DEBUG_RAD;
        const startY = window.snake.yy - DEBUG_RAD;
        const endY = window.snake.yy + DEBUG_RAD;

        const cachedVals = [];
        for (let x = startX; x <= endX; x += DEBUG_GAP) {
            for (let y = startY; y <= endY; y += DEBUG_GAP) {
                cachedVals.push(evalFunction(x, y));
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
    },
};

export default avoidObjective;
