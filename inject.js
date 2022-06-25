window.onload = () => {
    var s = document.createElement("script");
    s.src = chrome.runtime.getURL("dist/bot.js");
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);

    console.log("Script injected ✅");
};
