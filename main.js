const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, screen} = electron;

let mainWindow;

function createWindow() {
    //Fill size of the monitor natively
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    //Create new window
    mainWindow = new BrowserWindow({ 
        width: width, 
        height: height, 
        frame: false,
        webPreferences: { nodeIntegration: true},
        show: false
     });
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
      })
    // Load html into window
    mainWindow.loadFile('HTML_Files/index.html');
    //Close window when closed
    mainWindow.on('closed', function() {
        mainWindow = null;
      });
}

// Listen for application to be ready
app.on('ready', createWindow);

//If Mac, only close fully when all windows closed
app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
      app.quit();
  });

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

//Set path for saved recording files
app.setPath("userData", __dirname + "/saved_recordings");