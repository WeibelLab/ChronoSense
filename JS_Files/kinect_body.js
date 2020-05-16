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
      //console.log("Started listening to data again");
      if (!outputImageData && data.colorImageFrame.width > 0 && data.depthImageFrame.width > 0) {
        displayCanvas.width = data.colorImageFrame.width;
        displayCanvas.height = data.colorImageFrame.height;
        displayCanvas2.width = data.depthImageFrame.width;
        displayCanvas2.height = data.depthImageFrame.height;
        outputImageData = outputCtx.createImageData(displayCanvas.width, displayCanvas.height);
        outputImageData2 = outputCtx2.createImageData(displayCanvas2.width, displayCanvas2.height);
      }
      if (outputImageData) {
        renderBGRA32ColorFrame(outputCtx, outputImageData, data.colorImageFrame);
      }
      if (outputImageData2) {
        renderDepthFrameAsGreyScale(outputCtx2, outputImageData2, data.depthImageFrame);
      }
      if (data.bodyFrame.bodies) {
        // render the skeleton joints on top of the color feed
        outputCtx.save();
        outputCtx2.save();
        outputCtx.fillStyle = 'red';
        outputCtx2.fillStyle = 'red';
        data.bodyFrame.bodies.forEach(body => {
          body.skeleton.joints.forEach(joint => {
            outputCtx.fillRect(joint.colorX, joint.colorY, 10, 10);
            outputCtx2.fillRect(joint.depthX, joint.depthY, 4, 4);
          });
        });
        outputCtx.restore();
        outputCtx2.restore();
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