import customBotOptions from "./config";
import userInterface from "./userInterface";
import bot from "./bot";
import canvasUtil from "./canvasUtil";
import { connectToTrainingServer } from "./trainingNetwork";

window.play_btn.btnf.addEventListener(
    "click",
    userInterface.playButtonClickListener
);
document.onkeydown = userInterface.onkeydown;
window.onmousedown = userInterface.onmousedown;
window.addEventListener("mouseup", userInterface.onmouseup);
window.onresize = userInterface.onresize;

// Hide top score
userInterface.hideTop();

// Overlays
userInterface.initOverlays();

// Load preferences
userInterface.loadPreference("logDebugging", false);
userInterface.loadPreference("visualDebugging", false);
userInterface.loadPreference("autoRespawn", false);
userInterface.loadPreference("mobileRender", false);
userInterface.loadPreference("leaderboard", true);
window.nick.value = "Ryan :D";

// Don't load saved options or apply custom options if
// the user wants to use default options
if (
    typeof customBotOptions.useDefaults !== "undefined" &&
    customBotOptions.useDefaults === true
) {
    console.log("Ignoring saved / customised options per user request");
} else {
    // Load saved options, if any
    var savedOptions = userInterface.loadPreference("options", null);
    if (savedOptions !== null) {
        // If there were saved options
        // Parse the options and overwrite the default bot options
        savedOptions = JSON.parse(savedOptions);
        if (
            Object.keys(savedOptions).length !== 0 &&
            savedOptions.constructor === Object
        ) {
            Object.keys(savedOptions).forEach(function (key) {
                bot.opt[key] = savedOptions[key];
            });
        }
    }

    // Has the user customised the options?
    if (
        Object.keys(customBotOptions).length !== 0 &&
        customBotOptions.constructor === Object
    ) {
        Object.keys(customBotOptions).forEach(function (key) {
            bot.opt[key] = customBotOptions[key];
        });
    }
}

// Save the bot options
userInterface.savePreference("options", JSON.stringify(bot.opt));

// Listener for mouse wheel scroll - used for setZoom function
document.body.addEventListener("mousewheel", canvasUtil.setZoom);
document.body.addEventListener("DOMMouseScroll", canvasUtil.setZoom);

// Set render mode
if (window.mobileRender) {
    userInterface.toggleMobileRendering(true);
} else {
    userInterface.toggleMobileRendering(false);
}
// Remove laggy logo animation
userInterface.removeLogo();
// Unblocks all skins without the need for FB sharing.
window.localStorage.setItem("edttsg", "1");

// Remove social
window.social.remove();

// Maintain fps
setInterval(userInterface.framesPerSecond.fpsTimer, 80);

// Start!
userInterface.oefTimer();

// Connect to training network
connectToTrainingServer();
