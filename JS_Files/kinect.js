console.log("Just entered kinect.js");
const KinectAzure = require('../kinect-azure/');
const kinect = new KinectAzure();

console.log("Finished getting KinectAzure");

const displayCanvas = document.getElementById('kinect_feed');
const outputCtx = displayCanvas.getContext('2d');
let outputImageData;

const init = () => {
  startKinect();
};

const startKinect = () => {
  console.log("startKinect() called ");
  var kinect_status = kinect.open(); //this doesn't work like we thought (always returns true)
  console.log(kinect_status);
  if(kinect_status) {
    kinect.startCameras({
      color_format: KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32,
      color_resolution: KinectAzure.K4A_COLOR_RESOLUTION_1080P,
      camera_fps: KinectAzure.K4A_FRAMES_PER_SECOND_30
    });

    kinect.startListening((data) => {
      if (!outputImageData && data.colorImageFrame.width > 0) {
        displayCanvas.width = data.colorImageFrame.width;
        displayCanvas.height = data.colorImageFrame.height;
        outputImageData = outputCtx.createImageData(displayCanvas.width, displayCanvas.height);
      }

      if (outputImageData) {
        renderBGRA32ColorFrame(outputCtx, outputImageData, data.colorImageFrame);
      }
    });
  }
};

const renderBGRA32ColorFrame = (ctx, canvasImageData, imageFrame) => {
  console.log("Start of renderBGRA32ColorFrame() reached");
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

init();