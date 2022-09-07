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
    console.log("unbliucky");
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

            document
                .getElementById("playh")
                .firstChild.firstChild.querySelector(".nsi")
                .click();
        }
    });
}
