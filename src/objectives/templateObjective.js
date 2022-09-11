const templateObjective = {
    getPriority: function () {
        return 1;
    },

    getAction: function () {
        return {
            target_x: 0,
            target_y: 0,
            boost: false,
        };
    },

    drawDebug: function () {

    },
};

export default templateObjective;
