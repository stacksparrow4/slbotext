import canvasUtil from "../canvasUtil.js";
//import { PriorityQueue } from "./other/PriorityQueue";
import bot from "../bot.js";

const isLong = false;

// consider this.grid cells of size CELL_SIZE x CELL_SIZE
// TODO: CELL_SIZE varies with your turn radius
const CELL_SIZE = 50;

// constants for path search
const PATH_SIZE = isLong ? 20 : 6;
const SEARCH_REPS = isLong ? 200: 20;

// how long each path is valid for (milliseconds)
const PATH_DURATION = isLong ? 2000: 600;

 const MAX_ROTATION = 52 * Math.PI / 180;

// in pixels per millisecond
const BASE_SPEED = 0.185;
const BOOST_SPEED = 0.448;

const pathfindingObjective = {
    name: "PATH FINDING",
    path: [],
    stepSize: 0,
    pathTime: 0,
    grid: {},

    getPriority: function () {
        return 0.8;
    },

    visibleSize() {
        // TODO
        // return the radius of how far you can see
        return 800;
    },

    snakeToPos: function (snake) {
        return {
            xx: Math.round(snake.xx / CELL_SIZE) * CELL_SIZE,
            yy: Math.round(snake.yy / CELL_SIZE) * CELL_SIZE
        };
    },

    posToCell: function (point) {
        return (
            (Math.round(point.xx / CELL_SIZE) * CELL_SIZE).toString() +
            " " +
            (Math.round(point.yy / CELL_SIZE) * CELL_SIZE).toString()
        );
    },

    cellToPos: function (cell) {
        cell = cell.split(" ");
        return {
            xx: parseInt(cell[0]),
            yy: parseInt(cell[1]),
        };
    },

    inBounds: function (pos) {
        return Math.abs(pos.xx - window.snake.xx) < this.visibleSize() && Math.abs(pos.yy - window.snake.yy) < this.visibleSize()
    },

    addIndication: function (point, score) {
        if (this.inBounds(point)) {
            const cell = this.posToCell(point);
            this.grid[cell] = (this.grid[cell] || 0) + score;
        }
    },

    genGrid: function () {
        this.grid = {};
        for (const snake of window.snakes) {
            // you are neutral about crossing yourself
            if (window.snake.id === snake.id) continue;

            for (const i in snake.pts) {
                if (!snake.pts[i].dying) {
                    this.addIndication(snake.pts[i], -Infinity);
                }
            }
        }

        for (const food of window.foods) {
            if (food && !food.eaten_fr) {
                this.addIndication(food, food.rsp);
            }
        }

        for (const prey of window.preys) {
            if (!prey.eaten) {
                // im assuming that powerups give you 10 points
                this.addIndication(prey, 10);
            }
        }
    },

    genPath(stepSize) {
        let currPos = { xx: window.snake.xx, yy: window.snake.yy };
        let currAng = window.snake.ang;

        let currPath = [{ xx: currPos.xx, yy: currPos.yy }];

        for (let i = 0; i < PATH_SIZE; ++i) {
            // update position
            currPos.xx += stepSize * Math.cos(currAng);
            currPos.yy += stepSize * Math.sin(currAng);
            // ahhhhh copy by reference is so annoying
            currPath.push({ xx: currPos.xx, yy: currPos.yy });

            // generate new angle
            // float in range [-rotation, rotation]
            currAng += (Math.random() - 0.5) * MAX_ROTATION * 2;
        }
        return currPath;
    },

    findScore(path) {
        if (path.length === 0) {
            return -Infinity;
        }

        let currScore = 0;
        for (let i = 0; i < PATH_SIZE; ++i) {
            const currPos = path[i];
            // check for bad, set currScore to -Infinity
            // check for good, increment score by goodness
            const posScore = this.grid[this.posToCell(this.snakeToPos(currPos))] || 0;
            currScore += (PATH_SIZE - i) * posScore;
        }
        return currScore;
    },

    findBestPath: function (forceChange) {
        // derived from bot.sidecircle_r
        const TURNING_RADIUS = bot.snakeWidth * bot.speedMult;
        const STEP_SIZE = 2 * TURNING_RADIUS;

        const originalPath = [...this.path];
        const originalScore = this.findScore(originalPath);

        let bestScore = -Infinity;
        let bestPath = [];
        for (let rep = 0; rep < SEARCH_REPS; ++rep) {
            const currPath = this.genPath(STEP_SIZE);
            const currScore = this.findScore(currPath);

            if (currScore > bestScore) {
                bestScore = currScore;
                bestPath = currPath;
            }
        }

        if (forceChange || bestScore > originalScore + 2) {
            this.path = bestPath;
            this.pathTime = Date.now();
            this.stepSize = STEP_SIZE;
        }
    },

    getAction: function () {
        let currI = Math.ceil(BASE_SPEED * (Date.now() - this.pathTime) / this.stepSize);
        if (this.pathTime < Date.now() - PATH_DURATION || currI >= PATH_SIZE) {

            this.genGrid();
            this.findBestPath(currI >= PATH_SIZE);
            currI = Math.ceil(BASE_SPEED * (Date.now() - this.pathTime) / this.stepSize);
        }

        for (let i = 1; i < this.path.length; i++) {
            canvasUtil.drawLine(this.path[i - 1], this.path[i]);
        }

        // find currI - the next point to aim for along the path
        return {
            target_x: this.path[currI].xx,
            target_y: this.path[currI].yy,
            boost: false,
        };
    },

    drawDebug: function () {
        for (let i = 1; i < this.path.length; i++) {
            canvasUtil.drawLine(this.path[i - 1], this.path[i]);
        }

        /*for (let x = 0; x < X_DIM; x++) {
              for (let y = 0; y < Y_DIM; y++) {
                // draw square to represent danger of cell
              }
            }*/
        for (const cell of Object.keys(this.grid)) {
            const pos = this.cellToPos(cell);
            const colour = 0 + Math.max(0, (255 - 0) * this.grid[cell]);
            canvasUtil.drawCircle(
                { xx: pos.xx, yy: pos.yy, radius: CELL_SIZE / 2 },
                //`rgba(255, 255, 255, ${colour/255})`,
                `rgb(${colour}, ${colour}, ${colour}, 0.7)`,
                true
            );
        }
    },
};

export default pathfindingObjective;
