const fs = require('fs');

/*
 * Description: File is used to display the joint and body data from the 
 *              Azure Kinect. 
 *
 */

function kinectBodyTrackingFeed() {
    //For debugging
    console.log("I have reached the start of kinectBodyTrackingFeed()");
    //Program does reach the above after waiting for sensor to stop listening 
    //but then freezes at some point below

    kinect.startListening((data) => {
      //Debugging: Currently does not 
      console.log("Started listening to data again");
      if (!outputImageData && data.colorImageFrame.width > 0) {
        displayCanvas.width = data.colorImageFrame.width;
        displayCanvas.height = data.colorImageFrame.height;
        outputImageData = outputCtx.createImageData(displayCanvas.width, displayCanvas.height);
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

function renderDepthFrameAsGreyScale(ctx, canvasImageData, imageFrame) {
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
}

function map (value, inputMin, inputMax, outputMin, outputMax) {
  return (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin) + outputMin;
}

function renderBGRA32ColorFrame(ctx, canvasImageData, imageFrame) {
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
 * Def: Function that scans for body updates periodically or whenever an update
 *      occurs and adds that to a file.
 * Parameters:
 *  skeleton - JSFrame.JSBodyFrame.JSBody[].JSSkeleton
 * 
 */
function readAndWriteJointData(skeleton) {
  //JSSkeleton has an array of joints stored in skeleton.joints[]
  //I'm going to first try writing to a JSON file with every joint separate 
  //and write them all at the same time as they come in.


}