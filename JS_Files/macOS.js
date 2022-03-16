// https://stackoverflow.com/questions/39468688/electron-cant-find-module-remote-in-the-renderer-process


// require('electron').remote is undefined -> unable to access systemPreference to access camera and microphone
const { systemPreferences } = require('electron').remote

console.log("IN MacOS")

systemPreferences.askForMediaAccess("camera");
systemPreferences.askForMediaAccess("microphone");
