export class Webcam {

  #mediaSource = new MediaSource();
  #mediaRecorder;
  #recordedBlobs;
  #sourceBuffer;
  #recordingButton;
  #camVideo;
  #dropdown;
  #timesliceConstraint = 20; //milleseconds until record autosaves to file
  #recordingConstraints = 'video/mp4';
  #constraints = {
    audio: false,
    video: true 
  };


  constructor(recordingButton, camVideo, dropdown) {
    this.#mediaSource.addEventListener('sourceopen', this.handleSourceOpen, false);
    recordingButton.onclick = this.toggleRecording;
    this.#recordingButton = recordingButton;
    this.#camVideo = camVideo;
    this.#dropdown = dropdown;
    
  }


  //Go through the steps of populating the webcam selections, selecting the 
  //the current webcam to stream from, and making sure it's a secure path.
  start() {
    this.triggerAuthorizationPrompt()
    .then(this.getWebcams)
    .then(this.populateDropDownMenu)
    .then(this.onWebcamSelected);
  }


  /*
   * Function that, if used in a normal browser environment, would request 
   * permission from the user to use the webcam/video/audio through a secure
   * https portal.
   * 
   * RETURNS: A promise of a user device with {video; no audio}
   */
  triggerAuthorizationPrompt() {

    //Checks to see if the browser can use the streaming/recording API
    if (!navigator.mediaDevices) {
      throw new Error("The MediaDevices API is not supported.");
    }
  
    return navigator.mediaDevices.getUserMedia(this.#constraints);
  
  }


  /*
   * Goes through all user connected video devices and returns a list of them.
   *
   */
  getWebcams() {
      return new Promise((resolve, reject) => {
          //Filter found devices to only keep "videoInput" devices
          navigator.mediaDevices.enumerateDevices()
          .then(devices=>{

              let filtered = devices.filter((device) => {
                  return device.kind === "videoinput"
              });

              resolve(filtered);
          })

      });

  }


  /* Used to empty the drop down menu before re adding webcam list */
  emptyDropdown(dropdown_el){
    for (a in dropdown_el.options) { dropdown_el.options.remove(0); }
  }


  /*
   * Uses the list of discovered user video devices to populate a selectable 
   * drop-down menu.
   *
   */
  populateDropDownMenu(webcams) {
  
    //let dropdown = document.getElementById("dropdown"); put in style file
    this.emptyDropdown(this.#dropdown);
  
    webcams.forEach((cam) => {
      let option = document.createElement("option");
      option.text = cam.label;
      option.value = cam.deviceId;
      this.#dropdown.options.add(option);
    });
    this.#dropdown.addEventListener("change", this.onWebcamSelected);
  }


  /*
   *  Starts streaming currently selected video source to the "webcam" html video
   *  element.
   *
   */
  async onWebcamSelected() {
  
    // Retrieve the webcam's device id and use it in the constraints object
    //let this.#dropdown = document.getElementById("dropdown");
    let id = this.#dropdown.options[this.#dropdown.selectedIndex].value;
    let constraints = {
      video: { 
        deviceId: { exact: id},
        width: {min: 640, ideal: 1920, max: 3840},
        height: {min: 480, ideal: 1080, max: 2160}
     }
    };

    // Attach the webcam feed to a video element so we can view it
    return navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => this.#camVideo.srcObject = stream);

  }


  /*
   * Adds a buffer for incoming blobs to be sent to before getting saved.
   */
  handleSourceOpen(event) {
    console.log('MediaSource opened');
    this.#sourceBuffer = this.#mediaSource.addSourceBuffer('video/webm; codecs="vp9"');
    console.log('Source buffer: ', this.#sourceBuffer);
  }


  /*
   * Used to record with a single button that changes between start/stop
   */
  toggleRecording() {
    //Check if starting or stopping; deal with text and enable status of buttons
    if(this.#recordingButton.textContent === 'Start Recording') {
      this.startRecording();
    } else {
      this.stopRecording();
      this.#recordingButton.textContent = 'Start Recording';

    }
  }


  /*
   * Function that starts collecting data into a blob to be later downloaded into 
   * a file. There is also the option to periodically start saving to a file in
   * order to not run out of buffer space.
   *
   */
  startRecording() {
    var options = {mimeType: 'video/webm; codecs="vp9"', bitsPerSecond: 2500000};
    this.#recordedBlobs = [];
    try {
      this.#mediaRecorder = new MediaRecorder(this.#camVideo.srcObject, options);
      alert("MediaRecorder set up correctly!");
    } catch (e0) {
      alert('MediaRecorder did not start up correctly; try again!');
      return;
    }


    this.#recordingButton.textContent = 'Stop Recording';
    this.#mediaRecorder.onstop = this.handleStop;
    this.#mediaRecorder.ondataavailable = this.handleDataAvailable;
    this.#mediaRecorder.start(this.#timesliceConstraint); // collect 10ms of data
    console.log('MediaRecorder started', this.#mediaRecorder);
  }


  /*
   * Stop recording data into a blob.
   */
  stopRecording() {
    this.#mediaRecorder.stop();
    this.download();
    console.log('Recorded Blobs: ', this.#recordedBlobs);
  }


  /*
   * Download the recorded blob data file into a single video file.
   */
  async download() {
    var blob = new Blob(this.#recordedBlobs, {"type": this.#recordingConstraints});
    this.#recordedBlobs = [];
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
  handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
      this.#recordedBlobs.push(event.data);
    }
  }


  /*
   * Function that writes to log whenever the recorder stops. Can be used for 
   * other things later if necessary.
   */
  handleStop(event) {
    console.log('Recorder stopped: ', event);
  }

}  //End of Webcam class