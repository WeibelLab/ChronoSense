/*
 * Description: File is used to display the direct camera feed from the 
 *              Azure Kinect. 
 *
 */
const KinectAzure = require('kinect-azure');  

export class Kinect {
    kinectDevice = new KinectAzure();
    displayCanvas;
    outputCtx;
    isKinectOn = false;

    //List of all changeable parameters for Kinect sensor feed:
    CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_15;
    ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_OFF;
    ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_MJPG;
    DepthMode = KinectAzure.K4A_DEPTH_MODE_OFF;
    SyncMode = false;

    constructor(displayCanvas, outputCtx) {
        this.displayCanvas = displayCanvas;
        outputCtx = displayCanvas.getContext('2d');

    }

    /**
    * Function starts the connect cameras with the set parameters. By default it
    * uses the parameters below; they can be changed later through UI options in 
    * the application [in progress].
    * 
    */
    async startKinect() {
        console.log(DepthMode);
        if(kinect.open()) {
            kinect.startCameras({
                depth_mode: DepthMode,
                color_format: ColorFormat,
                color_resolution: ColorResolution,
                camera_fps: CameraFPS,
                synchronized_images_only: SyncMode
            });
        
            if(DepthMode != 0){ // if depthMode is not "off"
                depthModeRange = kinect.getDepthModeRange(DepthMode);
                kinect.createTracker();
            }
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
    * Turns off the Kinect fully if it is currently on. This is a much easier way
    * to change the type of data you are collecting BUT it sacrifices time and 
    * efficiency for ease of use. 
    * 
    * NOTE: Look into creating additional function to stop listening and allow 
    *       quick setting change or transition to capture a different data stream.
    */
    async shutOffKinect() {
        //First check if the Kinect is on before allowing it to be shut off.
        let kinectShutOff = await kinect.stopListening();
        kinect.stopCameras();
        kinect.close();
        isKinectOn = false;
        return kinectShutOff;
    }

    /**
    * CURRENTLY NOT WORKING!
    * 
    * Function will be used to transition between capturing different data streams
    * from the kinect (e.g. RGB -> body tracking) without to completely shut off
    * the Kinect; saving time and resources.
    * 
    */
    async stopKinectListener() {
        let kinectStoppedlistening = await kinect.stopListening();
        return kinectStoppedlistening;
    }

    kinectColorVideoFeed() {
        console.log("Inside kinectColorVideoFeed"); //I reach here on second start
      
        kinect.startListening((data) => {
            outputImageData = null;
            if (!outputImageData && data.colorImageFrame.width > 0) {
                console.log("START RENDER REACHED")
                displayCanvas.width = data.colorImageFrame.width;
                displayCanvas.height = data.colorImageFrame.height;
                outputImageData = outputCtx.createImageData(displayCanvas.width, displayCanvas.height);
            }
      
            if (outputImageData) {
                renderBGRA32ColorFrame(outputCtx, outputImageData, data.colorImageFrame);
            }
        });
    }
      
    renderBGRA32ColorFrame(ctx, canvasImageData, imageFrame) {
        //console.log("Start of renderBGRA32ColorFrame() reached");
        const newPixelData = Buffer.from(imageFrame.imageData);
        const pixelArray = canvasImageData.data;
        for (let i = 0; i < canvasImageData.data.length; i+=4) {
            pixelArray[i] = newPixelData[i+2];
            pixelArray[i+1] = newPixelData[i+1];
            pixelArray[i+2] = newPixelData[i];
            pixelArray[i+3] = 0xff;
        }
        ctx.putImageData(canvasImageData, 0, 0);
    }


    /**
    * Function that allows the user to set the CAMERA FPS of the Kinect.
    * 
    * Paramters:
    *      a - string variable that dictates case to select and change kinect param
    *          {"fps5", "fps15", "fps30"}
    * 
    */
    setCameraFPS(a) {
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
    setColorFormat(b) {
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
    setColorResolution(c) {
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
    setDepthMode(d) {
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
    setSyncMode(e) {
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
    changeKinectParameters(fps, format, res, depth, sync){
        setCameraFPS(fps);
        setColorFormat(format);
        setColorResolution(res);
        setDepthMode(depth);
        setSyncMode(sync);
    }


}  //End of Kinect class