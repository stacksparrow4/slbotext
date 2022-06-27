const connect = () => {
    console.log("Connecting to hot reload server...");

    // Connected now
    const ws = new WebSocket("ws://localhost:9001/");

    ws.onopen = () => {
        ws.send("iamclient");
        console.log("Connected!");
    };

    ws.onmessage = (ev) => {
        console.log("Initiating reload...");
        chrome.runtime.reload();
    };

    ws.onclose = () => {
        console.log("Closing connection");
        chrome.storage.local.set({ hrConnected: false });
    };
};

chrome.storage.local.onChanged.addListener((changes) => {
    if (!changes.hrConnected) return;
    if (changes.hrConnected.newValue) {
        connect();
    }
});

connect();
