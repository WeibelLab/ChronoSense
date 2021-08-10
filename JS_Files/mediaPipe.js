import * as plugin from "./plugin.js"

export function startMediaPipe(device,feature) {
  var videoElement = plugin.get_stream(device);
  const canvasElement = create_UI(device);
  const canvasCtx = canvasElement.getContext('2d');


  if (feature == 'Hollistic') {
    function onResults(results) {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
          results.image, 0, 0, canvasElement.width, canvasElement.height);
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                    {color: '#00FF00', lineWidth: 4});
      drawLandmarks(canvasCtx, results.poseLandmarks,
                    {color: '#FF0000', lineWidth: 2});
      drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
                    {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
                    {color: '#CC0000', lineWidth: 5});
      drawLandmarks(canvasCtx, results.leftHandLandmarks,
                    {color: '#00FF00', lineWidth: 2});
      drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
                    {color: '#00CC00', lineWidth: 5});
      drawLandmarks(canvasCtx, results.rightHandLandmarks,
                    {color: '#FF0000', lineWidth: 2});
      canvasCtx.restore();
    }
    
    const holistic = new Holistic({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
    }});
    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    holistic.onResults(onResults);
    
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await holistic.send({image: videoElement});
      },
      width: 1280,
      height: 720
    });
    camera.start();
  }
  else if (feature == 'Hand') {
    function onResults(results) {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
          results.image, 0, 0, canvasElement.width, canvasElement.height);
      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                         {color: '#00FF00', lineWidth: 5});
          drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
        }
      }
      canvasCtx.restore();
    }
    
    const hands = new Hands({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    hands.setOptions({
      maxNumHands: 2,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    hands.onResults(onResults);
    
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({image: videoElement});
      },
      width: 1280,
      height: 720
    });
    camera.start();
  }
}

function create_UI(device) {
  var deviceId = plugin.get_device(device);
  var deviceElement = document.getElementById(deviceId);
  // Checking whether or not device created a mediapipe canvas
  if (deviceElement.lastChild.id == 'mediapipe-canvas') {
    deviceElement.removeChild(deviceElement.lastChild);
  }
  let mediapipeContainer = document.createElement('canvas');
  mediapipeContainer.classList.add("camera-canvas");
  mediapipeContainer.id = 'mediapipe-canvas';

  deviceElement.append(mediapipeContainer);
  // Returns a canvas to output
  return document.getElementById('mediapipe-canvas');
}