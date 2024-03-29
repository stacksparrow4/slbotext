import canvasUtil from "./canvasUtil";
import avoidObjective from "./objectives/avoidObjective";
import centerObjective from "./objectives/centerObjective";
import oldObjective from "./objectives/oldObjective";
import foodObjective from "./objectives/foodObjective";
import pathfindingObjective from "./objectives/pathfindingObjective";
import endgameObjective from "./objectives/endgameObjective";

const objectives = [
    avoidObjective,
    centerObjective,
    oldObjective,
    foodObjective,
    pathfindingObjective,
    endgameObjective,
];

const bot = {
    isBotRunning: false,
    isBotEnabled: true,
    lookForFood: false,
    collisionPoints: [],
    collisionAngles: [],
    scores: [],
    foodTimeout: undefined,
    sectorBoxSide: 0,
    defaultAccel: 0,
    sectorBox: {},
    currentFood: {},
    currentObjectiveName: "",
    opt: {
        // These are the bot's default options
        // If you wish to customise these, use
        // customBotOptions
        targetFps: 30,
        arcSize: Math.PI / 8,
        radiusMult: 10,
        foodAccelSize: 60,
        foodAccelAngle: Math.PI / 3,
        foodFrames: 4,
        foodRoundSize: 5,
        foodRoundAngle: Math.PI / 8,
        foodSmallSize: 10,
        rearHeadAngle: (3 * Math.PI) / 4,
        rearHeadDir: Math.PI / 2,
        radiusApproachSize: 5,
        radiusAvoidSize: 25,
    },
    MID_X: 0,
    MID_Y: 0,
    MAP_R: 0,

    getSnakeWidth: function (sc) {
        if (sc === undefined) sc = window.snake.sc;
        return Math.round(sc * 29.0);
    },

    quickRespawn: function () {
        window.dead_mtm = 0;
        window.login_fr = 0;

        bot.isBotRunning = false;
        window.forcing = true;
        window.connect();
        window.forcing = false;
    },

    // angleBetween - get the smallest angle between two angles (0-pi)
    angleBetween: function (a1, a2) {
        var r1 = 0.0;
        var r2 = 0.0;

        r1 = (a1 - a2) % Math.PI;
        r2 = (a2 - a1) % Math.PI;

        return r1 < r2 ? -r1 : r2;
    },

    // Avoid headPoint
    avoidHeadPoint: function (collisionPoint) {
        var cehang = canvasUtil.fastAtan2(
            collisionPoint.yy - window.snake.yy,
            collisionPoint.xx - window.snake.xx
        );
        var diff = bot.angleBetween(window.snake.ehang, cehang);

        if (Math.abs(diff) > bot.opt.rearHeadAngle) {
            var dir = diff > 0 ? -bot.opt.rearHeadDir : bot.opt.rearHeadDir;
            bot.changeHeading(dir);
        } else {
            bot.avoidCollisionPoint(collisionPoint);
        }
    },

    // Change heading by ang
    // +0-pi turn left
    // -0-pi turn right

    changeHeading: function (angle) {
        var cos = Math.cos(-angle);
        var sin = Math.sin(-angle);

        window.goalCoordinates = {
            xx: Math.round(window.snake.xx + 500 * (cos * bot.cos - sin * bot.sin)),
            yy: Math.round(window.snake.yy + 500 * (sin * bot.cos - cos * bot.sin)),
        };

        canvasUtil.setMouseCoordinates(
            canvasUtil.mapToMouse(window.goalCoordinates)
        );
    },

    // Avoid collision point by ang
    // ang radians <= Math.PI (180deg)
    avoidCollisionPoint: function (collisionPoint, ang) {
        if (ang === undefined || ang > Math.PI) {
            ang = Math.PI;
        }

        var end = {
            xx: window.snake.xx + 2000 * bot.cos,
            yy: window.snake.yy + 2000 * bot.sin,
        };

        if (window.visualDebugging) {
            canvasUtil.drawLine(
                {
                    xx: window.snake.xx,
                    yy: window.snake.yy,
                },
                end,
                "orange",
                5
            );
            canvasUtil.drawLine(
                {
                    xx: window.snake.xx,
                    yy: window.snake.yy,
                },
                {
                    xx: collisionPoint.xx,
                    yy: collisionPoint.yy,
                },
                "red",
                5
            );
        }

        var cos = Math.cos(ang);
        var sin = Math.sin(ang);

        if (
            canvasUtil.isLeft(
                {
                    xx: window.snake.xx,
                    yy: window.snake.yy,
                },
                end,
                {
                    xx: collisionPoint.xx,
                    yy: collisionPoint.yy,
                }
            )
        ) {
            sin = -sin;
        }

        window.goalCoordinates = {
            xx: Math.round(
                cos * (collisionPoint.xx - window.snake.xx) -
                sin * (collisionPoint.yy - window.snake.yy) +
                window.snake.xx
            ),
            yy: Math.round(
                sin * (collisionPoint.xx - window.snake.xx) +
                cos * (collisionPoint.yy - window.snake.yy) +
                window.snake.yy
            ),
        };

        canvasUtil.setMouseCoordinates(
            canvasUtil.mapToMouse(window.goalCoordinates)
        );
    },

    // Sorting by  property 'distance'
    sortDistance: function (a, b) {
        return a.distance - b.distance;
    },

    // get collision angle index, expects angle +/i 0 to Math.PI
    getAngleIndex: function (angle) {
        const ARCSIZE = bot.opt.arcSize;
        var index;

        if (angle < 0) {
            angle += 2 * Math.PI;
        }

        index = Math.round(angle * (1 / ARCSIZE));

        if (index === (2 * Math.PI) / ARCSIZE) {
            return 0;
        }
        return index;
    },

    // Add to collisionAngles if distance is closer
    addCollisionAngle: function (sp) {
        var ang = canvasUtil.fastAtan2(
            Math.round(sp.yy - window.snake.yy),
            Math.round(sp.xx - window.snake.xx)
        );
        var aIndex = bot.getAngleIndex(ang);

        var actualDistance = Math.round(
            Math.pow(Math.sqrt(sp.distance) - sp.radius, 2)
        );

        if (bot.collisionAngles[aIndex] === undefined) {
            bot.collisionAngles[aIndex] = {
                xx: Math.round(sp.xx),
                yy: Math.round(sp.yy),
                ang: ang,
                snake: sp.snake,
                distance: actualDistance,
            };
        } else if (bot.collisionAngles[aIndex].distance > sp.distance) {
            bot.collisionAngles[aIndex].xx = Math.round(sp.xx);
            bot.collisionAngles[aIndex].yy = Math.round(sp.yy);
            bot.collisionAngles[aIndex].ang = ang;
            bot.collisionAngles[aIndex].snake = sp.snake;
            bot.collisionAngles[aIndex].distance = actualDistance;
        }
    },

    // Get closest collision point per snake.
    getCollisionPoints: function () {
        var scPoint;

        bot.collisionPoints = [];
        bot.collisionAngles = [];

        for (var snake = 0, ls = window.snakes.length; snake < ls; snake++) {
            scPoint = undefined;

            if (
                window.snakes[snake].id !== window.snake.id &&
                window.snakes[snake].alive_amt === 1
            ) {
                scPoint = {
                    xx: window.snakes[snake].xx,
                    yy: window.snakes[snake].yy,
                    snake: snake,
                    radius: bot.getSnakeWidth(window.snakes[snake].sc) / 2,
                };
                canvasUtil.getDistance2FromSnake(scPoint);
                bot.addCollisionAngle(scPoint);
                if (window.visualDebugging) {
                    canvasUtil.drawCircle(
                        canvasUtil.circle(
                            scPoint.xx,
                            scPoint.yy,
                            scPoint.radius
                        ),
                        "red",
                        false
                    );
                }

                for (
                    var pts = 0, lp = window.snakes[snake].pts.length;
                    pts < lp;
                    pts++
                ) {
                    if (
                        !window.snakes[snake].pts[pts].dying &&
                        canvasUtil.pointInRect(
                            {
                                xx: window.snakes[snake].pts[pts].xx,
                                yy: window.snakes[snake].pts[pts].yy,
                            },
                            bot.sectorBox
                        )
                    ) {
                        var collisionPoint = {
                            xx: window.snakes[snake].pts[pts].xx,
                            yy: window.snakes[snake].pts[pts].yy,
                            snake: snake,
                            radius:
                                bot.getSnakeWidth(window.snakes[snake].sc) / 2,
                        };

                        if (window.visualDebugging && true === false) {
                            canvasUtil.drawCircle(
                                canvasUtil.circle(
                                    collisionPoint.xx,
                                    collisionPoint.yy,
                                    collisionPoint.radius
                                ),
                                "#00FF00",
                                false
                            );
                        }

                        canvasUtil.getDistance2FromSnake(collisionPoint);
                        bot.addCollisionAngle(collisionPoint);

                        if (
                            scPoint === undefined ||
                            scPoint.distance > collisionPoint.distance
                        ) {
                            scPoint = collisionPoint;
                        }
                    }
                }
            }
            if (scPoint !== undefined) {
                bot.collisionPoints.push(scPoint);
                if (window.visualDebugging) {
                    canvasUtil.drawCircle(
                        canvasUtil.circle(
                            scPoint.xx,
                            scPoint.yy,
                            scPoint.radius
                        ),
                        "red",
                        false
                    );
                }
            }
        }

        // WALL
        if (
            canvasUtil.getDistance2(
                bot.MID_X,
                bot.MID_Y,
                window.snake.xx,
                window.snake.yy
            ) > Math.pow(bot.MAP_R - 1000, 2)
        ) {
            var midAng = canvasUtil.fastAtan2(
                window.snake.yy - bot.MID_X,
                window.snake.xx - bot.MID_Y
            );
            scPoint = {
                xx: bot.MID_X + bot.MAP_R * Math.cos(midAng),
                yy: bot.MID_Y + bot.MAP_R * Math.sin(midAng),
                snake: -1,
                radius: bot.snakeWidth,
            };
            canvasUtil.getDistance2FromSnake(scPoint);
            bot.collisionPoints.push(scPoint);
            bot.addCollisionAngle(scPoint);
            if (window.visualDebugging) {
                canvasUtil.drawCircle(
                    canvasUtil.circle(scPoint.xx, scPoint.yy, scPoint.radius),
                    "yellow",
                    false
                );
            }
        }

        bot.collisionPoints.sort(bot.sortDistance);
        if (window.visualDebugging) {
            for (var i = 0; i < bot.collisionAngles.length; i++) {
                if (bot.collisionAngles[i] !== undefined) {
                    canvasUtil.drawLine(
                        {
                            xx: window.snake.xx,
                            yy: window.snake.yy,
                        },
                        {
                            xx: bot.collisionAngles[i].xx,
                            yy: bot.collisionAngles[i].yy,
                        },
                        "#99ffcc",
                        2
                    );
                }
            }
        }
    },

    // Checks to see if you are going to collide with anything in the collision detection radius
    checkCollision: function () {
        var headCircle = canvasUtil.circle(
            window.snake.xx,
            window.snake.yy,
            ((bot.speedMult * bot.opt.radiusMult) / 2) * bot.snakeRadius
        );

        var fullHeadCircle = canvasUtil.circle(
            window.snake.xx,
            window.snake.yy,
            bot.opt.radiusMult * bot.snakeRadius
        );

        if (window.visualDebugging) {
            canvasUtil.drawCircle(fullHeadCircle, "red");
            canvasUtil.drawCircle(headCircle, "blue", false);
        }

        bot.getCollisionPoints();
        if (bot.collisionPoints.length === 0) return false;

        for (var i = 0; i < bot.collisionPoints.length; i++) {
            var collisionCircle = canvasUtil.circle(
                bot.collisionPoints[i].xx,
                bot.collisionPoints[i].yy,
                bot.collisionPoints[i].radius
            );

            if (canvasUtil.circleIntersect(headCircle, collisionCircle)) {
                window.setAcceleration(bot.defaultAccel);
                bot.avoidCollisionPoint(bot.collisionPoints[i]);
                return true;
            }

            // snake -1 is special case for non snake object.
            if (bot.collisionPoints[i].snake !== -1) {
                var enemyHeadCircle = canvasUtil.circle(
                    window.snakes[bot.collisionPoints[i].snake].xx,
                    window.snakes[bot.collisionPoints[i].snake].yy,
                    bot.collisionPoints[i].radius
                );

                if (
                    canvasUtil.circleIntersect(fullHeadCircle, enemyHeadCircle)
                ) {
                    if (window.snakes[bot.collisionPoints[i].snake].sp > 10) {
                        window.setAcceleration(1);
                    } else {
                        window.setAcceleration(bot.defaultAccel);
                    }
                    bot.avoidHeadPoint({
                        xx: window.snakes[bot.collisionPoints[i].snake].xx,
                        yy: window.snakes[bot.collisionPoints[i].snake].yy,
                    });
                    return true;
                }
            }
        }
        window.setAcceleration(bot.defaultAccel);
        return false;
    },

    sortScore: function (a, b) {
        return b.score - a.score;
    },

    // Round angle difference up to nearest foodRoundAngle degrees.
    // Round food up to nearest foodRoundsz, square for distance^2
    scoreFood: function (f) {
        f.score =
            Math.pow(
                Math.ceil(f.sz / bot.opt.foodRoundSize) * bot.opt.foodRoundSize,
                2
            ) /
            f.distance /
            (Math.ceil(f.da / bot.opt.foodRoundAngle) * bot.opt.foodRoundAngle);
    },

    computeFoodGoal: function () {
        var foodClusters = [];
        var foodGetIndex = [];
        var fi = 0;
        var sw = bot.snakeWidth;

        for (
            var i = 0;
            i < window.foods.length && window.foods[i] !== null;
            i++
        ) {
            var a;
            var da;
            var distance;
            var sang = window.snake.ehang;
            var f = window.foods[i];

            if (
                !f.eaten &&
                !(
                    canvasUtil.circleIntersect(
                        canvasUtil.circle(f.xx, f.yy, 2),
                        bot.sidecircle_l
                    ) ||
                    canvasUtil.circleIntersect(
                        canvasUtil.circle(f.xx, f.yy, 2),
                        bot.sidecircle_r
                    )
                )
            ) {
                var cx = Math.round(Math.round(f.xx / sw) * sw);
                var cy = Math.round(Math.round(f.yy / sw) * sw);
                var csz = Math.round(f.sz);

                if (foodGetIndex[cx + "|" + cy] === undefined) {
                    foodGetIndex[cx + "|" + cy] = fi;
                    a = canvasUtil.fastAtan2(
                        cy - window.snake.yy,
                        cx - window.snake.xx
                    );
                    da = Math.min(
                        2 * Math.PI - Math.abs(a - sang),
                        Math.abs(a - sang)
                    );
                    distance = Math.round(
                        canvasUtil.getDistance2(
                            cx,
                            cy,
                            window.snake.xx,
                            window.snake.yy
                        )
                    );
                    foodClusters[fi] = {
                        xx: cx,
                        yy: cy,
                        a: a,
                        da: da,
                        sz: csz,
                        distance: distance,
                        score: 0.0,
                    };
                    fi++;
                } else {
                    foodClusters[foodGetIndex[cx + "|" + cy]].sz += csz;
                }
            }
        }

        foodClusters.forEach(bot.scoreFood);
        foodClusters.sort(bot.sortScore);

        for (i = 0; i < foodClusters.length; i++) {
            var aIndex = bot.getAngleIndex(foodClusters[i].a);
            if (
                bot.collisionAngles[aIndex] === undefined ||
                (Math.sqrt(bot.collisionAngles[aIndex].distance) -
                    (bot.snakeRadius * bot.opt.radiusMult) / 2 >
                    Math.sqrt(foodClusters[i].distance) &&
                    foodClusters[i].sz > bot.opt.foodSmallSize)
            ) {
                bot.currentFood = foodClusters[i];
                return;
            }
        }
        bot.currentFood = {
            xx: bot.MID_X,
            yy: bot.MID_Y,
        };
    },

    foodAccel: function () {
        var aIndex = 0;

        if (bot.currentFood && bot.currentFood.sz > bot.opt.foodAccelSize) {
            aIndex = bot.getAngleIndex(bot.currentFood.a);

            if (
                bot.collisionAngles[aIndex] &&
                bot.collisionAngles[aIndex].distance >
                bot.currentFood.distance +
                bot.snakeWidth * bot.opt.radiusMult &&
                bot.currentFood.da < bot.opt.foodAccelAngle
            ) {
                return 1;
            }

            if (bot.collisionAngles[aIndex] === undefined) {
                return 1;
            }
        }

        return bot.defaultAccel;
    },

    every: function () {
        bot.MID_X = window.grd;
        bot.MID_Y = window.grd;
        bot.MAP_R = window.grd * 0.98;

        bot.sectorBoxSide =
            Math.floor(Math.sqrt(window.sectors.length)) * window.sector_size;
        bot.sectorBox = canvasUtil.rect(
            window.snake.xx - bot.sectorBoxSide / 2,
            window.snake.yy - bot.sectorBoxSide / 2,
            bot.sectorBoxSide,
            bot.sectorBoxSide
        );
        // if (window.visualDebugging)
        //     canvasUtil.drawRect(bot.sectorBox, "#c0c0c0", true, 0.1);

        bot.cos = Math.cos(window.snake.ang);
        bot.sin = Math.sin(window.snake.ang);

        bot.speedMult = window.snake.sp / 5.78;
        bot.snakeRadius = bot.getSnakeWidth() / 2;
        bot.snakeWidth = bot.getSnakeWidth();

        bot.sidecircle_r = canvasUtil.circle(
            window.snake.lnp.xx - bot.sin * bot.snakeWidth,
            window.snake.lnp.yy + bot.cos * bot.snakeWidth,
            bot.snakeWidth * bot.speedMult
        );

        bot.sidecircle_l = canvasUtil.circle(
            window.snake.lnp.xx + bot.sin * bot.snakeWidth,
            window.snake.lnp.yy - bot.cos * bot.snakeWidth,
            bot.snakeWidth * bot.speedMult
        );
    },

    boost: false,

    // Main bot
    go: function () {
        if (window.snake.dead) return;
        bot.every();

        objectives.forEach((objective) => objective.tick && objective.tick(bot));
        //objectives.forEach((objective) => objective.drawDebug(bot));
        const priorities = objectives.map((objective) => objective.getPriority(bot));
        const currentObjective =
            objectives[priorities.indexOf(Math.max(...priorities))];

        bot.currentObjectiveName = currentObjective.name;

        currentObjective.drawDebug(bot);
        const { target_x, target_y, _ } = currentObjective.getAction(bot);
        if (this.boost && Math.random() < 0.0020) {
            this.boost = false;
        } else if (!this.boost && Math.random() < 0.0004) {
            this.boost = true;
        }
        window.setAcceleration(this.boost);
        canvasUtil.setMouseCoordinates(
            canvasUtil.mapToMouse(canvasUtil.point(target_x, target_y))
        );
    },
};

export default bot;
