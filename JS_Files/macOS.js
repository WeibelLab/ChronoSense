const { systemPreferences } = require('electron').remote

export async function fixPermissions(){
    if(process.platform === "darwin") {
        if(systemPreferences.getMediaAccessStatus("camera") == "not-determined"){
            await systemPreferences.askForMediaAccess("camera");
                if (systemPreferences.getMediaAccessStatus("camera") == 'denied') {
                    console.log('To enable Camera permission in the future go to System Preferences and allow Camera Access to the ChronoSense App')
                }
        }
        if(systemPreferences.getMediaAccessStatus("microphone") == "not-determined"){
            await systemPreferences.askForMediaAccess("microphone");
                if (systemPreferences.getMediaAccessStatus("microphone") == 'denied') {
                    console.log('To enable Microphone permission in the future go to System Preferences and allow Microphone Access to the ChronoSense App')
                }
        }
    }
}
