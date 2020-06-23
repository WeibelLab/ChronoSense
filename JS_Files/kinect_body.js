
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
      var outputImageData2 = null;
      if (!outputImageData2 && data.colorImageFrame.width > 0) {
        displayCanvas2.width = data.colorImageFrame.width;
        displayCanvas2.height = data.colorImageFrame.height;
        outputImageData2 = outputCtx2.createImageData(displayCanvas2.width, displayCanvas2.height);
      }

      var outputImageData3 = null;
      if (!outputImageData3 && data.depthImageFrame.width > 0) {
        displayCanvas3.width = data.depthImageFrame.width;
        displayCanvas3.height = data.depthImageFrame.height;
        outputImageData3 = outputCtx3.createImageData(displayCanvas3.width, displayCanvas3.height);
      }

      if (outputImageData2) {
        renderBGRA32ColorFrame(outputCtx2, outputImageData2, data.colorImageFrame);
      }
      if (outputImageData3) {
        renderDepthFrameAsGreyScale(outputCtx3, outputImageData3, data.depthImageFrame);
      }
      if (data.bodyFrame.bodies) {
        // render the skeleton joints on top of the color feed
        outputCtx2.save();
        outputCtx3.save();
        outputCtx2.fillStyle = 'red';
        outputCtx3.fillStyle = 'red';
        data.bodyFrame.bodies.forEach(body => {
          body.skeleton.joints.forEach(joint => {
            //console.log('Joint ' + joint.index + ': X = ' + joint.colorX + ' Y = ' + joint.colorY);
            //Add joint to the JSON file:
            //readAndWriteJointData(joint, joint.index);
            outputCtx2.fillRect(joint.colorX, joint.colorY, 10, 10);
            outputCtx3.fillRect(joint.depthX, joint.depthY, 4, 4);
          });
        });
        outputCtx2.restore();
        outputCtx3.restore();
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

/**
 * Def: Function that scans for body updates periodically or whenever an update
 *      occurs and adds that to a file.
 * Parameters:
 *  skeleton - JSFrame.JSBodyFrame.JSBody[].JSSkeleton
 * 
 */
function readAndWriteJointData(joint, index) {
  //JSSkeleton has an array of joints stored in skeleton.joints[]
  //I'm going to first try writing to a JSON file with every joint separate 
  //and write them all at the same time as they come in.
  //First try: No memory management, keep holding and then write to file (test)
  console.log('Reached joint write');
  jArrX.append(joint.colorX);
  for(let i=0; i < jArrX.length; i++) {
    console.log(jArrX[i] + ', ');
  }
  console.log('\n');


}