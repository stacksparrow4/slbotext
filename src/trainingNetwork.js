import { loadGraphModel } from "@tensorflow/tfjs-converter";

let trainingWS;
let hasStartedRound = false;

export function obtainTrainingData(trainingData) {
    hasStartedRound = true;
    // console.log(trainingData);
}

export function trainingRoundTerminated() {
    if (!hasStartedRound) {
        return;
    }
    console.log("unlucky");
    hasStartedRound = false;
}

export function connectToTrainingServer() {
    trainingWS = new WebSocket("ws://localhost:8000");

    trainingWS.addEventListener("open", (event) => {
        trainingWS.send("ping");
    });

    trainingWS.addEventListener("message", (event) => {
        if (event.data === "pong") {
            console.log("Connected to training server");

            trainingWS.send("reqnet");

            document
                .getElementById("playh")
                .firstChild.firstChild.querySelector(".nsi")
                .click();
        } else if (event.data.startsWith("resnet=")) {
            const netData = event.data.substring(7);

            const parts = netData.split("|");

            parts.forEach((part) => {
                const [fname, fvalb64] = part.split(":");
                const fval = Buffer.from(fvalb64, "base64");
                localStorage.setItem(fname);
            });

            // localStorage.setItem("curr_model", jsonData);

            // const model = loadGraphModel("localstorage://curr_model");

            // console.log("Loaded model");

            // console.log(model);
        }
    });
}
