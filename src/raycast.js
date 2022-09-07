import canvasUtil from "./canvasUtil";

export const MAX_RAY_DIST = 500;

function raycast(sx, sy, angle, snakes) {
    // V is a vector in the direction of the ray
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);

    // W is the normal to v (angle + 90 degrees)
    const wx = -vy;
    const wy = vx;

    let closestDist = MAX_RAY_DIST;

    for (let i = 0; i < snakes.length; i++) {
        const currSnake = snakes[i];

        const rad = currSnake.radius * 1.5;

        for (let j = -1; j < currSnake.segments.length; j++) {
            let currX = currSnake.x;
            let currY = currSnake.y;
            if (j >= 0) {
                currX = currSnake.segments[j].x;
                currY = currSnake.segments[j].y;
            }

            // canvasUtil.drawCircle(
            //     canvasUtil.circle(currX, currY, rad),
            //     "#0f0",
            //     false
            // );

            // Transform so origin is ray start
            const dx = currX - sx;
            const dy = currY - sy;

            const projV = dx * vx + dy * vy;

            // Check for collision behind ray
            if (projV < 0) continue;

            const projW = dx * wx + dy * wy;

            if (projW <= rad) {
                // Heuristic check
                if (projV - rad > closestDist) continue;
                // Calculate actual collision point
                const b = -2 * (vx * dx + vy * dy);
                const c = dx * dx + dy * dy - rad * rad;

                const t = (-b - Math.sqrt(b * b - 4 * c)) / 2;

                if (t < closestDist) {
                    closestDist = t;
                }
            }
        }
    }

    return {
        x: sx + vx * closestDist,
        y: sy + vy * closestDist,
        dist: closestDist,
    };
}

export default raycast;
