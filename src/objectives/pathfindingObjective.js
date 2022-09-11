import canvasUtil from "../canvasUtil.js";
//import { PriorityQueue } from "./other/PriorityQueue";
import bot from "../bot.js";
import { getSnakes, distanceBetween2 } from "./util.js";

//const isLong = false;
const isLong = true;

// consider this.grid cells of size CELL_SIZE x CELL_SIZE
// TODO: CELL_SIZE varies with your turn radius
const CELL_SIZE = 50;
const COLLISION_RADIUS = 70;

// constants for path search
const PATH_SIZE = isLong ? 20 : 6;
const SEARCH_REPS = isLong ? 300 : 10;

// how long each path is valid for (milliseconds)
const PATH_DURATION = isLong ? 2000 : 1200;
const GRID_DURATION = 100;

const MAX_ROTATION = (52 * Math.PI) / 180;

// in pixels per millisecond
const BASE_SPEED = 0.185;
const BOOST_SPEED = 0.448;

function clamp(x, a, b) {
    return x > b ? b : x < a ? a : x;
}

const pathfindingObjective = {
    name: "PATH FINDING",
    path: [],
    stepSize: 0,
    pathTime: 0,
    nextGridUpdate: 0,
    grid: [],

    getPriority: function () {
        //return 0.7;
        //return 10000;
        return -1000; // just for the sake of testing other stuff
    },

    visibleSize() {
        // TODO
        // return the radius of how far you can see
        return 800;
    },

    posToRegion: function (pos) {
        return {
            xx: Math.floor(pos.xx / CELL_SIZE) * CELL_SIZE,
            yy: Math.floor(pos.yy / CELL_SIZE) * CELL_SIZE,
        };
    },

    inBounds: function (pos) {
        return (
            Math.abs(pos.xx - window.snake.xx) < this.visibleSize() &&
            Math.abs(pos.yy - window.snake.yy) < this.visibleSize()
        );
    },

    addIndication: function (pos, score) {
        // grid partitioning for fast lookups
        // (i know this is an optimisation, but its necessary because finding the score of a path requires you to know indication of nearby positions)
        if (this.inBounds(pos)) {
            const regionxx = this.posToRegion(pos).xx;
            const regionyy = this.posToRegion(pos).yy;
            this.grid[regionxx] = this.grid[regionxx] || [];
            this.grid[regionxx][regionyy] = this.grid[regionxx][regionyy] || [];
            this.grid[regionxx][regionyy].push({
                xx: pos.xx,
                yy: pos.yy,
                score: score,
            });
        }
    },

    getIndication: function (pos, dist) {
        // return sum of scores within a distance of "dist" from "pos"
        let total = 0;
        const regionxx = this.posToRegion(pos).xx;
        const regionyy = this.posToRegion(pos).yy;
        if (this.grid[regionxx] && this.grid[regionxx][regionyy]) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;

                    const currxx = regionxx + CELL_SIZE * dx;
                    const curryy = regionyy + CELL_SIZE * dy;

                    if (!this.grid[currxx] || !this.grid[currxx][curryy])
                        continue;

                    for (const indication of this.grid[currxx][curryy]) {
                        if (distanceBetween2(indication, pos) <= dist * dist) {
                            total += indication.score;
                        }
                    }
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
            // generate new angle
            // float in range [-rotation, rotation]
            currAng += (Math.random() - 0.5) * 2 * MAX_ROTATION;

            // update position
            currPos.xx += stepSize * Math.cos(currAng);
            currPos.yy += stepSize * Math.sin(currAng);
            // ahhhhh copy by reference is so annoying
            currPath.push({ xx: currPos.xx, yy: currPos.yy });
        }
        return currPath;
    },

    findScore(path) {
        if (path.length === 0) {
            return -Infinity;
        }

        let currScore = 0;
        for (let i = 0; i < path.length; ++i) {
            const currPos = path[i];
            // check for bad, set currScore to -Infinity
            // check for good, increment score by goodness
            currScore +=
                Math.sqrt(PATH_SIZE - i) *
                this.getIndication(currPos, COLLISION_RADIUS);
        }
        return currScore;
    },

    findNewPath: function (forceChange) {
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
            this.stepSize = STEP_SIZE;
        }

        this.pathTime = Date.now() + PATH_DURATION;
    },

    // Try and modify path to make it better
    correctPath: function () {
        for (let i = 3; i < this.path.length; i++) {
            const { yy: curryy, xx: currxx } = this.path[i];
            const { yy: prevyy, xx: prevxx } = this.path[i - 1];
            const { yy: prevPrevyy, xx: prevPrevxx } = this.path[i - 2];
            const currAng = Math.atan2(curryy - prevyy, currxx - prevxx);
            const prevAng = Math.atan2(
                prevyy - prevPrevyy,
                prevxx - prevPrevxx
            );

            let bestScore = this.findScore(this.path.slice(0, i + 1));
            let bestPoint = {
                xx: currxx,
                yy: curryy,
            };
            for (
                let dAng = -Math.PI / 10;
                dAng <= Math.PI / 10;
                dAng += Math.PI / 48
            ) {
                const newAng = clamp(
                    currAng + dAng,
                    prevAng - MAX_ROTATION,
                    prevAng + MAX_ROTATION
                );
                const newPathPoint = {
                    xx: prevxx + this.stepSize * Math.cos(newAng),
                    yy: prevyy + this.stepSize * Math.sin(newAng),
                };

                const newPathScore = this.findScore([
                    ...this.path.slice(0, i),
                    newPathPoint,
                ]);

                if (newPathScore > bestScore) {
                    bestScore = newPathScore;
                    bestPoint = newPathPoint;
                }
            }

            if (bestScore < 0) {
                const prevPath = this.path;
                for (let attempt = 0; attempt < 20; attempt++) {
                    this.findNewPath(true);
                    if (this.path.length !== 0) return;
                }
                console.log("WE'RE DOOMED 💀💀💀");
                this.path = prevPath;
                return;
            }

            this.path[i] = bestPoint;
        }
    },

    appendPath: function () {
        while (this.path.length < PATH_SIZE) {
            const last = this.path[this.path.length - 1];
            const secondLast = this.path[this.path.length - 2];
            const ang = Math.atan2(
                last.yy - secondLast.yy,
                last.xx - secondLast.xx
            );

            let bestPoint = {
                xx: last.xx + this.stepSize * Math.cos(ang),
                yy: last.yy + this.stepSize * Math.sin(ang),
            };
            let bestScore = this.findScore([...this.path, bestPoint]);
            for (
                let testAng = ang - MAX_ROTATION;
                testAng <= ang + MAX_ROTATION;
                testAng += MAX_ROTATION / 4
            ) {
                const newPathPoint = {
                    xx: last.xx + this.stepSize * Math.cos(testAng),
                    yy: last.yy + this.stepSize * Math.sin(testAng),
                };

                const newPathScore = this.findScore([
                    ...this.path,
                    newPathPoint,
                ]);

                if (newPathScore > bestScore) {
                    bestScore = newPathScore;
                    bestPoint = newPathPoint;
                }
            }

            this.path.push(bestPoint);
        }
    },

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
        // Update grid periodically
        if (Date.now() > this.nextGridUpdate) {
            this.nextGridUpdate = Date.now() + GRID_DURATION;
            this.genGrid();
        }

        let currI = this.findCurrI();

        if (
            this.path.length === 0 ||
            currI >= this.path.length ||
            Date.now() > this.pathTime
        ) {
            this.findNewPath();
        }

        this.correctPath();
        this.appendPath();

        currI = this.findCurrI();

        // Prune start of path
        while (currI > 3) {
            this.path.splice(0, 1);
            currI--;
        }

        if (currI < 0 || currI >= this.path.length) debugger;

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
