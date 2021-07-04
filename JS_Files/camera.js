import { AVRecorder } from "./avRecorder.js";

export class Camera {
	#deviceId = null;
	#groupId = null;
	#kind = null;
	#label = null;
	#videoElement = null;
	#canvasElement = null;
	#canvasContext = null;
	#isOn = false;

	#videoResolutionWidth = 1280; //Default to 1280 - for best FOV
	#videoResolutionHeight = 720; //Default to 720 - for best FOV

	#isRecording = false;
	#isRecordOptionChecked = false;
	#fileNameInputElement = null;
	#recorder;
	#dirName = null;

	#isVideoChecked = false;
	#isAudioChecked = false;

	/**
	 *
	 * @param {string} deviceId - Identifier for the device used in input capture.
	 * @param {string} groupId - Identifier for the device group used in input capture.
	 * @param {string} kind - Identifier for type of input from device.
	 * @param {string} label - Name Identifier (Sensical to user for reading).
	 */
	constructor(deviceId, groupId, kind, label) {
		this.#deviceId = deviceId;
		this.#groupId = groupId;
		this.#kind = kind;
		this.#label = label;
	}

	/**
	 * Getter function to retrieve the object's Group ID
	 *
	 * @return {string} - Group identifier used to connect it to other similar devices
	 */
	getGroupId() {
		return this.#groupId;
	}

	/**
	 * Getter function to retrieve the object's "kind"
	 *
	 * @return {string} - Device identifier used to describe device output
	 */
	getKind() {
		return this.#kind;
	}


	/**
	 * Set width and height for the input of the camera feed.
	 *
	 * @param {number} width of camera resolution
	 * @param {number} height
	 * @return {bool} true if success, false if failure
	 */
	setWidthAndHeight(width, height) {
		if (this.setWidth(width) && this.setHeight(height)) {
			return true;
		}
		return false;
	}

	/**
	 * Set width for the input of the camera feed.
	 *
	 * @param {number} width of camera feed resolution
	 * @return {bool} true if success, false if failure
	 */
	setWidth(width) {
		if (width === null || isNaN(width)) {
			/*
			console.log(
				"[camera.js:setWidth()] - ERROR: Width value is invalid"
			);
			*/
			return false;
		}

		this.#videoResolutionWidth = width;
		return true;
	}

	/**
	 * Set height for the input of the camera feed.
	 *
	 * @param {number} height of camera feed resolution
	 * @return {bool} true if success, false if failure
	 */
	setHeight(height) {
		if (height === null || isNaN(height)) {
			/*
			console.log(
				"[camera.js:setHeight()] - ERROR: Height value is invalid"
			);
			*/
			return false;
		}

		this.#videoResolutionHeight = height;
		return true;
	}

	/**
	 * Function used for setting the <Video> element that will interpret the video content
	 * and the <Canvas> element that will display the video content.
	 *
	 */
	setInputAndOutput(video, canvas) {
		//Set input Video HTML element
		if (video instanceof HTMLVideoElement && video !== null) {
			this.#videoElement = video;
		} else {
			
			console.log(
				"[camera.js:setInputAndOutput()] - ERROR: Video element argument passed is INVALID"
			);
			
			return;
		}
		//Set output Canvas HTML element
		if (canvas instanceof HTMLCanvasElement && canvas !== null) {
			this.#canvasElement = canvas;
			this.#canvasContext = canvas.getContext("2d");
		} else {
			
			console.log(
				"[camera.js:setInputAndOutput()] - ERROR: Canvas element argument passed is INVALID"
			);
			
			return;
		}
	}

	/**
	 * Open up the camera device specified in the constructor and start streaming
	 * input from the opened camera device to canvas (through Video element).
	 * 
	 * Note: Checks if A/V boxes checked to stream audio, video, or both
	 *
	 * @return {bool} - true if success, false if fail
	 */

	async startCameraStream(constraints = {audio: false, video: false}) {

		/* First check that the canvas and video elements are valid */
		if (this.#videoElement == null || this.#canvasElement == null) {
			console.log(
				"[camera.js:startCameraStream()] - ERROR: Video and canvas elements not set"
			);
			
			return false;
		}

		/* Second check that this object has a deviceId set */
		if (this.#deviceId === null) {
			console.log(
				"[camera.js:startCameraStream()] - ERROR: deviceId NOT set"
			);
			
			return false;
		}

		if (Object.is(constraints.audio, false) && Object.is(constraints.video, false)){
			// Check for A/V selections
			if (this.#isAudioChecked) {
				constraints.audio = {
					deviceId: this.#deviceId,
				};

			}
			if (this.#isVideoChecked) {
				constraints.video = {
					deviceId: this.#deviceId,
					width: { ideal: this.#videoResolutionWidth },
					height: { ideal: this.#videoResolutionHeight }
				};
			}
		}
		

		var stream = null;

		/* Try to open cameras and start the stream */
		try {
			stream = await navigator.mediaDevices.getUserMedia(constraints);
			this.#videoElement.srcObject = stream;

		} catch (err) {
			console.log(
				`camera.js:startCameraStream()] - ERROR: ${err.message}`
			);
			return false;
		}

		this.#isOn = true;
		return true;
	}

	/**
	 * Draws the Video frames to the Canvas element and continuously calls itself
	 * until stopped.
	 *
	 * @param {HTML Video Element} video - Video element camera originally streams to
	 * @param {HTML Canvas Element 2D Context} canvasContext - 2D Canvas context taken from the desired output Canvas
	 * @param {number} canvasWidth - Width of the desired output Canvas
	 * @param {number} canvasHeight - Height of the desired output Canvas
	 *
	 */
	drawToCanvas(video, canvasContext, canvasWidth, canvasHeight) {
		//canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
		if (video.readyState === video.HAVE_ENOUGH_DATA) {
			canvasContext.drawImage(video, 0, 0, canvasWidth, canvasHeight);
			this.recordFrame(); // Checks for recording status in function
		}
		var frameId = requestAnimationFrame(() => {
			this.drawToCanvas(video, canvasContext, canvasWidth, canvasHeight);
		});
		if (!this.#isOn) {
			cancelAnimationFrame(frameId);
		}
	}

	/**
	 * Stop the camera feed.
	 *
	 */
	stopCameraStream() {
		this.#isOn = false;
		if (
			this.#videoElement !== null &&
			this.#videoElement.srcObject !== null
		) {
			this.stopRecording();
			this.#videoElement.srcObject.getTracks().forEach((track) => {
				track.stop();
			});
		}
		//console.log("[camera.js:stopCameraStream()] - Camera has been stopped");
	}

	restartCameraStream(audioSelector) {
		if(this.#isOn){
			this.stopCameraStream();
		}
		let constraints = {video: false, audio: false};
		constraints.video = {
			deviceId: this.#deviceId,
			width: { ideal: this.#videoResolutionWidth },
			height: { ideal: this.#videoResolutionHeight }
		};
		const audioSource = audioSelector.value;
		constraints.audio = {
			deviceId: audioSource,
		};
		this.startCameraStream(constraints);
	}

	/**
	 * Start recording current camera canvas feed
	 *
	 * ! Note: Assumes connection of canvas elements prior to call.
	 *
	 */
	startRecording() {
		if (!this.#isRecording) {
			this.#recorder = new AVRecorder(
				this.#videoElement.captureStream(),
				this.#dirName,
				this.#fileNameInputElement.value
			);
			this.#recorder.startRecording();
			//this.#recorder.recorderSetup(0); //0 for video only
			this.#isRecording = true;
			// Disable the record filename input when recording
			this.#fileNameInputElement.disabled = true;
		} else {
			this.stopRecording();
		}
	}

	/**
	 * Call to record the current frame to video file *Temp workflow*
	 */
	recordFrame() {
		if (this.#isRecording) {
			this.#recorder.writeToFile();
		}
	}

	/**
	 * Stop recording current camera canvas feed
	 */
	stopRecording() {
		if (this.#isRecording) {
			this.#recorder.stopRecording();
			this.#isRecording = false;
			// Reenable recording file name after finished recording
			this.#fileNameInputElement.disabled = false;
		}
	}

	gotAudioDevices(deviceInfos, audioSelector) {
		for (let i = 0; i !== deviceInfos.length; ++i) {
		  const deviceInfo = deviceInfos[i];
		  const option = document.createElement('option');
		  option.value = deviceInfo.deviceId;
		  if (deviceInfo.kind === 'audioinput') {
			// console.log("hello "+option.value);
			option.text = deviceInfo.label || `microphone ${audioSelector.length + 1}`;
			audioSelector.appendChild(option);
		  }
		}
	  }

	// * Start Required Methods for a Chronosense Device Add-On
	
	/**
	 * Function that creates all the UI elements needed for one Kinect device &
	 * wraps them all into a single div returned for display.
	 * 
	 * @return {HTML Div Element} - Single div element that contains all UI elements
	 * 								for display.
	 */
	getUI() {
		//First create the necessary elements
		// * video, canvas, buttons, video option menus, etc.
		let videoContainer = document.createElement("div");
		let audioContainer = document.createElement("div");
		let audioSelector = document.createElement("select");
		let videoButtonsContainer = document.createElement("div");
		let videoButtonsContainerSub = document.createElement("div");
		let videoElement = document.createElement("video");
		let canvasElement = document.createElement("canvas");
		let onElement = document.createElement("button");
		let offElement = document.createElement("button");
		let aVCheckContainer = document.createElement("div");
		let videoCheckContainer = document.createElement("div");
		let audioCheckContainer = document.createElement("div");
		let fileNameContainer = document.createElement("div");
		let recordInclusionContainer = document.createElement("div");

		//Set correct properties
		//Video element is NOT inserted into DOM since it is used as translation to canvas
		videoElement.width = "1280";
		videoElement.height = "720";
		videoElement.autoplay = true;
		videoElement.muted = true;
		videoElement.classList.add("camera-canvas");

		this.setInputAndOutput(videoElement, canvasElement); //Connect elements to class variables.
		
		// Build recordInclusionContainer
		recordInclusionContainer.classList.add("record-inclusion-container");

		let recordTextContainer = document.createElement("div");
		recordTextContainer.classList.add("general-txt");
		recordTextContainer.innerText = "Record:";

		let recordCheckbox = document.createElement("div");
		recordCheckbox.classList.add("av-checkbox");

		var checkImgRecord = document.createElement("img");
		checkImgRecord.src = "../images/checkmarkWhite.webp";
		checkImgRecord.classList.add("camera-buttons-check")

		recordInclusionContainer.addEventListener("click", (evt) => {
			this.checkmarkRecordHelper(evt.currentTarget);
		});


		recordCheckbox.appendChild(checkImgRecord);
		recordInclusionContainer.appendChild(recordTextContainer);
		recordInclusionContainer.appendChild(recordCheckbox);

		// Build fileNameContainer
		fileNameContainer.classList.add("file-name-container");

		let fileUpperContainer = document.createElement("div");
		fileUpperContainer.classList.add("av-inner-container");

		let fileUpperTextContainer = document.createElement("div");
		fileUpperTextContainer.classList.add("general-txt");
		fileUpperTextContainer.innerText = "File Name:";

		// ! Maybe add a button and indication that the text input is set for UX purposes?

		let lowerTextBox = document.createElement("input");
		this.#fileNameInputElement = lowerTextBox;
		lowerTextBox.classList.add("general-txt-box");
		lowerTextBox.defaultValue = this.#label.replace(/\s/g,'');

		fileUpperContainer.appendChild(fileUpperTextContainer)
		fileNameContainer.appendChild(fileUpperContainer);
		fileNameContainer.appendChild(lowerTextBox);

		// Build aVCheckContainer 
		aVCheckContainer.classList.add("av-check-container");
		videoCheckContainer.classList.add("av-inner-container");
		audioCheckContainer.classList.add("av-inner-container");

		var checkImgVideo = document.createElement("img");
		var checkImgAudio = document.createElement("img");
		checkImgVideo.src = "../images/checkmarkWhite.webp";
		checkImgVideo.classList.add("camera-buttons-check")

		checkImgAudio.src = "../images/checkmarkWhite.webp";
		checkImgAudio.classList.add("camera-buttons-check")

		let videoNameDiv = document.createElement("div");
		videoNameDiv.innerText = "Video:";
		videoNameDiv.classList.add("general-txt");
		videoNameDiv.classList.add("av-label");
		let videoCheckBoxContainer = document.createElement("div");
		videoCheckBoxContainer.classList.add("av-checkbox");
		videoCheckBoxContainer.appendChild(checkImgVideo);

		let audioNameDiv = document.createElement("div");
		audioNameDiv.innerText = "Audio:";
		audioNameDiv.classList.add("general-txt");
		audioNameDiv.classList.add("av-label");
		let audioCheckBoxContainer = document.createElement("div");
		audioCheckBoxContainer.classList.add("av-checkbox");
		audioCheckBoxContainer.appendChild(checkImgAudio);

		videoCheckContainer.addEventListener("click", (evt) => {
			this.checkmarkVideoHelper(evt.currentTarget);
		});

		audioCheckContainer.addEventListener("click", (evt) => {
			this.checkmarkAudioHelper(evt.currentTarget);
		});

		// ! Final step for aVCheckContainer - add a decibel meter below audio option for live monitoring.

		videoCheckContainer.appendChild(videoNameDiv);
		videoCheckContainer.appendChild(videoCheckBoxContainer);
		audioCheckContainer.appendChild(audioNameDiv);
		audioCheckContainer.appendChild(audioCheckBoxContainer);
		aVCheckContainer.appendChild(videoCheckContainer);
		aVCheckContainer.appendChild(audioCheckContainer);

		// Build on/off buttons
		videoButtonsContainerSub.classList.add("on-off-btn-container");

		onElement.innerText = "ON";
		onElement.onclick = () => {
			this.restartCameraStream(audioSelector);
		};
		onElement.classList.add("general-btn");
		onElement.style.height = "48%";

		offElement.innerText = "OFF";
		offElement.onclick = () => {
			this.stopCameraStream();
		};
		offElement.classList.add("general-btn");
		offElement.style.height = "48%";
		
		videoButtonsContainerSub.appendChild(onElement);
		videoButtonsContainerSub.appendChild(offElement);

		// Start adding buttons and containers to the full video element
		videoButtonsContainer.classList.add("camera-buttons-container");
		videoButtonsContainer.classList.add("camera-buttons-container-spacing");
		// Add recordInclusionContainer
		videoButtonsContainer.appendChild(recordInclusionContainer);
		// Add fileNameContainer
		videoButtonsContainer.appendChild(fileNameContainer);
		// Add aVCheckContainer 
		videoButtonsContainer.appendChild(aVCheckContainer);
		// Add on/off buttons
		videoButtonsContainer.appendChild(videoButtonsContainerSub);

		// Attach all to div in the correct order and add to the page
		videoContainer.classList.add("video-inner-container");
		//Camera specific identifier
		videoContainer.id = `${this.getDeviceId()}`;

		//videoContainer.appendChild(canvasElement);
		videoContainer.appendChild(videoElement);
		videoContainer.appendChild(audioContainer);
		audioContainer.appendChild(audioSelector);

		navigator.mediaDevices.enumerateDevices().then(devices => {
			this.gotAudioDevices(devices, audioSelector);
		});

		audioSelector.onchange = () => {
			this.restartCameraStream(audioSelector);
		}

		videoContainer.appendChild(videoButtonsContainer);

		// Autostart camera with all options selected
		this.checkmarkVideoHelper(videoCheckContainer);
		this.checkmarkAudioHelper(audioCheckContainer);
		this.checkmarkRecordHelper(recordInclusionContainer);
		this.startCameraStream();

		return videoContainer;
	}

	clearUI(){
		this.#isVideoChecked = false;
		this.#isAudioChecked = false;
		this.#isRecordOptionChecked = false;
		return;
	}

	/**
	 * Reveal/hide target's checkmark img, set boolean value of video to true.  
	 * 
	 * @param {HTML Div Element} elementContainer - Container of multiple child elements where checkmark image is
	 * 												held as childNode[1]->childNode[0] from elementContainer.
	 */
	checkmarkVideoHelper(elementContainer) {
		// Check video section with visible check mark and bool in class
		if (!this.#isOn && !this.#isVideoChecked) {
			// Preview is off and video isn't checked, so check
			
			elementContainer.childNodes[1].childNodes[0].style.visibility = "visible";
			this.#isVideoChecked = true;
		
		} else if (!this.#isOn && this.#isVideoChecked) {
			// Preview is off and video isn't checked, so check
			elementContainer.childNodes[1].childNodes[0].style.visibility = "hidden";
			this.#isVideoChecked = false;

		} else {
			// Preview is on while changing, send error
			console.log("Error: Can't change sources when stream is live.");
		}
	}

	/**
	 * Reveal/hide target's checkmark img, set boolean value of audio to true.  
	 * 
	 * @param {HTML Div Element} elementContainer - Container of multiple child elements where checkmark image is
	 * 												held as childNode[1]->childNode[0] from elementContainer.
	 */
	 checkmarkAudioHelper(elementContainer) {
		// Check audio section with visible check mark and bool in class
		if (!this.#isOn && !this.#isAudioChecked) {
			// Preview is off and audio isn't checked, so check
			
			elementContainer.childNodes[1].childNodes[0].style.visibility = "visible";
			this.#isAudioChecked = true;
		
		} else if (!this.#isOn && this.#isAudioChecked) {
			// Preview is off and audio isn't checked, so check
			elementContainer.childNodes[1].childNodes[0].style.visibility = "hidden";
			this.#isAudioChecked = false;

		} else {
			// Preview is on while changing, send error
			console.log("Error: Can't change sources when stream is live.");
		}
	}

	/**
	 * Reveal/hide target's checkmark img, set boolean value of isRecordOptionChecked to true.  
	 * 
	 * @param {HTML Div Element} elementContainer - Container of multiple child elements where checkmark image is
	 * 												held as childNode[1]->childNode[0] from elementContainer.
	 */
	 checkmarkRecordHelper(elementContainer) {
		// Check record section with visible check mark and bool in class
		if (!this.#isRecordOptionChecked && !this.#isRecording) {
			// Record isn't checked and not currently recording, so check
			
			elementContainer.childNodes[1].childNodes[0].style.visibility = "visible";
			this.#isRecordOptionChecked = true;
		
		} else if (this.#isRecordOptionChecked && !this.#isRecording) {
			// Record is checked and not currently recording, so uncheck
			elementContainer.childNodes[1].childNodes[0].style.visibility = "hidden";
			this.#isRecordOptionChecked = false;

		} else {
			// Preview is off while changing or currently recording this feed; send error
			console.log("Error: Can't enable recording without live feed or while recording.");
		}
	}


	/**
	 * Getter function to retrieve the object's "label"
	 *
	 * @return {string} - Device's English name
	 */
	getLabel() {
		return this.#label;
	}

	/**
	 * Getter function to retrieve the object's Device ID
	 *
	 * @return {string} - Device identifier used in capturing image/sound
	 */
	getDeviceId() {
		return this.#deviceId;
	}

	/**
	 * Function used to stop the device from transmitting data/running
	 */
	stop() {
		this.stopCameraStream();
	}

	/**
	 * Returns the boolean value of record selection status
	 * 
	 * @returns {bool} - True if selected to record, false otherwise.
	 */
	getRecordStatus() {
		return this.#isRecordOptionChecked;
	}

	/**
	 * 
	 * @param {string} dirName - (path + name) of directory for recordings to be stored.
	 */
	setDirName(dirName) {
		this.#dirName = dirName;
	}

	/**
	 * Creates and returns all the current device's objects that can be instantiated
	 * from the connected devices.
	 * 
	 * @return {array} List of instantiated device objects 
	 */
	static getDeviceObjects() {
		var cameraDevices = []
		
		return navigator.mediaDevices.enumerateDevices().then((devices) => {
			var uniqueInputDevices = [];
			for (var i = 0; i < devices.length; i++) {
				console.log(devices[i].kind + ": " + devices[i].label + " id = " + devices[i].deviceId);
				if (devices[i].kind.localeCompare("videoinput") == 0) {
					//Now search through added devices if it already exists
					var matched = false;
					for (var j = 0; j < uniqueInputDevices.length; j++) {
						if (
							uniqueInputDevices[j].groupId.localeCompare(
								devices[i].groupId
							) == 0
						) {
							matched = true;
							break; //If match, break out and don't add to
						}
					}
	
					if (
						!matched &&
						devices[i].deviceId.localeCompare("default") != 0 &&
						devices[i].deviceId.localeCompare("communications") != 0
					) {
						//Filter out "default" and "communications" so there is a alphanumeric
						//identifier and no duplicates.
						uniqueInputDevices.push(devices[i]);
					}
				}
			}
			return new Promise((resolve, reject) => {
				resolve(uniqueInputDevices);
			});
		}).then((currentDevices) => {
			//console.log(currentDevices);
			for (var k = 0; k < currentDevices.length; k++) {
				//if (
				//	!(
				//		currentDevices[k].label.includes("kinect") ||
				//		currentDevices[k].label.includes("Kinect")
				//	)
				//) {
					//ONLY add devices that are NOT Kinects (use Kinect SDK instead)
				var camera = new Camera(
					currentDevices[k].deviceId,
					currentDevices[k].groupId,
					currentDevices[k].kind,
					currentDevices[k].label
				);
				cameraDevices.push(camera);
				}
			//} 
			//console.log(cameraDevices);
			return new Promise((resolve, reject) => {
				resolve(cameraDevices);
			});
		});

	}

} //End of Camera Class
