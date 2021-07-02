const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow} = electron;

let mainWindow;
let electronScreen;

function createWindow() {
    //Fill size of the monitor natively
    const { width, height } = electronScreen.getPrimaryDisplay().workAreaSize
    //Create new window
    mainWindow = new BrowserWindow({ 
        width: width, 
        height: height, 
        minWidth: 1050,
        minHeight: 750,
        frame: false,
        webPreferences: {
          nodeIntegrationInWorker: true,
          nodeIntegration: true,
          webviewTag: true,
          enableRemoteModule: true
        },
        show: false
     });
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
      })
    // Load html into window
    mainWindow.loadFile('HTML_Files/index.html');   //Change back to index.html before ready
    
    // For debugging - show dev tool -> similar to chrome web browser tools (F12)
    // ! Comment out before packaging as an executable !
    // mainWindow.webContents.openDevTools();
    
    //Close window when closed
    mainWindow.on('closed', function() {
        mainWindow = null;
      });
}

// Listen for application to be ready
app.on('ready', () => {
  electronScreen = electron.screen
  createWindow()
})

//If Mac, only close fully when all windows closed
app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
      app.quit();
  });

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow()
    }
});

//Set path for saved recording files
app.setPath("userData", __dirname + "/saved_recordings");

app.allowRendererProcessReuse = false