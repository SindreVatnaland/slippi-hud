const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", () => {
  createWindow();

  // Start NodeCG
  const nodecgProcess = exec("nodecg start", { cwd: "/path/to/your/nodecg" });

  nodecgProcess.stdout.on("data", (data) => {
    console.log(`NodeCG stdout: ${data}`);
  });

  nodecgProcess.stderr.on("data", (data) => {
    console.error(`NodeCG stderr: ${data}`);
  });

  nodecgProcess.on("close", (code) => {
    console.log(`NodeCG process exited with code ${code}`);
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});
