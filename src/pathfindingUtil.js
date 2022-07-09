import { PriorityQueue } from "./other/PriorityQueue";

// consider this.grid cells of size CELL_SIZE x CELL_SIZE
// TODO: CELL_SIZE varies with your turn radius
export const CELL_SIZE = 80;


function visibleSize() {
    // TODO
    // return the radius of how far you can see
    return 1200;
}

const pathfindingUtil = {
    grid: {},

    snakeToPos: function(snake) {
        return {
            xx: Math.round(snake.xx / CELL_SIZE) * CELL_SIZE,
            yy: Math.round(snake.yy / CELL_SIZE) * CELL_SIZE
        };
    },

    posToCell: function(point) {
        return (
            (Math.round(point.xx / CELL_SIZE) * CELL_SIZE).toString() +
            " " +
            (Math.round(point.yy / CELL_SIZE) * CELL_SIZE).toString()
        );
    },

    cellToPos: function(cell) {
        cell = cell.split(" ");
        return {
            xx: parseInt(cell[0]),
            yy: parseInt(cell[1]),
        };
    },

    inBounds: function(pos) {
        return Math.abs(pos.xx - window.snake.xx) < visibleSize() && Math.abs(pos.yy - window.snake.yy) < visibleSize()
    },

    addIndication: function(point, score) {
        if (this.inBounds(point)) {
            const cell = this.posToCell(point);
            this.grid[cell] = (this.grid[cell] || 0) + score;
        }
    },

    genGrid: function() {
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

    findPath: function() {
        const SEARCH_DEPTH = 20;
        const SEARCH_REPS = 1000;
        
        let bestScore = -Infinity;
        let bestPath = [];
        for (let rep = 0; rep < SEARCH_REPS; ++rep) {
            let currScore = 0;
            let currPath = [];
            let currPos = this.snakeToPos(window.snake);
            currPos.xx += CELL_SIZE;

            const seen = new Set();

            // TODO: restriction on turning angle (especially for the first step)
            // TODO: no commitment to the current path, since randomness / many paths with similar rating
            for (let i = SEARCH_DEPTH; i > 0; i--) {
                // most immediate food is weighted highest
                currScore += (this.grid[this.posToCell(currPos)] || 0) * Math.exp(i / SEARCH_DEPTH);
                currPath.push(currPos);
                seen.add(this.posToCell(currPos));

                const newPoss = [[0, 1], [1, 0], [0, -1], [-1, 0]]
                    .map(dir => ({ xx: currPos.xx + dir[0] * CELL_SIZE, yy: currPos.yy + dir[1] * CELL_SIZE }))
                    .filter(newPos => !seen.has(this.posToCell(newPos)));
                if (newPoss.length == 0) {
                    break;
                }
                currPos = newPoss[Math.floor(Math.random() * newPoss.length)];
            }

            if (currScore > bestScore) {
                bestScore = currScore;
                bestPath = currPath;
            }
        }

        //console.log(bestScore, bestPath);
        return bestPath;
    }

    // ignore me i did a stupid
    /*findPath: function() {
        const backtrack = {};
        const score = {};
        const pq = new PriorityQueue((cellA, cellB) => score[cellA] > score[cellB]);
        const startCell = this.posToCell(window.snake);
        backtrack[startCell] = null;
        score[startCell] = this.grid[startCell] || 0;
        pq.push(startCell);

        let bestCell = startCell;
        
        while (!pq.isEmpty()) {
            const currCell = pq.pop();
            const currPos = this.cellToPos(currCell);
            for (const dir of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
                const newPos = { xx: currPos.xx + dir[0], yy: currPos.yy + dir[1] };
                if (!this.inBounds(newPos)) continue;

                const newCell = this.posToCell(newPos);
                const newScore = (this.grid[newCell] || 0) + this.grid[currCell];
                if (newScore > (score[newCell] || 0)) {
                    backtrack[newCell] = currCell;
                    score[newCell] = newScore;
                    pq.push(newCell);

                    if (newScore > score[bestCell]) {
                        bestCell = newCell;
                    }
                }
            }
        }
        console.log(score);

        const output = [];
        do {
            output.push(this.cellToPos(bestCell));
            bestCell = backtrack[bestCell];
        } while (bestCell);
        return output;
    }*/
};

export default pathfindingUtil;

