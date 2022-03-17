
export function fixPermissions(){
    // https://stackoverflow.com/questions/39468688/electron-cant-find-module-remote-in-the-renderer-process
    if(process.platform === "darwin") {
        const { systemPreferences } = require('electron')
        systemPreferences.askForMediaAccess("camera");
        systemPreferences.askForMediaAccess("microphone");
    }
}
