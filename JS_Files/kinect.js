/*
 * Description: File is used to display the direct camera feed from the 
 *              Azure Kinect. 
 *
 */

function kinectColorVideoFeed() {
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