import bot from "./bot";
import canvasUtil from "./canvasUtil";

// Save the original slither.io functions so we can modify them, or reenable them later.
var original_keydown = document.onkeydown;
var original_onmouseDown = window.onmousedown;
var original_oef = window.oef;
var original_redraw = window.redraw;
var original_onmousemove = window.onmousemove;

window.oef = function () {};
window.redraw = function () {};

// Modify the redraw()-function to remove the zoom altering code
// and replace b.globalCompositeOperation = "lighter"; to "hard-light".
var original_redraw_string = original_redraw.toString();
var new_redraw_string = original_redraw_string.replace(
    "gsc!=f&&(gsc<f?(gsc+=2E-4,gsc>=f&&(gsc=f)):(gsc-=2E-4,gsc<=f&&(gsc=f)))",
    ""
);
new_redraw_string = new_redraw_string.replace(
    /b.globalCompositeOperation="lighter"/gi,
    'b.globalCompositeOperation="hard-light"'
);
var new_redraw = new Function(
    new_redraw_string.substring(
        new_redraw_string.indexOf("{") + 1,
        new_redraw_string.lastIndexOf("}")
    )
);

const userInterface = {
    overlays: {},

    initOverlays: function () {
        var botOverlay = document.createElement("div");
        botOverlay.style.position = "fixed";
        botOverlay.style.right = "5px";
        botOverlay.style.bottom = "112px";
        botOverlay.style.width = "150px";
        botOverlay.style.height = "85px";
        // botOverlay.style.background = 'rgba(0, 0, 0, 0.5)';
        botOverlay.style.color = "#C0C0C0";
        botOverlay.style.fontFamily = "Consolas, Verdana";
        botOverlay.style.zIndex = 999;
        botOverlay.style.fontSize = "14px";
        botOverlay.style.padding = "5px";
        botOverlay.style.borderRadius = "5px";
        botOverlay.className = "nsi";
        document.body.appendChild(botOverlay);

        var serverOverlay = document.createElement("div");
        serverOverlay.style.position = "fixed";
        serverOverlay.style.right = "5px";
        serverOverlay.style.bottom = "5px";
        serverOverlay.style.width = "160px";
        serverOverlay.style.height = "14px";
        serverOverlay.style.color = "#C0C0C0";
        serverOverlay.style.fontFamily = "Consolas, Verdana";
        serverOverlay.style.zIndex = 999;
        serverOverlay.style.fontSize = "14px";
        serverOverlay.className = "nsi";
        document.body.appendChild(serverOverlay);

        var prefOverlay = document.createElement("div");
        prefOverlay.style.position = "fixed";
        prefOverlay.style.left = "10px";
        prefOverlay.style.top = "75px";
        prefOverlay.style.width = "260px";
        prefOverlay.style.height = "210px";
        // prefOverlay.style.background = 'rgba(0, 0, 0, 0.5)';
        prefOverlay.style.color = "#C0C0C0";
        prefOverlay.style.fontFamily = "Consolas, Verdana";
        prefOverlay.style.zIndex = 999;
        prefOverlay.style.fontSize = "14px";
        prefOverlay.style.padding = "5px";
        prefOverlay.style.borderRadius = "5px";
        prefOverlay.className = "nsi";
        document.body.appendChild(prefOverlay);

        var statsOverlay = document.createElement("div");
        statsOverlay.style.position = "fixed";
        statsOverlay.style.left = "10px";
        statsOverlay.style.top = "340px";
        statsOverlay.style.width = "140px";
        statsOverlay.style.height = "210px";
        // statsOverlay.style.background = 'rgba(0, 0, 0, 0.5)';
        statsOverlay.style.color = "#C0C0C0";
        statsOverlay.style.fontFamily = "Consolas, Verdana";
        statsOverlay.style.zIndex = 998;
        statsOverlay.style.fontSize = "14px";
        statsOverlay.style.padding = "5px";
        statsOverlay.style.borderRadius = "5px";
        statsOverlay.className = "nsi";
        document.body.appendChild(statsOverlay);

        userInterface.overlays.botOverlay = botOverlay;
        userInterface.overlays.serverOverlay = serverOverlay;
        userInterface.overlays.prefOverlay = prefOverlay;
        userInterface.overlays.statsOverlay = statsOverlay;
    },

    toggleOverlays: function () {
        Object.keys(userInterface.overlays).forEach(function (okey) {
            var oVis =
                userInterface.overlays[okey].style.visibility !== "hidden"
                    ? "hidden"
                    : "visible";
            userInterface.overlays[okey].style.visibility = oVis;
            window.visualDebugging = oVis === "visible";
        });
    },
    toggleLeaderboard: function () {
        window.leaderboard = !window.leaderboard;
        userInterface.savePreference("leaderboard", window.leaderboard);
        if (window.leaderboard) {
            // window.lbh.style.display = 'block';
            // window.lbs.style.display = 'block';
            // window.lbp.style.display = 'block';
            window.lbn.style.display = "block";
        } else {
            // window.lbh.style.display = 'none';
            // window.lbs.style.display = 'none';
            // window.lbp.style.display = 'none';
            window.lbn.style.display = "none";
        }
    },
    removeLogo: function () {
        if (typeof window.showlogo_iv !== "undefined") {
            window.ncka = window.lgss = window.lga = 1;
            clearInterval(window.showlogo_iv);
            showLogo(true);
        }
    },
    // Save variable to local storage
    savePreference: function (item, value) {
        window.localStorage.setItem(item, value);
        userInterface.onPrefChange();
    },

    // Load a variable from local storage
    loadPreference: function (preference, defaultVar) {
        var savedItem = window.localStorage.getItem(preference);
        if (savedItem !== null) {
            if (savedItem === "true") {
                window[preference] = true;
            } else if (savedItem === "false") {
                window[preference] = false;
            } else {
                window[preference] = savedItem;
            }
        } else {
            window[preference] = defaultVar;
        }
        userInterface.onPrefChange();
        return window[preference];
    },

    // Saves username when you click on "Play" button
    playButtonClickListener: function () {
        userInterface.loadPreference("autoRespawn", false);
        userInterface.onPrefChange();
    },

    // Hide top score
    hideTop: function () {
        var nsidivs = document.querySelectorAll("div.nsi");
        for (var i = 0; i < nsidivs.length; i++) {
            if (
                nsidivs[i].style.top === "4px" &&
                nsidivs[i].style.width === "300px"
            ) {
                nsidivs[i].style.visibility = "hidden";
                bot.isTopHidden = true;
                window.topscore = nsidivs[i];
            }
        }
    },

    // Store FPS data
    framesPerSecond: {
        fps: 0,
        fpsTimer: function () {
            if (window.playing && window.fps && window.lrd_mtm) {
                if (Date.now() - window.lrd_mtm > 970) {
                    userInterface.framesPerSecond.fps = window.fps;
                }
            }
        },
    },

    onkeydown: function (e) {
        // Original slither.io onkeydown function + whatever is under it
        original_keydown(e);
        if (window.playing) {
            // Letter `T` to toggle bot
            if (e.keyCode === 84) {
                bot.isBotEnabled = !bot.isBotEnabled;
            }
            // Letter 'Y' to toggle debugging (visual)
            if (e.keyCode === 89) {
                window.visualDebugging = !window.visualDebugging;
                userInterface.savePreference(
                    "visualDebugging",
                    window.visualDebugging
                );
            }
            // Letter 'G' to toggle leaderboard
            if (e.keyCode === 71) {
                userInterface.toggleLeaderboard(!window.leaderboard);
            }
            // Letter 'I' to toggle autorespawn
            if (e.keyCode === 73) {
                window.autoRespawn = !window.autoRespawn;
                userInterface.savePreference("autoRespawn", window.autoRespawn);
            }
            // Letter 'H' to toggle hidden mode
            if (e.keyCode === 72) {
                userInterface.toggleOverlays();
            }
            // Letter 'B' to prompt for a custom background url
            if (e.keyCode === 66) {
                var url = prompt("Please enter a background url:");
                if (url !== null) {
                    canvasUtil.setBackground(url);
                }
            }
            // Letter 'O' to change rendermode (visual)
            if (e.keyCode === 79) {
                userInterface.toggleMobileRendering(!window.mobileRender);
            }
            // Letter 'A' to increase collision detection radius
            if (e.keyCode === 65) {
                bot.opt.radiusMult++;
            }
            // Letter 'S' to decrease collision detection radius
            if (e.keyCode === 83) {
                if (bot.opt.radiusMult > 1) {
                    bot.opt.radiusMult--;
                }
            }
            // Letter 'D' to quick toggle collision radius
            if (e.keyCode === 68) {
                if (
                    bot.opt.radiusMult >
                    (bot.opt.radiusAvoidSize - bot.opt.radiusApproachSize) / 2 +
                        bot.opt.radiusApproachSize
                ) {
                    bot.opt.radiusMult = bot.opt.radiusApproachSize;
                } else {
                    bot.opt.radiusMult = bot.opt.radiusAvoidSize;
                }
            }
            // Letter 'Z' to reset zoom
            if (e.keyCode === 90) {
                canvasUtil.resetZoom();
            }
            // Letter 'Q' to quit to main menu
            if (e.keyCode === 81) {
                window.autoRespawn = false;
                userInterface.quit();
            }
            // 'ESC' to quickly respawn
            if (e.keyCode === 27) {
                bot.quickRespawn();
            }
            userInterface.onPrefChange();
        }
    },

    onmousedown: function (e) {
        if (window.playing) {
            switch (e.which) {
                // "Left click" to manually speed up the slither
                case 1:
                    bot.defaultAccel = 1;
                    if (!bot.isBotEnabled) {
                        original_onmouseDown(e);
                    }
                    break;
                // "Right click" to toggle bot in addition to the letter "T"
                case 3:
                    bot.isBotEnabled = !bot.isBotEnabled;
                    break;
            }
        } else {
            original_onmouseDown(e);
        }
        userInterface.onPrefChange();
    },

    onmouseup: function () {
        bot.defaultAccel = 0;
    },

    // Manual mobile rendering
    toggleMobileRendering: function (mobileRendering) {
        window.mobileRender = mobileRendering;
        userInterface.savePreference("mobileRender", window.mobileRender);
        // Set render mode
        if (window.mobileRender) {
            window.render_mode = 1;
            window.want_quality = 0;
            window.high_quality = false;
        } else {
            window.render_mode = 2;
            window.want_quality = 1;
            window.high_quality = true;
        }
    },

    // Update stats overlay.
    updateStats: function () {
        var oContent = [];
        var median;

        if (bot.scores.length === 0) return;
        median = Math.round(
            (bot.scores[Math.floor((bot.scores.length - 1) / 2)] +
                bot.scores[Math.ceil((bot.scores.length - 1) / 2)]) /
                2
        );

        oContent.push("games played: " + bot.scores.length);
        oContent.push(
            "a: " +
                Math.round(
                    bot.scores.reduce(function (a, b) {
                        return a + b;
                    }) / bot.scores.length
                ) +
                " m: " +
                median
        );

        for (var i = 0; i < bot.scores.length && i < 10; i++) {
            oContent.push(i + 1 + ". " + bot.scores[i]);
        }

        userInterface.overlays.statsOverlay.innerHTML = oContent.join("<br/>");
    },

    onPrefChange: function () {
        // Set static display options here.
        var oContent = [];
        var ht = userInterface.handleTextColor;

        // oContent.push('version: ' + GM_info.script.version);
        oContent.push("[T / Right click] bot: " + ht(bot.isBotEnabled));
        oContent.push("[O] mobile rendering: " + ht(window.mobileRender));
        oContent.push("[A/S] radius multiplier: " + bot.opt.radiusMult);
        oContent.push(
            "[D] quick radius change " +
                bot.opt.radiusApproachSize +
                "/" +
                bot.opt.radiusAvoidSize
        );
        oContent.push("[I] auto respawn: " + ht(window.autoRespawn));
        oContent.push("[G] leaderboard overlay: " + ht(window.leaderboard));
        oContent.push("[Y] visual debugging: " + ht(window.visualDebugging));
        oContent.push("[H] overlays");
        oContent.push("[B] change background");
        oContent.push("[Mouse Wheel] zoom");
        oContent.push("[Z] reset zoom");
        oContent.push("[ESC] quick respawn");
        oContent.push("[Q] quit to menu");

        userInterface.overlays.prefOverlay.innerHTML = oContent.join("<br/>");
    },

    onFrameUpdate: function () {
        // Botstatus overlay
        var oContent = [];

        if (window.playing && window.snake !== null) {
            oContent.push("fps: " + userInterface.framesPerSecond.fps);

            // Display the X and Y of the snake
            oContent.push(
                "x: " +
                    (Math.round(window.snake.xx) || 0) +
                    " y: " +
                    (Math.round(window.snake.yy) || 0)
            );

            if (window.goalCoordinates) {
                oContent.push("target");
                oContent.push(
                    "x: " +
                        window.goalCoordinates.x +
                        " y: " +
                        window.goalCoordinates.y
                );
                if (window.goalCoordinates.sz) {
                    oContent.push("sz: " + window.goalCoordinates.sz);
                }
            }

            if (
                window.bso !== undefined &&
                userInterface.overlays.serverOverlay.innerHTML !==
                    window.bso.ip + ":" + window.bso.po
            ) {
                userInterface.overlays.serverOverlay.innerHTML =
                    window.bso.ip + ":" + window.bso.po;
            }
        }

        userInterface.overlays.botOverlay.innerHTML = oContent.join("<br/>");

        if (window.playing && window.visualDebugging) {
            // Only draw the goal when a bot has a goal.
            if (window.goalCoordinates && bot.isBotEnabled) {
                var headCoord = {
                    x: window.snake.xx,
                    y: window.snake.yy,
                };
                canvasUtil.drawLine(headCoord, window.goalCoordinates, "green");
                canvasUtil.drawCircle(window.goalCoordinates, "red", true);
            }
        }
    },

    oefTimer: function () {
        var start = Date.now();
        // Original slither.io oef function + whatever is under it
        original_oef();
        // Modified slither.io redraw function
        new_redraw();

        if (window.playing && bot.isBotEnabled && window.snake !== null) {
            window.onmousemove = function () {};
            bot.isBotRunning = true;
            bot.go();
        } else if (bot.isBotEnabled && bot.isBotRunning) {
            bot.isBotRunning = false;
            if (window.lastscore && window.lastscore.childNodes[1]) {
                bot.scores.push(
                    parseInt(window.lastscore.childNodes[1].innerHTML)
                );
                bot.scores.sort(function (a, b) {
                    return b - a;
                });
                userInterface.updateStats();
            }

            if (window.autoRespawn) {
                window.connect();
            }
        }

        if (!bot.isBotEnabled || !bot.isBotRunning) {
            window.onmousemove = original_onmousemove;
        }

        userInterface.onFrameUpdate();
        setTimeout(
            userInterface.oefTimer,
            1000 / bot.opt.targetFps - (Date.now() - start)
        );
    },

    // Quit to menu
    quit: function () {
        if (window.playing && window.resetGame) {
            window.want_close_socket = true;
            window.dead_mtm = 0;
            if (window.play_btn) {
                window.play_btn.setEnabled(true);
            }
            window.resetGame();
        }
    },

    // Update the relation between the screen and the canvas.
    onresize: function () {
        window.resize();
        // Canvas different size from the screen (often bigger).
        canvasUtil.canvasRatio = {
            x: window.mc.width / window.ww,
            y: window.mc.height / window.hh,
        };
    },
    // Handles the text color of the bot preferences
    // enabled = green
    // disabled = red
    handleTextColor: function (enabled) {
        return (
            '<span style="color:' +
            (enabled ? 'green;">enabled' : 'red;">disabled') +
            "</span>"
        );
    },
};

export default userInterface;
