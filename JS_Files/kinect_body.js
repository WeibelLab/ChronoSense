console.log("Before require")
const KinectAzure = require('kinect-azure');
const kinect = new KinectAzure();  

const outputCanvas = document.getElementById('kinect_feed');
const outputCtx = outputCanvas.getContext('2d');
let outputImageData, depthModeRange;

const init = () => {
    console.log("init called");
    startKinect();
    console.log('AFTER START');
    //stopKinect();
};

const startKinect = () => {
  if(kinect.open()) {

    kinect.startCameras({
      depth_mode: KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED
    });
    depthModeRange = kinect.getDepthModeRange(KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED);
    kinect.createTracker();

    kinect.startListening((data) => {
      if (!outputImageData && data.depthImageFrame.width > 0) {
        outputCanvas.width = data.depthImageFrame.width;
        outputCanvas.height = data.depthImageFrame.height;
        outputImageData = outputCtx.createImageData(outputCanvas.width, outputCanvas.height);
      }
      if (outputImageData) {
        renderDepthFrameAsGreyScale(outputCtx, outputImageData, data.depthImageFrame);
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
  console.log("RENDERING"); //Doesnt Reach Here
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

window.kinect = kinect;
init();