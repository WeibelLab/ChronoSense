
/*
 * Description: File is used to display the direct camera feed from the 
 *              Azure Kinect. 
 *
 */
import { JointWriter } from "./jointwriter.js";
const KinectAzure = require('kinect-azure');  

export class Kinect {
    #kinectDevice;
    #displayCanvas;
    #displayCanvas2;
    #displayCanvas3;
    #outputCtx;
    #outputCtx2;
    #outputCtx3;
    #isKinectOn = false;
    #isKinectOpen = false;
    #isKinectCamerasStarted = false;
    #isKinectListening = false;
    #isKinectStreaming = false;
    #depthModeRange;
    #jointWriter;

    //List of all changeable parameters for Kinect sensor feed:
    #CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_30;
    #ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1080P;
    #ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32;
    #DepthMode = KinectAzure.K4A_DEPTH_MODE_OFF;
    #SyncMode = false;

    constructor(displayCanvas, displayCanvas2, displayCanvas3) {
        this.#kinectDevice = new KinectAzure();
        this.#jointWriter = new JointWriter();
        this.#displayCanvas = displayCanvas;
        this.#displayCanvas2 = displayCanvas2;
        this.#displayCanvas3 = displayCanvas3;
        this.#outputCtx = displayCanvas.getContext('2d');
        this.#outputCtx2 = displayCanvas2.getContext('2d');
        this.#outputCtx3 = displayCanvas3.getContext('2d');
    }

    /**
    * Function starts the Kinect cameras with the set parameters. By default it
    * uses the parameters below; they can be changed later through UI options in 
    * the application [in progress].
    * 
    */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async start() {
        // Artifical delay to wait for MediaStreams to close (just in case)
        await this.sleep(2000);
        
        //First check if device is open
        if(!this.#isKinectOpen) {
            //Not open, so open
            let openValue = this.#kinectDevice.open();
            console.log('Boolean returned from kinect.open(): ' + openValue);
            this.#isKinectOpen = true;
            console.log('Opened Kinect');

        }


        //Second check if cameras have been started
        if(!this.#isKinectCamerasStarted) {
            this.#kinectDevice.startCameras({
                camera_fps: this.#CameraFPS,
                color_format: this.#ColorFormat,
                color_resolution: this.#ColorResolution,
                depth_mode: this.#DepthMode,
                synchronized_images_only: this.#SyncMode
            });

            this.#isKinectCamerasStarted = true;
            console.log('Started Cameras on Kinect');
        }

        //Third check if depthmode != 0 
        if(this.#DepthMode != KinectAzure.K4A_DEPTH_MODE_OFF) {
            this.#depthModeRange = this.#kinectDevice.getDepthModeRange(
                                                            this.#DepthMode);
            this.#kinectDevice.createTracker();

            console.log('Started Body Tracking');


        }

    } //End of startKinect()

    /* Get isListening data for error checking */
    getIsStreaming() {
        return this.#isKinectStreaming;
    }

    /**
    * Turns off the Kinect fully if it is currently on. This is a much easier way
    * to change the type of data you are collecting BUT it sacrifices time and 
    * efficiency for ease of use. 
    * 
    * NOTE: Look into creating additional function to stop listening and allow 
    *       quick setting change or transition to capture a different data stream.
    */
    async shutOff() {
        //First check if the Kinect is on before allowing it to be shut off.
        //if(this.#isKinectOn) {
        let stoppedListening;
        console.log('Inside shutOff beginning');
        if(this.#isKinectListening) {
            stoppedListening = await this.#kinectDevice.stopListening();
            this.#isKinectListening = false;

            if(this.#DepthMode != KinectAzure.K4A_DEPTH_MODE_OFF) {
                this.#jointWriter.closeWrittenFile();
                this.#kinectDevice.destroyTracker();
                console.log('Body Tracker Destroyed');
    
            }

        }

        if(this.#isKinectCamerasStarted) {
            await this.#kinectDevice.stopCameras();
            this.#isKinectCamerasStarted = false;
        }

        if(this.#isKinectOpen) {
            await this.#kinectDevice.close();
            this.#isKinectOpen = false;


        }
            
        return stoppedListening;
        //}
    }

    /**
    * CURRENTLY WORKING
    * 
    * Function will be used to transition between capturing different data streams
    * from the kinect (e.g. RGB -> body tracking) without to completely shut off
    * the Kinect; saving time and resources.
    * 
    */
    async stopListeningAndCameras() {
        if(this.#isKinectListening) {
            let kinectStoppedlistening = await this.#kinectDevice.stopListening();
            this.#isKinectListening = false;
            this.#isKinectStreaming = false;
            this.#kinectDevice.stopCameras();
            this.#isKinectCamerasStarted = false;
            console.log('Cameras Stopped and Listening Stopped');

            if(this.#DepthMode != KinectAzure.K4A_DEPTH_MODE_OFF) {
                this.#jointWriter.closeWrittenFile();
                this.#kinectDevice.destroyTracker();
                console.log('Body Tracker Destroyed');
    
            }

            return kinectStoppedlistening;
        
        }
        console.log('Cameras and Listening ALREADY off');
    }


    /* The color (RGB) video feed of the Azure Kinect is output to a display
       canvas */
    colorVideoFeed() {
        //First check if the Kinect is already running and don't start if it is:
        //if(this.#isKinectOn) {
            //console.log('ColorFeed() START');
            this.#isKinectListening = true;
            this.#kinectDevice.startListening((data) => {
                //Currently doesn't reach here when going between pages... BUG
                //console.log('Color listening for data...');
                var outputImageData = null;
                this.#isKinectStreaming = true;
                if (!outputImageData && data.colorImageFrame.width > 0) {
                    //console.log("START RENDER REACHED");
                    this.#displayCanvas.width = data.colorImageFrame.width;
                    this.#displayCanvas.height = data.colorImageFrame.height;
                    outputImageData = this.#outputCtx.createImageData(
                                                      this.#displayCanvas.width, 
                                                      this.#displayCanvas.height);
                }
          
                if (outputImageData) {
                    this.renderBGRA32ColorFrame(this.#outputCtx, 
                                                outputImageData, 
                                                data.colorImageFrame);
                } 
            });

        //}
    }
    

    /* Function used to render data retrieved from Kinect to the canvas */
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
    *      a - string variable that dictates selection and change kinect param
    *          {"fps5", "fps15", "fps30"}
    * 
    */
    setCameraFPS(a) {
        switch (a){
            case "fps5":
                this.#CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_5;
                break;

            case "fps15":
                this.#CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_15;
                break;

            case "fps30":
                this.#CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_30;
                break;

            default:
                this.#CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_15;

        }
    }


    /**
    * Function that allows the user to set the COLOR FORMAT of the Kinect.
    * 
    * Parameters:
    *      b - string variable that dictates selection and change kinect param
    *          {"mjpg", "nv12", "yuy2", "BGRA32"}
    * 
    */
    setColorFormat(b) {
        switch (b){
            case "mjpg":
                this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_MJPG;
                break;

            case "nv12":
                this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_NV12;
                break;

            case "yuy2":
                this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_YUY2;
                break;

            case "BGRA32":
                this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32;
                break;

            default:
                this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_MJPG;

        }
    }


    /**
     * Function that allows the user to set the COLOR RESOLUTION of the Kinect.
     * 
     * Parameters:
     *      c - string variable that dictates selection and change kinect param
     *          {"off", "res720", "res1080", "res1440", "res1536", "res2160",
     *           "res3072"}
     * 
     */
    setColorResolution(c) {
        switch (c){
            case "off":
                this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_OFF;
                break;

            case "res720":
                this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_720P;
                break;

            case "res1080":
                this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1080P;
                break;

            case "res1440":
                this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1440P;
                break;
        
            case "res1536":
                this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1536P;
                break;

            case "res2160":
                this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_2160P;
                break;

            case "res3072":
                this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_3072P;
                break;

            default:
                //Set default to 1080P
                this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1080P;

        }
    }


    /**
     * Function that allows the user to set the DEPTH mode of the Kinect.
     * 
     * Parameters:
     *      d - string variable that dictates selection and change kinect param
     *          {"off", "nfov2x2binned", "nfovunbinned", "wfov2x2binned", 
     *           "wfovunbinned", "passive"}
     * 
     */
    setDepthMode(d) {
        switch (d){
            case "off":
                this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_OFF;
                break;

            case "nfov2x2binned":
                this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_NFOV_2X2BINNED
                break;

            case "nfovunbinned":
                this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED;
                break;

            case "wfov2x2binned":
                this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_WFOV_2X2BINNED;
                break;
        
            case "wfovunbinned":
                this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_WFOV_UNBINNED;
                break;

            case "passive":
                this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_PASSIVE_IR;
                break;

            default:
                //Set default to passive IR at 1024x1024
                this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_PASSIVE_IR;

        }
    }


    /**
     * Function that allows the user to only allow SYNCHRONIZED IMAGES only.
     * 
     * Parameters:
     *      e - string variable that dictates cselection and change kinect param
     *          {"sync", "nosync"}
     */
    setSyncMode(e) {
        switch (e){
            case "sync":
                this.#SyncMode = true;
                break;

            case "nosync":
                this.#SyncMode = false;
                break;

            default:
                //Set default to no synchronization
                this.#SyncMode = false;
        }
    }


    /**
     * Condensed function that allows the above functions to be set in one call
     * 
     * Parameters:
     *      fps     -   Camera FPS string [see setCameraFPS for details on 
     *                  passable strings]
     *      format  -   Color Format string [see setColorFormat for details on 
     *                  passable strings]
     *      res     -   Color Resolution string [see setColorResolution for 
     *                  details on passable strings]
     *      depth   -   Depth Mode string [see setDepthMode for details on 
     *                  passable strings]
     *      sync    -   Sync Mode string [see setSyncMode for details on 
     *                  passable strings]
     */
    changeParameters(fps, format, res, depth, sync){
        this.setCameraFPS(fps);
        this.setColorFormat(format);
        this.setColorResolution(res);
        this.setDepthMode(depth);
        this.setSyncMode(sync);
    }


    /* Takes in the video and depth data to show image with overlayed joints */
    bodyTrackingFeed() {
        //console.log("Reached the start of BodyTrackingFeed()");
        //First check if the Kinect is already running and don't start if it is:
        //if(this.#isKinectOn) {
            this.#isKinectListening = true;
            this.#kinectDevice.startListening((data) => {
              //Debugging
              //console.log("Listening for Body Data");
              var outputImageData2 = null;
              var outputImageData3 = null;
              if (!outputImageData2 && data.colorImageFrame.width > 0) {
                this.#displayCanvas2.width = data.colorImageFrame.width;
                this.#displayCanvas2.height = data.colorImageFrame.height;
                outputImageData2 = this.#outputCtx2.createImageData(
                                                    this.#displayCanvas2.width, 
                                                    this.#displayCanvas2.height);
              }
          
              if (!outputImageData3 && data.depthImageFrame.width > 0) {
                this.#displayCanvas3.width = data.depthImageFrame.width;
                this.#displayCanvas3.height = data.depthImageFrame.height;
                outputImageData3 = this.#outputCtx3.createImageData(
                                                    this.#displayCanvas3.width, 
                                                    this.#displayCanvas3.height);
              }
          
              if (outputImageData2) {
                this.renderBGRA32ColorFrame(this.#outputCtx2, outputImageData2, 
                                            data.colorImageFrame);
              }
              if (outputImageData3) {
                this.renderDepthFrameAsGreyScale(this.#outputCtx3, 
                                                 outputImageData3, 
                                                 data.depthImageFrame);
              }
              if (data.bodyFrame.bodies) {
                // render the skeleton joints on top of the color feed
                this.#outputCtx2.save();
                this.#outputCtx3.save();
                this.#outputCtx2.fillStyle = 'red';
                this.#outputCtx3.fillStyle = 'red';
                data.bodyFrame.bodies.forEach(body => {
                    //TEST: For each body, write joint data to CSV
                    //Gets here when I come back to the body tracking after leaving
                    //But doesnt get past writeToFile()...
                    //console.log('BEFORE writing to file');
                    this.#jointWriter.writeToFile(body.skeleton);
                    //console.log('AFTER writing to file');
                    body.skeleton.joints.forEach(joint => {
                        this.#outputCtx2.fillRect(joint.colorX, joint.colorY, 
                                              10, 10);
                        this.#outputCtx3.fillRect(joint.depthX, joint.depthY, 4, 4);
                    });
                });
                this.#outputCtx2.restore();
                this.#outputCtx3.restore();
              }
            });
        //}
    }
    

    /* Render the DepthFrame image as grey scale on canvas */
    renderDepthFrameAsGreyScale(ctx, canvasImageData, imageFrame) {
      const newPixelData = Buffer.from(imageFrame.imageData);
      const pixelArray = canvasImageData.data;
      var depthPixelIndex = 0;
      for (var i = 0; i < canvasImageData.data.length; i+=4) {
        const depthValue = newPixelData[depthPixelIndex+1] << 8 | 
                                        newPixelData[depthPixelIndex];
        const normalizedValue = this.map(depthValue, this.#depthModeRange.min, 
                                         this.#depthModeRange.max, 255, 0);
        pixelArray[i] = normalizedValue;
        pixelArray[i+1] = normalizedValue;
        pixelArray[i+2] = normalizedValue;
        pixelArray[i+3] = 0xff;
        depthPixelIndex += 2;
      }
      ctx.putImageData(canvasImageData, 0, 0);
    }
    

    /* Change the values on depth to map within the maximum and minimum dist*/
    map (value, inputMin, inputMax, outputMin, outputMax) {
      return (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin) + outputMin;
    }

}  //End of Kinect class