// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require('electron').remote;
import {Kinect} from './kinect.js';
import {Webcam} from './webcam.js';

//Variables of HTML elements for later manipulation 
const viewerWindow = document.getElementById('content-selection');
const btnHome = document.getElementById('homePage');
const btnWebcam = document.getElementById('webcamPage');
const btnKinect = document.getElementById('kinectPage');
const btnKinectBodyTracking = document.getElementById('kinectBodyPage');
const btnAbout = document.getElementById('aboutPage');
const btnKinectOn = document.getElementById('kinect_on');
const btnKinectOff = document.getElementById('kinect_off');
const btnMirrorImage = document.getElementById('mirrorcheck');
const lblMirrorImage = document.getElementById('mirrorlabel');

//Used in Kinect Class for displaying content
//Send through constructor to Kinect class object
const displayCanvas = document.getElementById('video_canvas');  
const displayCanvas2 = document.getElementById('video_canvas2');
const displayCanvas3 = document.getElementById('video_canvas3');

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

//Variable for the open KinectDevice & webcam
const kinect = new Kinect(displayCanvas, displayCanvas2, displayCanvas3);  //Later have dedicated button
const webcam = new Webcam(recordingButton, camVideo, dropdown);      //Later have dedicated button


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
        //If no kinect object, create one
        if(kinect == null) {
            //kinect = new Kinect(displayCanvas, displayCanvas2, displayCanvas3);

        }
        kinect.start();  //Start the Kinect 
        if(currentlyOpenPage == KINECT_PAGE_NUM) {
            kinect.colorVideoFeed();
        } else if(currentlyOpenPage == KINECT_BODY_PAGE_NUM) {
            kinect.bodyTrackingFeed();
        }
    });

    btnKinectOff.addEventListener("click", event => {
        kinect.stopListeningAndCameras();
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
            webcam.stopMediaStream();
            await kinect.stopListeningAndCameras();
            break;

        case WEBCAM_PAGE_NUM:
            currentlyOpenPage = WEBCAM_PAGE_NUM;
            changeWindowFeatures("none","none", "none", "inline-block", "block", "inline-block", "none", "none", "inline-block");
            await kinect.stopListeningAndCameras();
            await webcam.init();
            await webcam.ready();
            break;

        case KINECT_PAGE_NUM:
            currentlyOpenPage = KINECT_PAGE_NUM;
            changeWindowFeatures("block", "none", "none", "none", "none", "none", "inline-block", "inline-block", "inline-block");

            //BUG: When changing from Webcam feed to Kinect Color feed,
            //     the Kinect is turns on and "listens" but no data comes
            //     through on the display OR within the function (look at 
            //      console statements to see this).
            
            webcam.stopMediaStream();

            await kinect.stopListeningAndCameras();
            kinect.changeParameters("fps30", "BGRA32", "res1080", "off", "nosync");
            await kinect.start();
            kinect.colorVideoFeed();
            /* Attempt some sort of check or cycle to restart
            // until the port is open.
            while(!kinect.getIsStreaming()){
                await kinect.stopListeningAndCameras();
                kinect.start();
                kinect.colorVideoFeed();
            }
            */
            
            break;

        case KINECT_BODY_PAGE_NUM:
            currentlyOpenPage = KINECT_BODY_PAGE_NUM;
            changeWindowFeatures("none", "block", "block", "none", "none", "none", "inline-block", "inline-block", "inline-block");

            //BUG: same as color Kinect above
            webcam.stopMediaStream();
            await kinect.stopListeningAndCameras();
            kinect.changeParameters("fps30", "BGRA32", "res1080", "wfov2x2binned", "nosync");
            await kinect.start();
            kinect.bodyTrackingFeed(); 

            break;

        case ABOUT_PAGE_NUM:
            currentlyOpenPage = ABOUT_PAGE_NUM;
            changeWindowFeatures(); 
            webcam.stopMediaStream();
            await kinect.stopListeningAndCameras();
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
                              kinectButtonOffDisplay = "none",
                              mirrorButtonDisplay = "none") {
    displayCanvas.style.display = displayCanvasDisplay;     //Kinect Color Canvas Feed
    displayCanvas2.style.display = displayCanvas2Display;     //Kinect Body Color Canvas Feed
    displayCanvas3.style.display = displayCanvas3Display;     //Kinect Body Depth Canvas Feed
    recordingButton.style.display = recordingButtonDisplay; //Record Button 
    camVideo.style.display = camVideoDisplay;               //Webcam Video Feed
    dropdown.style.display = dropdownDisplay;               //DropDown Menu
    btnKinectOn.style.display = kinectButtonOnDisplay;      //On button kinect
    btnKinectOff.style.display = kinectButtonOffDisplay;    //Off button kinect
    btnMirrorImage.style.display = mirrorButtonDisplay;     //Display mirror btn
    lblMirrorImage.style.display = mirrorButtonDisplay;     //Label for btn ^
}



/**
 * Function that is called to make sure all devices are properly shut down 
 * before the application shuts down. 
 * Acts as an EventHandler for Node.
 */
global.onbeforeunload = () => {
    kinect.shutOff();


}