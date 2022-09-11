import bot from "../bot";
import canvasUtil from "../canvasUtil";

export const getSnake = (s) => ({
    // Head is at s.xx, s.yy
    xx: s.xx,
    yy: s.yy,
    radius: bot.getSnakeWidth(s.sc) / 2,
    ang: s.ang,
    segments: s.pts
        .filter(
            (p) =>
                !p.dying &&
                canvasUtil.pointInRect(
                    {
                        xx: p.xx,
                        yy: p.yy,
                    },
                    bot.sectorBox
                )
        )
        .map((p) => ({ xx: p.xx, yy: p.yy })),
});

export const getMySnake = () => {
    return getSnake(window.snake);
}

// Helper function to get info about other snakes.
// Mainly just cleaning up the mess that is the snakes array
export const getSnakes = () => {
    const alive_snakes = window.snakes.filter(
        (s) => s.alive_amt === 1 && s.id !== window.snake.id
    );

    return alive_snakes.map(getSnake);
};


export const distanceBetween2 = (pos1, pos2) => {
    return (pos1.xx - pos2.xx) * (pos1.xx - pos2.xx) + (pos1.yy - pos2.yy) * (pos1.yy - pos2.yy);
}

export const distanceBetween = (pos1, pos2) => {
    return Math.sqrt(distanceBetween2(pos1, pos2));
}
