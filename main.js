const electron = require('electron');
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();
// const { app, BrowserWindow } = electron;
// require('@electron/remote/main').initialize();

let mainWindow;
let electronScreen;

function createWindow() {
    //Fill size of the monitor natively
    const { width, height } = electronScreen.getPrimaryDisplay().workAreaSize
    //Create new window
    mainWindow = new electron.BrowserWindow({ 
        width: width, 
        height: height, 
        minWidth: 1050,
        minHeight: 750,
        frame: false,
        webPreferences: {
          nodeIntegrationInWorker: true,
          nodeIntegration: true,
          contextIsolation: false,
          webviewTag: true
        },
        show: false
     });
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    })

    // Load html into window
    mainWindow.loadFile('HTML_Files/index.html');   //Change back to index.html before ready
    
    // // For debugging - show dev tool -> similar to chrome web browser tools (F12)
    // // ! Comment out before packaging as an executable !
    mainWindow.webContents.openDevTools();
    
    //Close window when closed
    mainWindow.on('closed', function() {
        mainWindow = null;
      });
    
    remoteMain.enable(mainWindow.webContents);
    
}

// Listen for application to be ready
electron.app.on('ready', () => {
  electronScreen = electron.screen
  createWindow()
})

electron.app.on('window-all-closed', function() {
    electron.app.quit();
});

electron.app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow()
    }
});

//Set path for saved recording files
electron.app.setPath("userData", __dirname + "/saved_recordings");

electron.app.allowRendererProcessReuse = false