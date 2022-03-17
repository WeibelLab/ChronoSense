const { systemPreferences } = require('electron').remote

export async function fixPermissions(){
    if(process.platform === "darwin") {
        if(systemPreferences.getMediaAccessStatus("camera") != "granted"){
            await systemPreferences.askForMediaAccess("camera");
        }
        if(systemPreferences.getMediaAccessStatus("microphone") != "granted"){
            await systemPreferences.askForMediaAccess("microphone");
        }
    }
}
