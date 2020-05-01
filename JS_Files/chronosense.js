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
const btnKinectOn = document.getElementById('kinect_on');
const btnKinectOff = document.getElementById('kinect_off');

//Used in Kinect JS files for displaying content
const displayCanvas = document.getElementById('video_canvas');
const outputCtx = displayCanvas.getContext('2d');
let outputImageData, depthModeRange;

//Used in webcam methods
const recordingButton = document.getElementById('record');
const camVideo = document.getElementById('webcam');
const dropdown = document.getElementById('dropdown');

const HOME_PAGE_NUM = 0;
const WEBCAM_PAGE_NUM = 1;
const KINECT_PAGE_NUM = 2;
const KINECT_BODY_PAGE_NUM = 3;
const ABOUT_PAGE_NUM = 4;

var isKinectOn = false;

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

    /*
    * Add events below to buttons and items within "pages."
    */
    btnKinectOn.addEventListener("click", event => {
        startKinect();
        if(currentlyOpenPage == KINECT_PAGE_NUM) {
            kinectColorVideoFeed();
        } else if(currentlyOpenPage == KINECT_BODY_PAGE_NUM) {
            kinectBodyTrackingFeed();

        }
    });

    btnKinectOff.addEventListener("click", event => {
        shutOffKinect();
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

    //Manipulate webviewer to change for NEW window parameters.
    switch (newPageNum) {
        case HOME_PAGE_NUM:
            currentlyOpenPage = HOME_PAGE_NUM;
            changeWindowFeatures();
            break;

        case WEBCAM_PAGE_NUM:
            currentlyOpenPage = WEBCAM_PAGE_NUM;
            changeWindowFeatures("none", "block", "inline-block", "block");
            webcamStart();
            break;

        case KINECT_PAGE_NUM:
            currentlyOpenPage = KINECT_PAGE_NUM;
            changeWindowFeatures("block", "none", "none", "none", "inline-block", "inline-block");

            if(isKinectOn) {   
                shutOffKinect();
                /*console.log("Successfully Stopped Kinect");
                startKinect();
                console.log("Successfully Started Kinect");
                kinectColorVideoFeed(); */
            } else {
                startKinect();
                kinectColorVideoFeed(); 
            }
            break;

        case KINECT_BODY_PAGE_NUM:
            currentlyOpenPage = KINECT_BODY_PAGE_NUM;
            changeWindowFeatures("block", "none", "none", "none", "inline-block", "inline-block");
            if(isKinectOn) {
                //promise.finally(kinectBodyTrackingFeed());  
                //kinect.stopListening().then(kinectBodyTrackingFeed());  
                shutOffKinect();
                
            } else {
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

//////////////////////////////////////////////
////  Start of Kinect specific functions  ////
////                                      ////
////                                      ////
//////////////////////////////////////////////

/**
 * Function starts the connect cameras with the set parameters. By default it
 * uses the parameters below; they can be changed later through UI options in 
 * the application [in progress].
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

    isKinectOn = true;
} //End of startKinect()

/**
 * CURRENTLY NOT WORKING!
 * 
 * Function will be used to transition between capturing different data streams
 * from the kinect (e.g. RGB -> body tracking) without to completely shut off
 * the Kinect; saving time and resources.
 * 
 */
function stopKinectListener() {
    kinect.stopListening();

}

/**
 * Turns off the Kinect fully if it is currently on. This is a much easier way
 * to change the type of data you are collecting BUT it sacrifices time and 
 * efficiency for ease of use. 
 * 
 * NOTE: Look into creating additional function to stop listening and allow 
 *       quick setting change or transition to capture a different data stream.
 */
function shutOffKinect() {
    //First check if the Kinect is on before allowing it to be shut off.
    kinect.stopListening();
    kinect.stopCameras();
    kinect.close();
    isKinectOn = false;

}


/**
 * Changes certain aspects of the application based on the current "page" that 
 * the application is showing. 
 * 
 * Parameters:
 *      displayCanvasDisplay    - video_canvas CSS display property 
 *      recordingButtonDisplay  - record CSS display property 
 *      camVideoDisplay         - webcam CSS display property 
 *      dropdownDisplay         - dropdown CSS display property 
 *      kinectButtonOnDisplay   - kinect on button CSS display property
 *      kinectButtonOffDisplay   - kinect off button CSS display property
 */

function changeWindowFeatures(displayCanvasDisplay = "none", 
                              recordingButtonDisplay = "none",
                              camVideoDisplay = "none",
                              dropdownDisplay = "none",
                              kinectButtonOnDisplay = "none",
                              kinectButtonOffDisplay = "none") {
    displayCanvas.style.display = displayCanvasDisplay;     //Video Canvas Feed
    recordingButton.style.display = recordingButtonDisplay; //Record Button 
    camVideo.style.display = camVideoDisplay;               //Webcam Video Feed
    dropdown.style.display = dropdownDisplay;               //DropDown Menu
    btnKinectOn.style.display = kinectButtonOnDisplay;      //On button kinect
    btnKinectOff.style.display = kinectButtonOffDisplay;    //Off button kinect
}