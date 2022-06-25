window.onload = () => {
    var s = document.createElement("script");
    s.src = chrome.runtime.getURL("bot.user.js");
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);

    console.log("Script injected ✅");
};
