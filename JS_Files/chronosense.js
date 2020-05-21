// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require('electron').remote;

//Variables of HTML elements for later manipulation 
const viewerWindow = document.getElementById('content-selection');
const btnHome = document.getElementById('homePage');
const btnWebcam = document.getElementById('webcamPage');
const btnKinect = document.getElementById('kinectPage');
const btnKinectBodyTracking = document.getElementById('kinectBodyPage');
const btnAbout = document.getElementById('aboutPage');
const btnKinectOn = document.getElementById('kinect_on');
const btnKinectOff = document.getElementById('kinect_off');

//Used in Kinect JS files for displaying content
const displayCanvas = document.getElementById('video_canvas');  //Use in constructor for Kinect class object
const displayCanvas2 = document.getElementById('video_canvas2');
const displayCanvas3 = document.getElementById('video_canvas3');
const outputCtx = displayCanvas.getContext('2d');  //Delete after instantiating class Kinect
const outputCtx2 = displayCanvas2.getContext('2d');
const outputCtx3 = displayCanvas3.getContext('2d');
let outputImageData, depthModeRange;

//Used in webcam methods
const recordingButton = document.getElementById('record');
const camVideo = document.getElementById('webcam');
const dropdown = document.getElementById('dropdown');

//Constants for application to know which "page" is displayed.
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
let currentlyOpenPage = false;

//Variable for the open KinectDevice
//TODO


// When document has loaded, initialise
document.onreadystatechange = () => {
    if (document.readyState == "complete") {
        handleWindowControls();
    }
};

/**
 * Handles all window controls from app specific minimization to page
 * navigation. Called above when the page is ready to be displayed.
 * 
 */
async function handleWindowControls() {

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

    /*
    * Add events below to buttons and items within "pages."
    */
    btnKinectOn.addEventListener("click", event => {
        if(!isKinectOn) {
            startKinect();
            if(currentlyOpenPage == KINECT_PAGE_NUM) {
                kinectColorVideoFeed();
            } else if(currentlyOpenPage == KINECT_BODY_PAGE_NUM) {
                kinectBodyTrackingFeed();
            }
            isKinectOn = true;
        } else {
            //For debugging:
            //console.log('In function[btnKinectOn.addEventListener] the kinect is already on.');
        }
        
    });

    btnKinectOff.addEventListener("click", event => {
        if(isKinectOn) {
            shutOffKinect();
            isKinectOn = false;
        } else {
            //For debugging:
            //console.log('In function[btnKinectOff.addEventListener] the kinect is already off.');
        }
        
    });

} //End of handleWindowControls()

/**
 * Function that checks which windows are being closed out in order to call
 * the correct functions from their respective js files to close out running
 * device functionality before switching.
 * 
 * Also serves as the function that manipulates the webviewer!
 * 
 * Parameters:
 *      newPageNum -    Holds one of the global constant page values to 
 *                      determine what should be displayed or hidden.
 */
async function checkClosingWindowAndChangeContent(newPageNum) {
    //Check which window is closing; if changing to same as before, don't 
    //refresh
    if(currentlyOpenPage == newPageNum) {
        return;
    }

    //Manipulate webviewer to change for NEW window parameters.
    switch (newPageNum) {
        case HOME_PAGE_NUM:
            currentlyOpenPage = HOME_PAGE_NUM;
            changeWindowFeatures();
            break;

        case WEBCAM_PAGE_NUM:
            currentlyOpenPage = WEBCAM_PAGE_NUM;
            changeWindowFeatures("none","none", "none", "none", "block", "inline-block", "none", "none");
            if(isKinectOn) {   
                await shutOffKinect();
            }
            webcamStart();
            break;

        case KINECT_PAGE_NUM:
            currentlyOpenPage = KINECT_PAGE_NUM;
            changeWindowFeatures("block", "none", "none", "none", "none", "none", "inline-block", "inline-block");
            if(isKinectOn) {   
                await shutOffKinect();
                changeKinectParameters("fps30", "BGRA32", "res1080", "off", "nosync");
                startKinect();
                kinectColorVideoFeed(); 
            } else {
                changeKinectParameters("fps30", "BGRA32", "res1080", "off", "nosync");
                startKinect();
                kinectColorVideoFeed(); 
            }
            break;

        case KINECT_BODY_PAGE_NUM:
            currentlyOpenPage = KINECT_BODY_PAGE_NUM;
            changeWindowFeatures("none", "block", "block", "none", "none", "none", "inline-block", "inline-block");
            if(isKinectOn) { 
                await shutOffKinect();
                changeKinectParameters("fps30", "BGRA32", "res1080", "wfov2x2binned", "nosync");
                startKinect();
                kinectBodyTrackingFeed(); 
            } else {
                changeKinectParameters("fps30", "BGRA32", "res1080", "wfov2x2binned", "nosync");
                startKinect();
                kinectBodyTrackingFeed(); 
            }
            break;

        case ABOUT_PAGE_NUM:
            currentlyOpenPage = ABOUT_PAGE_NUM;
            changeWindowFeatures(); 
            break;

    }  //End of NEW page switch


}


/**
 * Changes certain aspects of the application based on the current "page" that 
 * the application is showing. 
 * 
 * Parameters:
 *      displayCanvasDisplay    -   video_canvas CSS display property 
 *      recordingButtonDisplay  -   record CSS display property 
 *      camVideoDisplay         -   webcam CSS display property 
 *      dropdownDisplay         -   dropdown CSS display property 
 *      kinectButtonOnDisplay   -   kinect on button CSS display property
 *      kinectButtonOffDisplay  -   kinect off button CSS display property
 */

function changeWindowFeatures(displayCanvasDisplay = "none",
                              displayCanvas2Display = "none",
                              displayCanvas3Display = "none",   
                              recordingButtonDisplay = "none",
                              camVideoDisplay = "none",
                              dropdownDisplay = "none",
                              kinectButtonOnDisplay = "none",
                              kinectButtonOffDisplay = "none") {
    displayCanvas.style.display = displayCanvasDisplay;     //Kinect Color Canvas Feed
    displayCanvas2.style.display = displayCanvas2Display;     //Kinect Body Color Canvas Feed
    displayCanvas3.style.display = displayCanvas3Display;     //Kinect Body Depth Canvas Feed
    recordingButton.style.display = recordingButtonDisplay; //Record Button 
    camVideo.style.display = camVideoDisplay;               //Webcam Video Feed
    dropdown.style.display = dropdownDisplay;               //DropDown Menu
    btnKinectOn.style.display = kinectButtonOnDisplay;      //On button kinect
    btnKinectOff.style.display = kinectButtonOffDisplay;    //Off button kinect
}



/**
 * Function that is called to make sure all devices are properly shut down 
 * before the application shuts down. 
 * Acts as an EventHandler for Node.
 */
global.onbeforeunload = () => {
    if(isKinectOn) {
        shutOffKinect();
        isKinectOn = false;
    } else {
        //The Kinect is already off and we can safely shut down the application.
        //For debugging:
        //console.log('In function[global.onbeforeunload] the kinect is already off.');
    }
}