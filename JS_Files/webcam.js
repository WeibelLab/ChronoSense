var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs;
var sourceBuffer;
var timesliceConstraint = 20; //milleseconds until record autosaves to file
var recordingConstraints = 'video/mp4';
var constraints = {
  audio: false,
  video: true 
};

var camVideo = document.querySelector('video#webcam');

var recordingButton = document.querySelector('button#record');
recordingButton.onclick = toggleRecording;


//Go through the steps of populating the webcam selections, selecting the 
//the current webcam to stream from, and making sure it's a secure path.
triggerAuthorizationPrompt()
.then(getWebcams)
.then(populateDropDownMenu)
.then(onWebcamSelected);




///////////////////////////////////////////////////////////////
/////////////////////////// FUNCTIONS /////////////////////////
///////////////////////////////////////////////////////////////

/*
 * Function that, if used in a normal browser environment, would request 
 * permission from the user to use the webcam/video/audio through a secure
 * https portal.
 * 
 * RETURNS: A promise of a user device with {video; no audio}
 */
function triggerAuthorizationPrompt() {
  
  //Checks to see if the browser can use the streaming/recording API
  if (!navigator.mediaDevices) {
    throw new Error("The MediaDevices API is not supported.");
  }
 
  return navigator.mediaDevices.getUserMedia(constraints);
 
}

/*
 * Goes through all user connected video devices and returns a list of them.
 *
 */
function getWebcams() {
    return new Promise((resolve, reject) => {
        //Filter found devices to only keep "videoInput" devices
        navigator.mediaDevices.enumerateDevices()
        .then(devices=>{

            let filtered = devices.filter((device) => {
                return device.kind === "videoinput"
            });

            resolve(filtered);s
        })

    });

}

/*
 * Uses the list of discovered user video devices to populate a selectable 
 * drop-down menu.
 *
 */
function populateDropDownMenu(webcams) {
 
  let dropdown = document.getElementById("dropdown");
 
  webcams.forEach((cam) => {
    let option = document.createElement("option");
    option.text = cam.label;
    option.value = cam.deviceId;
    dropdown.options.add(option);
  });
  dropdown.addEventListener("change", onWebcamSelected);
}

/*
 *  Starts streaming currently selected video source to the "webcam" html video
 *  element.
 *
 */
function onWebcamSelected() {
 
  // Retrieve the webcam's device id and use it in the constraints object
  let dropdown = document.getElementById("dropdown");
  let id = dropdown.options[dropdown.selectedIndex].value;

  let constraints = {
    video: { 
      deviceId: { exact: id},
      width: {min: 640, ideal: 1920, max: 3840},
      height: {min: 480, ideal: 1080, max: 2160}
   }
  };

  // Attach the webcam feed to a video element so we can view it
  return navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => camVideo.srcObject = stream);

}

/*
 * Adds a buffer for incoming blobs to be sent to before getting saved.
 */
function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp9"');
  console.log('Source buffer: ', sourceBuffer);
}


/*
 * Used to record with a single button that changes between start/stop
 */
function toggleRecording() {
  //Check if starting or stopping; deal with text and enable status of buttons
  if(recordingButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordingButton.textContent = 'Start Recording';

  }
}

/*
 * Function that starts collecting data into a blob to be later downloaded into 
 * a file. There is also the option to periodically start saving to a file in
 * order to no run out of buffer space.
 *
 */
function startRecording() {
  var options = {mimeType: 'video/webm; codecs="vp9"', bitsPerSecond: 2500000};
  recordedBlobs = [];
  try {
    mediaRecorder = new MediaRecorder(camVideo.srcObject, options);
    alert("MediaRecorder set up correctly!");
  } catch (e0) {
    alert('MediaRecorder did not start up correctly; try again!');
    return;
  }
    
  
  recordingButton.textContent = 'Stop Recording';
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(timesliceConstraint); // collect 10ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

/*
 * Stop recording data into a blob.
 */
function stopRecording() {
  mediaRecorder.stop();
  download();
  console.log('Recorded Blobs: ', recordedBlobs);
}

/*
 * Download the recorded blob data file into a single video file.
 */
function download() {
  var blob = new Blob(recordedBlobs, {"type": recordingConstraints});
  recordedBlobs = [];
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);

}

/*
 * Whenever data is in the mediaRecorder buffer, send it to a blob.
 */
function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

/*
 * Function that writes to log whenever the recorder stops. Can be used for 
 * other things later if necessary.
 */
function handleStop(event) {
  console.log('Recorder stopped: ', event);
}