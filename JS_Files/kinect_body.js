const KinectAzure = require('kinect-azure');
const kinect = new KinectAzure();  
const { ipcRenderer } = require('electron')


const outputCanvas = document.getElementById('kinect_feed');
const outputCtx = outputCanvas.getContext('2d');
let outputImageData, depthModeRange;

const init = () => {
  startKinect();
};

const startKinect = () => {
  if(kinect.open()) {

    kinect.startCameras({
      depth_mode: KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED,
      color_format: KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32,
      color_resolution: KinectAzure.K4A_COLOR_RESOLUTION_1080P,
      camera_fps: KinectAzure.K4A_FRAMES_PER_SECOND_30
    });
    depthModeRange = kinect.getDepthModeRange(KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED);
    kinect.createTracker();

    kinect.startListening((data) => {
      if (!outputImageData && data.colorImageFrame.width > 0) {
        outputCanvas.width = data.colorImageFrame.width;
        outputCanvas.height = data.colorImageFrame.height;
        outputImageData = outputCtx.createImageData(outputCanvas.width, outputCanvas.height);
      }
      if (outputImageData) {
        renderBGRA32ColorFrame(outputCtx, outputImageData, data.colorImageFrame);
      }
      if (data.bodyFrame.bodies) {
        // render the skeleton joints on top of the color feed
        outputCtx.save();
        outputCtx.fillStyle = 'red';
        data.bodyFrame.bodies.forEach(body => {
          body.skeleton.joints.forEach(joint => {
            outputCtx.fillRect(joint.colorX, joint.colorY, 10, 10);
          });
        });
        outputCtx.restore();
      }
    });
  }
};

const renderDepthFrameAsGreyScale = (ctx, canvasImageData, imageFrame) => {
  const newPixelData = Buffer.from(imageFrame.imageData);
  const pixelArray = canvasImageData.data;
  let depthPixelIndex = 0;
  for (let i = 0; i < canvasImageData.data.length; i+=4) {
    const depthValue = newPixelData[depthPixelIndex+1] << 8 | newPixelData[depthPixelIndex];
    const normalizedValue = map(depthValue, depthModeRange.min, depthModeRange.max, 255, 0);
    pixelArray[i] = normalizedValue;
    pixelArray[i+1] = normalizedValue;
    pixelArray[i+2] = normalizedValue;
    pixelArray[i+3] = 0xff;
    depthPixelIndex += 2;
  }
  ctx.putImageData(canvasImageData, 0, 0);
};

const map = (value, inputMin, inputMax, outputMin, outputMax) => {
  return (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin) + outputMin;
};

const renderBGRA32ColorFrame = (ctx, canvasImageData, imageFrame) => {
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
};

/**
 * Function to stop kinect and close out cameras
 * 
 */
async function stopKinect() {
  // stop kinect - use the await keyword to wait for the promise to resolve
  await kinect.stopListening();
  console.log("stopped listening");
  kinect.destroyTracker();
  console.log("destroyed tracking");
  kinect.stopCameras();
  console.log("stopped cameras");
}

ipcRenderer.on('stop-kinect', () => {
  stopKinect();
})


init();