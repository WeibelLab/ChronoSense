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

const HOME_PAGE_NUM = 0;
const WEBCAM_PAGE_NUM = 1;
const KINECT_PAGE_NUM = 2;
const KINECT_BODY_PAGE_NUM = 3;
const ABOUT_PAGE_NUM = 4;

//Holds a value for which page is open for the device so it knows which 
//functions to call from which page.
//Legend:
// 0 - Home
// 1 - Webcam
// 2 - Kinect
// 3 - Kinect Body Tracking
// 4 - About
let currentlyOpenPage = 0;


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
        checkClosingWindow(HOME_PAGE_NUM);
        currentlyOpenPage = HOME_PAGE_NUM;
        //Add HTML for Home page as source for the web viewer
    });

    btnWebcam.addEventListener("click", event => {
        console.log("YOU ARE WEBCAM");
        checkClosingWindow(WEBCAM_PAGE_NUM);
        currentlyOpenPage = WEBCAM_PAGE_NUM;
        viewerWindow.src = "../HTML_Files/webcam.html";
    });

    btnKinect.addEventListener("click", event => {
        console.log("YOU ARE KINECT CAM");
        checkClosingWindow(KINECT_PAGE_NUM);
        currentlyOpenPage = KINECT_PAGE_NUM;
        viewerWindow.src = "../HTML_Files/kinect.html";
    });

    btnKinectBodyTracking.addEventListener("click", event => {
        console.log("YOU ARE BODY TRACKING");
        checkClosingWindow(KINECT_BODY_PAGE_NUM);
        currentlyOpenPage = KINECT_BODY_PAGE_NUM;
        viewerWindow.src = "../HTML_Files/kinect_body.html";
    });

    btnAbout.addEventListener("click", event => {
        console.log("YOU ARE ABOUT");
        checkClosingWindow(ABOUT_PAGE_NUM);
        currentlyOpenPage = ABOUT_PAGE_NUM;
        //Add HTML for an about page to the src of webviewer
    });

} //End of handleWindowControls()

/**
 * Function that checks which windows are being closed out in order to call
 * the correct functions from their respective js files to close out running
 * device functionality before switching.
 * 
 */
function checkClosingWindow(newPageNum) {
    //Check which window is closing; if changing to same as before, don't 
    //refresh
    if(currentlyOpenPage == newPageNum) {
        return;
    }

    switch (currentlyOpenPage) {
        case HOME_PAGE_NUM:
            break;

        case WEBCAM_PAGE_NUM:
            break;

        case KINECT_PAGE_NUM:
            break;

        case KINECT_BODY_PAGE_NUM:
            break;

        case ABOUT_PAGE_NUM:
            break;

    }  //End of switch 


}