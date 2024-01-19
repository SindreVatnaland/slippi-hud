"use strict";

const path = require("path");
const log = require("electron-log");

const find = require("find-process");

const mainLog = setLoggingPath(log);

let installNode;
let installNodeCg;
let nodecgProcess;

function setLoggingPath(log) {
  try {
    const getAppDataPath = require("appdata-path");
    const appDataPath = getAppDataPath("primal-hud");
    log.transports.file.resolvePath = () =>
      path.join(`${appDataPath}/main.log`);
  } catch (err) {
    log.error(err);
  }
  return log;
}

try {
  const { app, Tray, nativeImage, Menu } = require("electron");

  let tray;

  function createTray() {
    const imagePath = path.join(__dirname, "../../icon.png");
    const image = nativeImage.createFromPath(imagePath);
    tray = new Tray(image.resize({ width: 16, height: 16 }));
    tray.setToolTip("Primal");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Open",
        click: () => {
          mainWindow.show();
        },
      },
      {
        label: "Quit",
        click: () => {
          app.exit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    return tray;
  }

  app.on("ready", () => {
    createTray();
    const { exec } = require("child_process");
    installNode = exec(
      "curl -fsSL https://deb.nodesource.com/setup_18.x && apt-get install -y nodejs"
    );

    installNode.stdout.on("data", (data) => {
      mainLog.info(`NodeCG stdout: ${data}`);
    });

    installNode.stderr.on("data", (data) => {
      console.error(`NodeCG stderr: ${data}`);
    });

    installNode.on("close", (code) => {
      mainLog.info(`NodeCG process exited with code ${code}`);
      mainLog.info("Installing NodeCg");
      installNodeCg = exec("npm i -g nodecg");
      installNodeCg.stdout.on("data", (data) => {
        mainLog.info(`NodeCG stdout: ${data}`);
      });

      installNodeCg.stderr.on("data", (data) => {
        console.error(`NodeCG stderr: ${data}`);
      });
      installNodeCg.on("close", (code) => {
        mainLog.info(`NodeCG process exited with code ${code}`);
        mainLog.info("Starting program");
        nodecgProcess = exec("npm start", { cwd: __dirname + "/nodecg" });
        nodecgProcess.stdout.on("data", (data) => {
          mainLog.info(`NodeCG stdout: ${data}`);
        });

        nodecgProcess.stderr.on("data", (data) => {
          console.error(`NodeCG stderr: ${data}`);
          app.exit();
        });

        nodecgProcess.on("close", (code) => {
          mainLog.info(`NodeCG process exited with code ${code}`);
        });
      });
    });
  });

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => {
      // Kill the child process when the main process receives signals like Ctrl+C
      nodecgProcess?.kill();
      installNode?.kill();
      installNodeCg?.kill();
      process.exit();
    });
  });
  process.on("exit", () => {
    nodecgProcess?.kill();
    installNode?.kill();
    installNodeCg?.kill();
    mainLog.info("Main application is exiting. Terminating child process.");
  });
} catch (err) {
  mainLog.error(err);
}
