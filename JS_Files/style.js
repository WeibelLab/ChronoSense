// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require('electron').remote;
const KinectAzure = require('kinect-azure');
const kinect = new KinectAzure();  


const viewerWindow = document.getElementById('content-selection');
const btnHome = document.getElementById('homePage');
const btnWebcam = document.getElementById('webcamPage');
const btnKinect = document.getElementById('kinectPage');
const btnKinectBodyTracking = document.getElementById('kinectBodyPage');
const btnAbout = document.getElementById('aboutPage');

//Used in Kinect JS files for displaying content
const displayCanvas = document.getElementById('video_canvas');
const outputCtx = displayCanvas.getContext('2d');
let outputImageData, depthModeRange;

const HOME_PAGE_NUM = 0;
const WEBCAM_PAGE_NUM = 1;
const KINECT_PAGE_NUM = 2;
const KINECT_BODY_PAGE_NUM = 3;
const ABOUT_PAGE_NUM = 4;

var isKinectOn = 0;

//Holds a value for which page is open for the device so it knows which 
//functions to call from which page.
//Legend:
// 0 - Home
// 1 - Webcam
// 2 - Kinect
// 3 - Kinect Body Tracking
// 4 - About
let currentlyOpenPage = false;


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
        checkClosingWindowAndChangeContent(HOME_PAGE_NUM);
    });

    btnWebcam.addEventListener("click", event => {
        console.log("YOU ARE WEBCAM");
        checkClosingWindowAndChangeContent(WEBCAM_PAGE_NUM);
    });

    btnKinect.addEventListener("click", event => {
        console.log("YOU ARE KINECT CAM");
        checkClosingWindowAndChangeContent(KINECT_PAGE_NUM);
    });

    btnKinectBodyTracking.addEventListener("click", event => {
        console.log("YOU ARE BODY TRACKING");
        checkClosingWindowAndChangeContent(KINECT_BODY_PAGE_NUM);
    });

    btnAbout.addEventListener("click", event => {
        console.log("YOU ARE ABOUT");
        checkClosingWindowAndChangeContent(ABOUT_PAGE_NUM);
    });

} //End of handleWindowControls()

/**
 * Function that checks which windows are being closed out in order to call
 * the correct functions from their respective js files to close out running
 * device functionality before switching.
 * 
 * Also serves as the function that manipulates the webviewer!
 * 
 */
function checkClosingWindowAndChangeContent(newPageNum) {
    //Check which window is closing; if changing to same as before, don't 
    //refresh
    if(currentlyOpenPage == newPageNum) {
        return;
    }

    //Manipulate last page due to change
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

    }  //End of OLD page switch

    //Manipulate webviewer to change for NEW window parameters.
    switch (newPageNum) {
        case HOME_PAGE_NUM:
            currentlyOpenPage = HOME_PAGE_NUM;
            displayCanvas.style.display = "none";
            break;

        case WEBCAM_PAGE_NUM:
            currentlyOpenPage = WEBCAM_PAGE_NUM;
            displayCanvas.style.display = "block";  //Reveal video canvas feed.
            break;

        case KINECT_PAGE_NUM:
            currentlyOpenPage = KINECT_PAGE_NUM;
            displayCanvas.style.display = "block";  //Reveal video canvas feed.
            if(isKinectOn) {
                kinectColorVideoFeed();                
            } else {
                startKinect();
                kinectColorVideoFeed(); 
                isKinectOn = true;
            }
            break;

        case KINECT_BODY_PAGE_NUM:
            currentlyOpenPage = KINECT_BODY_PAGE_NUM;
            displayCanvas.style.display = "block";  //Reveal video canvas feed.
            if(isKinectOn) {
                kinectBodyTrackingFeed();                
            } else {
                startKinect();
                kinectBodyTrackingFeed(); 
                isKinectOn = true;
            }
            break;

        case ABOUT_PAGE_NUM:
            currentlyOpenPage = ABOUT_PAGE_NUM;
            displayCanvas.style.display = "none";
            break;

    }  //End of NEW page switch


}

//////////////////////////////////////////////
////  Start of Kinect specific functions  ////
////                                      ////
////                                      ////
//////////////////////////////////////////////

/**
 * Function starts the connect cameras with the set parameters. By default it
 * uses the parameters below; they can be changed later through UI options in 
 * the application.
 * 
 */
function startKinect() {
    if(kinect.open()) {

        kinect.startCameras({
            depth_mode: KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED,
            color_format: KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32,
            color_resolution: KinectAzure.K4A_COLOR_RESOLUTION_1080P,
            camera_fps: KinectAzure.K4A_FRAMES_PER_SECOND_30
        });
        
        depthModeRange = kinect.getDepthModeRange(KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED);
        kinect.createTracker();
    } else {
        //Opening up the kinect has failed, adjust for that error...

    }    




} //End of startKinect()