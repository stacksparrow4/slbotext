import bot from "../bot.js";
import canvasUtil from "../canvasUtil.js";
// get the most accessible safe food

let cacheFoods = [];

const filterFoods = (foods) => {
    return foods.filter((food) => {
        return food != undefined;
    });
};

const filterSafeFoods = (foods) => {
    if (window.snake == undefined) return [];
    return foods.filter((food) => {
        return (
            window.snakes.reduce((best, next) => {
                if (next == undefined) return best;
                else
                    return Math.hypot(best.xx - food.xx, best.yy - food.yy) <
                        Math.hypot(next.xx - food.xx, best.yy - food.yy)
                        ? best
                        : next;
            }, window.snake) == window.snake
        );
    });
};

const INCIRCLE_COST = 1000000;
const foodCompare = (food) => {
    return (
        (Math.pow(food.xx - window.snake.xx, 2) +
            Math.pow(food.yy - window.snake.yy, 2) +
            INCIRCLE_COST *
                canvasUtil.circleIntersect(
                    bot.sidecircle_r,
                    canvasUtil.circle(food.xx, food.yy, 2)
                ) +
            INCIRCLE_COST *
                canvasUtil.circleIntersect(
                    bot.sidecircle_l,
                    canvasUtil.circle(food.xx, food.yy, 2)
                )) /
        food.sz
    );
};

const getNearestFood = (foods) => {
    if (foods.length == 0) return undefined;

    return foods.reduce((best, next) => {
        return foodCompare(best) < foodCompare(next) ? best : next;
    }, foods[0]);
};

const foodObjective = {
    name: "FOOD",

    getAction: () => {
        let result = getNearestFood(cacheFoods);
        return {
            target_x: result.xx,
            target_y: result.yy,
            boost: false,
        };
    },

    getPriority: (bot) => {
        cacheFoods = filterFoods(window.foods);
        return cacheFoods.length > 0 ? 0.5 : -100;
    },

    drawDebug: () => {
        if (cacheFoods.length == 0) return;
        let result = getNearestFood(cacheFoods);
        canvasUtil.drawCircle(
            canvasUtil.circle(result.xx, result.yy, 10),
            "#00FF00",
            true,
            1
        );
        canvasUtil.drawCircle(bot.sidecircle_l, "#FF0000", false, 1);
        canvasUtil.drawCircle(bot.sidecircle_r, "#FF0000", false, 1);
        return;
    },
};

export default foodObjective;
