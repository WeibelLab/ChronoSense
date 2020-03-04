const require = parent.require;
const KinectAzure = require('kinect-azure');
const kinect = new KinectAzure();  

//Alert to show it got passed requiring the kinect module
alert("WORKED");

const displayCanvas = document.getElementById('kinect_feed');
var outputCtx = displayCanvas.getContext('2d');

if(kinect.open()) {
    //If the kinect properly opens continue
    kinect.startCameras({
        camera_fps: KinectAzure.K4A_FRAMES_PER_SECOND_30,
        color_format: KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32 ,
        color_resolution: KinectAzure.K4A_COLOR_RESOLUTION_1080P
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

      const renderBGRA32ColorFrame = (canvas, canvasImageData, imageFrame) => {
        const newPixelData = Buffer.from(imageFrame.imageData);
        const pixelArray = canvasImageData.data;
        for (let i = 0; i < canvasImageData.data.length; i+=4) {
          pixelArray[i] = newPixelData[i+2];
          pixelArray[i+1] = newPixelData[i+1];
          pixelArray[i+2] = newPixelData[i];
          pixelArray[i+3] = 0xff;
        }
        canvas.putImageData(canvasImageData, 0, 0);
      };

}