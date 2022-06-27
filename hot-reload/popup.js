const check = document.getElementById("hot-reloading-enabled");

check.onchange = () => {
    chrome.storage.local.set({ hrConnected: check.checked });
};

chrome.storage.local.get("hrConnected", ({ hrConnected }) => {
    check.checked = hrConnected;
});
