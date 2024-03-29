const canvasUtil = {
    // Ratio of screen size divided by canvas size.
    canvasRatio: {
        xx: window.mc.width / window.ww,
        yy: window.mc.height / window.hh,
    },

    // Set direction of snake towards the virtual mouse coordinates
    setMouseCoordinates: function (point) {
        window.xm = point.xx;
        window.ym = point.yy;
    },

    // Convert snake-relative coordinates to absolute screen coordinates.
    mouseToScreen: function (point) {
        var screenX = point.xx + window.ww / 2;
        var screenY = point.yy + window.hh / 2;
        return {
            xx: screenX,
            yy: screenY,
        };
    },

    // Convert screen coordinates to canvas coordinates.
    screenToCanvas: function (point) {
        var canvasX =
            window.csc * (point.xx * canvasUtil.canvasRatio.xx) -
            parseInt(window.mc.style.left);
        var canvasY =
            window.csc * (point.yy * canvasUtil.canvasRatio.yy) -
            parseInt(window.mc.style.top);
        return {
            xx: canvasX,
            yy: canvasY,
        };
    },

    // Convert map coordinates to mouse coordinates.
    mapToMouse: function (point) {
        var mouseX = (point.xx - window.snake.xx) * window.gsc;
        var mouseY = (point.yy - window.snake.yy) * window.gsc;
        return {
            xx: mouseX,
            yy: mouseY,
        };
    },

    // Map coordinates to Canvas coordinates.
    mapToCanvas: function (point) {
        var c = canvasUtil.mapToMouse(point);
        c = canvasUtil.mouseToScreen(c);
        c = canvasUtil.screenToCanvas(c);
        return c;
    },

    // Map to Canvas coordinates conversion for drawing circles.
    circleMapToCanvas: function (circle) {
        var newCircle = canvasUtil.mapToCanvas(circle);
        return canvasUtil.circle(
            newCircle.xx,
            newCircle.yy,
            // Radius also needs to scale by .gsc
            circle.radius * window.gsc
        );
    },

    // Constructor for point type
    point: function (xx, yy) {
        var p = {
            xx: Math.round(xx),
            yy: Math.round(yy),
        };

        return p;
    },

    // Constructor for rect type
    rect: function (xx, yy, w, h) {
        var r = {
            xx: Math.round(xx),
            yy: Math.round(yy),
            width: Math.round(w),
            height: Math.round(h),
        };

        return r;
    },

    // Constructor for circle type
    circle: function (xx, yy, r) {
        var c = {
            xx: Math.round(xx),
            yy: Math.round(yy),
            radius: Math.round(r),
        };

        return c;
    },

    // Fast atan2
    fastAtan2: function (yy, xx) {
        const QPI = Math.PI / 4;
        const TQPI = (3 * Math.PI) / 4;
        var r = 0.0;
        var angle = 0.0;
        var abs_y = Math.abs(yy) + 1e-10;
        if (xx < 0) {
            r = (xx + abs_y) / (abs_y - xx);
            angle = TQPI;
        } else {
            r = (xx - abs_y) / (xx + abs_y);
            angle = QPI;
        }
        angle += (0.1963 * r * r - 0.9817) * r;
        if (yy < 0) {
            return -angle;
        }

        return angle;
    },

    // Adjusts zoom in response to the mouse wheel.
    setZoom: function (e) {
        // Scaling ratio
        if (window.gsc) {
            window.gsc *= Math.pow(
                0.9,
                e.wheelDelta / -120 || e.detail / 2 || 0
            );
        }
    },

    // Restores zoom to the default value.
    resetZoom: function () {
        window.gsc = 0.9;
    },

    // Sets background to the given image URL.
    // Defaults to slither.io's own background.
    setBackground: function (url) {
        url = typeof url !== "undefined" ? url : "/s/bg45.jpg";
        window.ii.src = url;
    },

    // Draw a rectangle on the canvas.
    drawRect: function (rect, color, fill, alpha) {
        if (alpha === undefined) alpha = 1;

        var context = window.mc.getContext("2d");
        var lc = canvasUtil.mapToCanvas({
            xx: rect.xx,
            yy: rect.yy,
        });

        context.save();
        context.globalAlpha = alpha;
        context.strokeStyle = color;
        context.rect(
            lc.xx,
            lc.yy,
            rect.width * window.gsc,
            rect.height * window.gsc
        );
        context.stroke();
        if (fill) {
            context.fillStyle = color;
            context.fill();
        }
        context.restore();
    },

    // Draw a circle on the canvas.
    drawCircle: function (circle, color, fill, alpha) {
        if (alpha === undefined) alpha = 1;
        if (circle.radius === undefined) circle.radius = 5;

        var context = window.mc.getContext("2d");
        var drawCircle = canvasUtil.circleMapToCanvas(circle);

        context.save();
        context.globalAlpha = alpha;
        context.beginPath();
        context.strokeStyle = color;
        context.arc(
            drawCircle.xx,
            drawCircle.yy,
            drawCircle.radius,
            0,
            Math.PI * 2
        );
        context.stroke();
        if (fill) {
            context.fillStyle = color;
            context.fill();
        }
        context.restore();
    },

    // Draw an angle.
    // @param {number} start -- where to start the angle
    // @param {number} angle -- width of the angle
    // @param {String|CanvasGradient|CanvasPattern} color
    // @param {boolean} fill
    // @param {number} alpha
    drawAngle: function (start, angle, color, fill, alpha) {
        if (alpha === undefined) alpha = 0.6;

        var context = window.mc.getContext("2d");

        context.save();
        context.globalAlpha = alpha;
        context.beginPath();
        context.moveTo(window.mc.width / 2, window.mc.height / 2);
        context.arc(
            window.mc.width / 2,
            window.mc.height / 2,
            window.gsc * 100,
            start,
            angle
        );
        context.lineTo(window.mc.width / 2, window.mc.height / 2);
        context.closePath();
        context.stroke();
        if (fill) {
            context.fillStyle = color;
            context.fill();
        }
        context.restore();
    },

    // Draw a line on the canvas.
    drawLine: function (p1, p2, color, width) {
        if (color === undefined) color = '#FFFFFF';
        if (width === undefined) width = 5;

        var context = window.mc.getContext("2d");
        var dp1 = canvasUtil.mapToCanvas(p1);
        var dp2 = canvasUtil.mapToCanvas(p2);

        context.save();
        context.beginPath();
        context.lineWidth = width * window.gsc;
        context.strokeStyle = color;
        context.moveTo(dp1.xx, dp1.yy);
        context.lineTo(dp2.xx, dp2.yy);
        context.stroke();
        context.restore();
    },

    // Given the start and end of a line, is point left.
    isLeft: function (start, end, point) {
        return (
            (end.xx - start.xx) * (point.yy - start.yy) -
                (end.yy - start.yy) * (point.xx - start.xx) >
            0
        );
    },

    // Get distance squared
    getDistance2: function (x1, y1, x2, y2) {
        var distance2 = Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
        return distance2;
    },

    getDistance2FromSnake: function (point) {
        point.distance = canvasUtil.getDistance2(
            window.snake.xx,
            window.snake.yy,
            point.xx,
            point.yy
        );
        return point;
    },

    // Check if point in Rect
    pointInRect: function (point, rect) {
        if (
            rect.xx <= point.xx &&
            rect.yy <= point.yy &&
            rect.xx + rect.width >= point.xx &&
            rect.yy + rect.height >= point.yy
        ) {
            return true;
        }
        return false;
    },

    // Check if circles intersect
    circleIntersect: function (circle1, circle2) {
        var bothRadii = circle1.radius + circle2.radius;
        var dx = circle1.xx - circle2.xx;
        var dy = circle1.yy - circle2.yy;

        // Pretends the circles are squares for a quick collision check.
        // If it collides, do the more expensive circle check.
        if (
            dx + bothRadii > 0 &&
            dy + bothRadii > 0 &&
            dx - bothRadii < 0 &&
            dy - bothRadii < 0
        ) {
            var distance2 = canvasUtil.getDistance2(
                circle1.xx,
                circle1.yy,
                circle2.xx,
                circle2.yy
            );

            if (distance2 < bothRadii * bothRadii) {
                if (window.visualDebugging) {
                    var collisionPointCircle = canvasUtil.circle(
                        (circle1.xx * circle2.radius +
                            circle2.xx * circle1.radius) /
                            bothRadii,
                        (circle1.yy * circle2.radius +
                            circle2.yy * circle1.radius) /
                            bothRadii,
                        5
                    );
                    canvasUtil.drawCircle(circle2, "red", true);
                    canvasUtil.drawCircle(collisionPointCircle, "cyan", true);
                }
                return true;
            }
        }
        return false;
    },
};

export default canvasUtil;
