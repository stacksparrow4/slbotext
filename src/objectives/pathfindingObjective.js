import canvasUtil from "../canvasUtil.js";
//import { PriorityQueue } from "./other/PriorityQueue";

// consider this.grid cells of size CELL_SIZE x CELL_SIZE
// TODO: CELL_SIZE varies with your turn radius
const CELL_SIZE = 80;

// constants for path search
const NUM_STEPS = 20;
const STEP_SIZE = 160;
const SEARCH_REPS = 5;

// how long each path is valid for (milliseconds)
const PATH_DURATION = 5000; // TODO: 5 seconds feels a bit long?

const pathfindingObjective = {
    name: "PATH FINDING",
    path: [],
    pathTime: 0,
    grid: {},

    getPriority: function () {
        return 100000;
    },

    visibleSize() {
        // TODO
        // return the radius of how far you can see
        return 1200;
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
        return Math.abs(pos.xx - window.snake.xx) < visibleSize() && Math.abs(pos.yy - window.snake.yy) < visibleSize()
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

    findBestPath: function () {


        let bestScore = -Infinity;
        let bestPath = [];
        for (let rep = 0; rep < SEARCH_REPS; ++rep) {
            let currPos = this.snakeToPos(window.snake);
            let currAng = window.snake.ang;

            let currScore = 0;
            let currPath = [currPos];

            for (let i = 0; i < NUM_STEPS; ++i) {
                // update position
                currPos.xx += STEP_SIZE * Math.cos(currAng);
                currPos.yy += STEP_SIZE * Math.sin(currAng);
                // ahhhhh copy by reference is so annoying
                currPath.push({ xx: currPos.xx, yy: currPos.yy });
                
                // check for bad, set currScore to -Infinity
                // check for good, increment score by goodness

                // find next angle
                // |angle diff| bounded by some constant?
                currAng += 0;
            }

            if (currScore > bestScore) {
                bestScore = currScore;
                bestPath = currPath;
            }
        }

        //console.log(bestScore, bestPath);
        return bestPath;
    },

    getAction: function () {
        if (this.pathTime < Date.now() - PATH_DURATION) {
            // time to create a new path
            console.log("NEW PATH!");
            this.pathTime = Date.now()
            this.path = this.findBestPath();
            console.log(this.path);
        }

        for (let i = 1; i < this.path.length; i++) {
            canvasUtil.drawLine(this.path[i-1], this.path[i], "#FFFFFF", 20);
        }
        return {
            target_x: this.path[i].xx,
            target_y: this.path[i].yy,
            boost: false,
        };
    },

    drawDebug: function () {
        for (let i = 1; i < this.path.length; i++) {
            canvasUtil.drawLine(this.path[i-1], this.path[i], "#FFFFFF", 20);
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
                { x: pos.xx, y: pos.yy, radius: CELL_SIZE / 2 },
                //`rgba(255, 255, 255, ${colour/255})`,
                `rgb(${colour}, ${colour}, ${colour}, 0.7)`,
                true
            );
        }
    },
};

export default pathfindingObjective;
