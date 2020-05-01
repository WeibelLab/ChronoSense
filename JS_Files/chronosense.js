// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require('electron').remote;
const KinectAzure = require('kinect-azure');
const kinect = new KinectAzure();  

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
const displayCanvas = document.getElementById('video_canvas');
const outputCtx = displayCanvas.getContext('2d');
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

//Global variable to tell if Kinect is on or not.
var isKinectOn = false;

//List of all changeable parameters for Kinect sensor feed:
//Set in global scope for setting and retrieving and set to default 
CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_15;
ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_OFF;
ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_MJPG;
DepthMode = KinectAzure.K4A_DEPTH_MODE_OFF;
SyncMode = false;


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

/**
 * Handles all window controls from app specific minimization to page
 * navigation. Called above when the page is ready to be displayed.
 * 
 */
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
                //Keep set parameters function here for testing (temp):
                changeKinectParameters("fps30", "BGRA32", "res1080", "nfovunbinned", "nosync");
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
            depth_mode: DepthMode,
            color_format: ColorFormat,
            color_resolution: ColorResolution,
            camera_fps: CameraFPS,
            synchronized_images_only: SyncMode
        });
        
        depthModeRange = kinect.getDepthModeRange(DepthMode);
        kinect.createTracker();
    } else {
        //Opening up the kinect has failed, adjust for that error...

    }    
    //Debugging logs to the console:
    console.log("Camera FPS: " + CameraFPS); 
    console.log("Color Resolution: " + ColorResolution);
    console.log("Color Format: " + ColorFormat);  
    console.log("Depth Mode: " + DepthMode); 
    console.log("Sync Mode: " + SyncMode);

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
 *      displayCanvasDisplay    -   video_canvas CSS display property 
 *      recordingButtonDisplay  -   record CSS display property 
 *      camVideoDisplay         -   webcam CSS display property 
 *      dropdownDisplay         -   dropdown CSS display property 
 *      kinectButtonOnDisplay   -   kinect on button CSS display property
 *      kinectButtonOffDisplay  -   kinect off button CSS display property
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

/**
 * Function that allows the user to set the CAMERA FPS of the Kinect.
 * 
 * Paramters:
 *      a - string variable that dictates case to select and change kinect param
 *          {"fps5", "fps15", "fps30"}
 * 
 */
function setCameraFPS(a) {
    switch (a){
        case "fps5":
            CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_5;
            break;

        case "fps15":
            CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_15;
            break;

        case "fps30":
            CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_30;
            break;

        default:
            //Set default to 15 FPS

    }




}

/**
 * Function that allows the user to set the COLOR FORMAT of the Kinect.
 * 
 * Parameters:
 *      b - string variable that dictates case to select and change kinect param
 *          {"mjpg", "nv12", "yuy2", "BGRA32"}
 * 
 */
function setColorFormat(b) {
    switch (b){
        case "mjpg":
            ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_MJPG;
            break;

        case "nv12":
            ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_NV12;
            break;

        case "yuy2":
            ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_YUY2;
            break;

        case "BGRA32":
            ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32;
            break;

        default:
            ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_MJPG;

    }
    
    
}

/**
 * Function that allows the user to set the COLOR RESOLUTION of the Kinect.
 * 
 * Parameters:
 *      c - string variable that dictates case to select and change kinect param
 *          {"off", "res720", "res1080", "res1440", "res1536", "res2160",
 *           "res3072"}
 * 
 */
function setColorResolution(c) {
    switch (c){
        case "off":
            ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_OFF;
            break;

        case "res720":
            ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_720P;
            break;

        case "res1080":
            ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1080P;
            break;

        case "res1440":
            ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1440P;
            break;
        
        case "res1536":
            ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1536P;
            break;

        case "res2160":
            ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_2160P;
            break;

        case "res3072":
            ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_3072P;
            break;

        default:
            //Set default to 1080P
            ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1080P;

    }

    
}

/**
 * Function that allows the user to set the DEPTH mode of the Kinect.
 * 
 * Parameters:
 *      d - string variable that dictates case to select and change kinect param
 *          {"off", "nfov2x2binned", "nfovunbinned", "wfov2x2binned", 
 *           "wfovunbinned", "passive"}
 * 
 */
function setDepthMode(d) {
    switch (d){
        case "off":
            DepthMode = KinectAzure.K4A_DEPTH_MODE_OFF;
            break;

        case "nfov2x2binned":
            DepthMode = KinectAzure.K4A_DEPTH_MODE_NFOV_2X2BINNED
            break;

        case "nfovunbinned":
            DepthMode = KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED;
            break;

        case "wfov2x2binned":
            DepthMode = KinectAzure.K4A_DEPTH_MODE_WFOV_2X2BINNED;
            break;
        
        case "wfovunbinned":
            DepthMode = KinectAzure.K4A_DEPTH_MODE_WFOV_UNBINNED;
            break;

        case "passive":
            DepthMode = KinectAzure.K4A_DEPTH_MODE_PASSIVE_IR;
            break;

        default:
            //Set default to passive IR at 1024x1024
            DepthMode = KinectAzure.K4A_DEPTH_MODE_PASSIVE_IR;

    }

    
}

/**
 * Function that allows the user to only allow SYNCHRONIZED IMAGES only.
 * 
 * Parameters:
 *      e - string variable that dictates case to select and change kinect param
 *          {"sync", "nosync"}
 */
function setSyncMode(e) {
    switch (e){
        case "sync":
            SyncMode = true;
            break;

        case "nosync":
            SyncMode = false;
            break;

        default:
            //Set default to no synchronization
            SyncMode = false;
    }
    

}

/**
 * Condensed function that allows the above functions to be set in a single call
 * 
 * Parameters:
 *      fps     -   Camera FPS string [see setCameraFPS for details on passable 
 *                  strings]
 *      format  -   Color Format string [see setColorFormat for details on 
 *                  passable strings]
 *      res     -   Color Resolution string [see setColorResolution for details  
 *                  on passable strings]
 *      depth   -   Depth Mode string [see setDepthMode for details on passable 
 *                  strings]
 *      sync    -   Sync Mode string [see setSyncMode for details on passable 
 *                  strings]
 */
function changeKinectParameters(fps, format, res, depth, sync){
    setCameraFPS(fps);
    setColorFormat(format);
    setColorResolution(res);
    setDepthMode(depth);
    setSyncMode(sync);
}