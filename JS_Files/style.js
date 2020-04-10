// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require('electron').remote;


const viewerWindow = document.getElementById('content-selection');
const btnHome = document.getElementById('homePage');
const btnWebcam = document.getElementById('webcamPage');
const btnKinect = document.getElementById('kinectPage');
const btnKinectBodyTracking = document.getElementById('kinectBodyPage');
const btnAbout = document.getElementById('aboutPage');


// When document has loaded, initialise
document.onreadystatechange = () => {
    if (document.readyState == "complete") {
        handleWindowControls();
    }
};


function handleWindowControls() {

    let win = remote.getCurrentWindow();
    // Make minimise/maximise/restore/close buttons work when they are clicked
    document.getElementById('min-button').addEventListener("click", event => {
        win.minimize();
    });

    document.getElementById('max-button').addEventListener("click", event => {
        win.maximize();
    });

    document.getElementById('restore-button').addEventListener("click", event => 
    {
        win.unmaximize();
    });

    document.getElementById('close-button').addEventListener("click", event => {
        win.close();
    });

    // Toggle maximise/restore buttons when maximisation/unmaximisation occurs
    toggleMaxRestoreButtons();
    win.on('maximize', toggleMaxRestoreButtons);
    win.on('unmaximize', toggleMaxRestoreButtons);

    function toggleMaxRestoreButtons() {
        if (win.isMaximized()) {
            document.body.classList.add('maximized');
        } else {
            document.body.classList.remove('maximized');
        }
    }

    /*
    * Set of functions below are for clicking buttons <a> elements on the main
    * navigation bar for the application. Mainly to switch src of webview to 
    * change the contents of the page.
    * 
    * Buttons: homePage, webcamPage, kinectPage, kinectBodyPage, aboutPage
    */
    btnHome.addEventListener("click", event => {
        console.log("YOU ARE HOME");
        //Add HTML for Home page as source for the web viewer
    });

    btnWebcam.addEventListener("click", event => {
        console.log("YOU ARE WEBCAM");
        viewerWindow.src = "../HTML_Files/webcam.html";
    });

    btnKinect.addEventListener("click", event => {
        console.log("YOU ARE KINECT CAM");
        viewerWindow.src = "../HTML_Files/kinect.html";
    });

    btnKinectBodyTracking.addEventListener("click", event => {
        console.log("YOU ARE BODY TRACKING");
        viewerWindow.src = "../HTML_Files/kinect_body.html";
    });

    btnAbout.addEventListener("click", event => {
        console.log("YOU ARE ABOUT");
        //Add HTML for an about page to the src of webviewer
    });

} //End of handleWindowControls()