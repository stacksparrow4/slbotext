import canvasUtil from "../canvasUtil.js";
import pathfindingUtil from "../pathfindingUtil.js";
import { CELL_SIZE } from "../pathfindingUtil.js";

const pathfindingObjective = {
    name: "PATH FINDING",
    path: [],
    

    getPriority: function () {
        pathfindingUtil.genGrid();
        return 100000;
    },

    getAction: function () {
        let i = this.path.map(pathfindingUtil.posToCell).indexOf(pathfindingUtil.posToCell(window.snake));
        
        //if (pathfindingUtil.posToCell(window.snake) != this.curr_cell) {
        //if (Date.now() - this.time > 1000) {
        if (i == -1) {
            this.path = pathfindingUtil.findPath();
            i = 0;
        }
        for (const pos of this.path) {
            canvasUtil.drawCircle(
                { x: pos.xx, y: pos.yy, radius: CELL_SIZE / 2 },
                `rgba(0, 255, 0, ${1 - this.path.indexOf(pos) / this.path.length})`,
                "red",
                true
            );
        }
        return {
            target_x: this.path[i].xx,
            target_y: this.path[i].yy,
            boost: false,
        };
    },

    

    drawDebug: function () {
        /*for (let x = 0; x < X_DIM; x++) {
              for (let y = 0; y < Y_DIM; y++) {
                // draw square to represent danger of cell
              }
            }*/
        for (const cell of Object.keys(pathfindingUtil.grid)) {
            const pos = pathfindingUtil.cellToPos(cell);
            const colour = 0 + Math.max(0, (255 - 0) * pathfindingUtil.grid[cell]);
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
