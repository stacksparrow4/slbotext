import canvasUtil from "../canvasUtil.js";
import { getSnakes } from "./util.js";

const anticircleObjective = {
    name: "ANTICIRCLE",

    snakes: [],

    circlingSnake: null,

    tick: function () {
        this.snakes = getSnakes();

        this.circlingSnake = null;

        this.snakes
            .filter((s) => s.segments.length)
            .forEach((s) => {
                let vhx = s.x - window.snake.xx;
                let vhy = s.y - window.snake.yy;
                const vhm = Math.hypot(vhx, vhy);
                vhx /= vhm;
                vhy /= vhm;

                let vtx = s.segments[0].x - window.snake.xx;
                let vty = s.segments[0].y - window.snake.yy;
                const vtm = Math.hypot(vtx, vty);
                vtx /= vtm;
                vty /= vtm;

                const vmx =
                    s.segments[Math.floor(s.segments.length / 2)].x -
                    window.snake.xx;
                const vmy =
                    s.segments[Math.floor(s.segments.length / 2)].y -
                    window.snake.yy;

                const vex = vhx + vtx;
                const vey = vhy + vty;

                // calculate dot product
                const dp = vmx * vex + vmy * vey;

                if (dp < 0) {
                    this.circlingSnake = s;
                }
            });
    },

    getAction: function () {
        return {
            target_x: this.circlingSnake.segments[0].x,
            target_y: this.circlingSnake.segments[0].y,
            boost: true,
        };
    },

    getPriority: function () {
        if (this.circlingSnake) {
            return 5;
        }

        return -1;
    },

    drawDebug: function () {
        if (!this.circlingSnake) return;

        const p_start = canvasUtil.point(
            this.circlingSnake.x,
            this.circlingSnake.y
        );
        const p_end = canvasUtil.point(
            this.circlingSnake.segments[0].x,
            this.circlingSnake.segments[0].y
        );
        const p2 = canvasUtil.point(window.snake.xx, window.snake.yy);

        canvasUtil.drawLine(p_start, p2, "#555", 5);
        canvasUtil.drawLine(p_end, p2, "#555", 5);
    },
};

export default anticircleObjective;
