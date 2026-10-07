const { app, BrowserWindow } = require("electron");

function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 750
    });

    win.loadFile("index.html");
}

app.whenReady().then(createWindow);