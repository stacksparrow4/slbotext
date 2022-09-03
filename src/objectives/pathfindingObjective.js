import canvasUtil from "../canvasUtil.js";
//import { PriorityQueue } from "./other/PriorityQueue";
import bot from "../bot.js";
import { getSnakes, distanceBetween2 } from "./util.js";

//const isLong = false;
const isLong = true;

// consider this.grid cells of size CELL_SIZE x CELL_SIZE
// TODO: CELL_SIZE varies with your turn radius
const CELL_SIZE = 50;

// constants for path search
const PATH_SIZE = isLong ? 20 : 6;
const SEARCH_REPS = isLong ? 200 : 10;

// how long each path is valid for (milliseconds)
const PATH_DURATION = isLong ? 2000 : 1200;

const MAX_ROTATION = 52 * Math.PI / 180;

// in pixels per millisecond
const BASE_SPEED = 0.185;
const BOOST_SPEED = 0.448;

const pathfindingObjective = {
    name: "PATH FINDING",
    path: [],
    stepSize: 0,
    pathTime: 0,
    grid: [],

    getPriority: function () {
        //return 0.8;
        return 10000;
    },

    visibleSize() {
        // TODO
        // return the radius of how far you can see
        return 800;
    },

    posToRegion: function (pos) {
        return {
            xx: Math.floor(pos.xx / CELL_SIZE) * CELL_SIZE,
            yy: Math.floor(pos.yy / CELL_SIZE) * CELL_SIZE
        };
    },

    inBounds: function (pos) {
        return Math.abs(pos.xx - window.snake.xx) < this.visibleSize() && Math.abs(pos.yy - window.snake.yy) < this.visibleSize()
    },

    addIndication: function (pos, score) {
        if (this.inBounds(pos)) {
            const regionxx = this.posToRegion(pos).xx;
            const regionyy = this.posToRegion(pos).yy;
            this.grid[regionxx] = this.grid[regionxx] || [];
            this.grid[regionxx][regionyy] = this.grid[regionxx][regionyy] || [];
            this.grid[regionxx][regionyy].push({ xx: pos.xx, yy: pos.yy, score: score });
        }
    },

    getIndication: function (pos, dist) {
        // return sum of scores within a distance of "dist" from "pos"
        let total = 0;
        const regionxx = this.posToRegion(pos).xx;
        const regionyy = this.posToRegion(pos).yy;
        if (this.grid[regionxx] && this.grid[regionxx][regionyy]) {
            for (const indication of this.grid[regionxx][regionyy]) {
                if (distanceBetween2(indication, pos) <= dist * dist) {
                    total += indication.score;
                }
            }
        }
        return total;
    },

    genGrid: function () {
        this.grid = [];
        const snakes = getSnakes();
        for (const snake of snakes) {
            // you are neutral about crossing yourself
            // if (window.snake.id === snake.id) continue;

            for (const { xx, yy } of snake.segments) {
                this.addIndication({ xx, yy }, -Infinity);
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
        // TODO: apply path smoothing so that paths have better intention
        // this can be implemented by weighting each point by neighbouring points
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
            currAng += (Math.random() - 0.5) * 2 * MAX_ROTATION;
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
            currScore += Math.sqrt(PATH_SIZE - i) * this.getIndication(currPos, 100);
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

        console.log(bestScore);

        if (forceChange || bestScore > originalScore + 2) {
            if (forceChange) console.log("forced change");
            else console.log("unforced change");

            this.path = bestPath;
            this.pathTime = Date.now();
            this.stepSize = STEP_SIZE;
        }
    },

    // look at this.path and determine next target point
    findCurrI: function () {
        // TODO determine closest point and return next point
        //return Math.ceil(BASE_SPEED * (Date.now() - this.pathTime) / this.stepSize);
        let bestI = 0;
        for (let i = 1; i < this.path.length; i++) {
            if (distanceBetween2(window.snake, this.path[i]) < distanceBetween2(window.snake, this.path[bestI])) {
                bestI = i;
            }
        }
        return bestI + 2;
    },

    getAction: function () {
        let currI = this.findCurrI();
        if (this.pathTime < Date.now() - PATH_DURATION || currI >= PATH_SIZE) {
            this.genGrid();
            this.findBestPath(currI >= PATH_SIZE);
            currI = this.findCurrI();
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

        /*for (let xx = 0; xx < X_DIM; xx++) {
              for (let yy = 0; yy < Y_DIM; yy++) {
                // draw square to represent danger of cell
              }
            }*/
        // for (const cell of Object.keys(this.grid)) {
        //     const pos = this.cellToPos(cell);
        //     const colour = 0 + Math.max(0, (255 - 0) * this.grid[cell]);
        //     canvasUtil.drawCircle(
        //         { xx: pos.xx, yy: pos.yy, radius: CELL_SIZE / 2 },
        //         //`rgba(255, 255, 255, ${colour/255})`,
        //         `rgb(${colour}, ${colour}, ${colour}, 0.7)`,
        //         true
        //     );
        // }
    },
};

export default pathfindingObjective;
