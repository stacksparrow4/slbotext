import bot from "../bot";
import canvasUtil from "../canvasUtil";

// Helper function to get info about other snakes.
// Mainly just cleaning up the mess that is the snakes array
export const getSnakes = () => {
    const alive_snakes = window.snakes.filter(
        (s) => s.alive_amt === 1 && s.id !== window.snake.id
    );

    return alive_snakes.map((s) => ({
        // Head is at s.xx, s.yy
        x: s.xx,
        y: s.yy,
        radius: bot.getSnakeWidth(s.sc) / 2,
        segments: s.pts
            .filter(
                (p) =>
                    !p.dying &&
                    canvasUtil.pointInRect(
                        {
                            x: p.xx,
                            y: p.yy,
                        },
                        bot.sectorBox
                    )
            )
            .map((p) => ({ x: p.xx, y: p.yy })),
    }));
};
