import { AVRecorder } from "./avRecorder.js";
import { updateRecordButton } from "./chronosense.js"

const wait=ms=>new Promise(resolve => setTimeout(resolve, ms));

export class Camera {
	#deviceId = null;
	#groupId = null;
	#kind = null;
	#label = null;
	#videoElement = null;
	#canvasElement = null;
	#canvasContext = null;
	#audioSelector = null;
	#recordCheckbox = null;
	#videoCheckbox = null;
	#audioCheckbox = null;
	#audioMonitorUI = null;
	#audioContext = null;
	#pluginDiv = null;
	#constraints = {audio: false, video: false}
	#stream = null;

	#videoResolutionWidth = 1280; //Default to 1280 - for best FOV
	#videoResolutionHeight = 720; //Default to 720 - for best FOV

	#isVisible = false;
	#isRecording = false;
	#fileNameInputElement = null;
	#recorder;
	#dirName = null;

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

	async getPluginDiv() {
		let _pluginDiv;
		if (this.#isVisible){
			_pluginDiv = this.#pluginDiv;
			return _pluginDiv;
		}
		else{
			await wait(100).then( () => {
				_pluginDiv = this.#pluginDiv;
				return _pluginDiv;
			});
		}
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

	monitorAudio(stream) {
		var max_level_L = 0;
		var old_level_L = 0;
		var cnvs = this.#audioMonitorUI;
		var cnvs_cntxt = cnvs.getContext("2d");
		this.#audioContext = new AudioContext();
		var microphone = this.#audioContext.createMediaStreamSource(stream);
		var javascriptNode = this.#audioContext.createScriptProcessor(1024, 1, 1);
		
		microphone.connect(javascriptNode);
		javascriptNode.connect(this.#audioContext.destination);
		javascriptNode.onaudioprocess = function(event){
			var inpt_L = event.inputBuffer.getChannelData(0);
			var instant_L = 0.0;
			var sum_L = 0.0;
			for(var i = 0; i < inpt_L.length; ++i) {
				sum_L += inpt_L[i] * inpt_L[i];
			}
			instant_L = Math.sqrt(sum_L / inpt_L.length);
			max_level_L = Math.max(max_level_L, instant_L);				
			instant_L = Math.max( instant_L, old_level_L -0.008 );
			old_level_L = instant_L;
			cnvs_cntxt.clearRect(0, 0, cnvs.width, cnvs.height);
			cnvs_cntxt.fillStyle = '#00ff00';
			cnvs_cntxt.fillRect(2,2,(cnvs.width-4)*(instant_L/max_level_L),(cnvs.height-4)); // x,y,w,h
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

	async startStream() {
		/* First check that the canvas and video elements are valid */
		if (this.#videoElement == null || this.#canvasElement == null) {
			console.log(
				"[camera.js:startStream()] - ERROR: Video and canvas elements not set"
			);
			
			return false;
		}

		/* Second check that this object has a deviceId set */
		if (this.#deviceId === null) {
			console.log(
				"[camera.js:startStream()] - ERROR: deviceId NOT set"
			);
			
			return false;
		}

		/* Try to open and start the stream */
		try {
			this.#stream = await navigator.mediaDevices.getUserMedia(this.#constraints);
			if (this.#videoCheckbox.checked){
				this.#videoElement.srcObject = this.#stream;
				const [track] = this.#stream.getVideoTracks()
				var _this = this;
				function onStreamDisconnected() {
					_this.stopStream();
					updateRecordButton();
				}
				track.addEventListener('ended', function() {
					//Things to do when stream disconnects mid-stream
					onStreamDisconnected();
					console.log("stream disconnected")
				})
			}
			if (this.#audioCheckbox.checked){
				this.monitorAudio(this.#stream);
			}
		} catch (err) {
			console.log(
				`camera.js:startStream()] - ERROR: ${err.message}`
			);
			return false;
		}

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
		if (!this.#videoCheckbox.checked) {
			cancelAnimationFrame(frameId);
		}
	}

	async closeAudioContext(){
		try{
			await this.#audioContext.close();
		} catch (err) {
			console.log("#audioContext not open")
		}
		var cnvs = this.#audioMonitorUI;
		var cnvs_cntxt = cnvs.getContext("2d");
		cnvs_cntxt.clearRect(0, 0, cnvs.width, cnvs.height);
	}

	/**
	 * Stop the camera feed.
	 *
	 */
	async stopStream() {
		if (
			this.#videoElement !== null &&
			this.#videoElement.srcObject !== null
		) {
			this.stopRecording();
			this.#videoElement.srcObject.getTracks().forEach((track) => {
				track.stop();
			})
		}
		try {
			if (this.#audioContext.state != "closed"){
				await this.closeAudioContext();
			}
		}
		catch {
			console.log("audio not open");
		}
		//console.log("[camera.js:stopStream()] - Camera has been stopped");

	}

	updateRecordStatus() {
		this.checkboxConstraintHelper();
	}

	updateConstraints() {
		this.stopStream();
		this.checkboxConstraintHelper();
		// Enabling and Disabling Recording with isVisible & starting Stream if one platform exist
		if(this.#videoCheckbox.checked || this.#audioCheckbox.checked) {
			this.#isVisible = true
			this.startStream();
		}
		if(!this.#videoCheckbox.checked && !this.#audioCheckbox.checked) {
			this.#isVisible = false;
		}
	}

	/**
	 * Start recording current camera canvas feed
	 *
	 * ! Note: Assumes connection of canvas elements prior to call.
	 *
	 */
	async startRecording() {
		if (!this.#isRecording && this.#isVisible) {
			this.#recorder = new AVRecorder(
				this.#stream,
				this.#dirName,
				this.#fileNameInputElement.value
			);
			this.#recorder.startRecording();
			//this.#recorder.recorderSetup(0); //0 for video only
			this.#isRecording = true;
			// Disable the record filename input when recording
			this.#fileNameInputElement.disabled = true;
			this.#audioSelector.disabled = true;
			//Disables record/video/audio checkbox option when recording starts
			document.querySelectorAll('input.checkbox-disabled').forEach(elem => {
    			elem.disabled = true;
			});
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
	async stopRecording() {
		if (this.#isRecording) {
			console.log('Stop recording')
			this.#recorder.stopRecording();
			this.#isRecording = false;
			// Reenable recording file name after finished recording
			this.#fileNameInputElement.disabled = false;
			this.#audioSelector.disabled = false;
			//Enables record/video/audio checkbox option when recording stops
			document.querySelectorAll('input.checkbox-disabled').forEach(elem => {
    			elem.disabled = false;
			});
			this.#recorder = null;
		}
	}

	gotAudioDevices(deviceInfos) {
		for (let i = 0; i !== deviceInfos.length; ++i) {
		  const deviceInfo = deviceInfos[i];
		  const option = document.createElement('option');
		  option.value = deviceInfo.deviceId;
		  if (deviceInfo.kind === 'audioinput') {
			// console.log("hello "+option.value);
			option.text = deviceInfo.label || `microphone ${this.#audioSelector.length + 1}`;
			this.#audioSelector.appendChild(option);
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
		let cameraContainer = document.createElement("div");
		let videoContainer = document.createElement("div");
		let audioContainer = document.createElement("div");
		this.#audioSelector = document.createElement("select");
		let audioMonitorContainer = document.createElement("div");
		this.#audioMonitorUI = document.createElement("canvas");
		let cameraButtonsContainer = document.createElement("div");
		let videoElement = document.createElement("video");
		let canvasElement = document.createElement("canvas");
		let avCheckContainer = document.createElement("div");
		let videoCheckContainer = document.createElement("div");
		let audioCheckContainer = document.createElement("div");
		let fileNameContainer = document.createElement("div");
		let recordCheckContainer = document.createElement("div");
		let closeButton = document.createElement("button");
		let closeImage = document.createElement("img");
		this.#pluginDiv = document.createElement("div");

		this.#audioMonitorUI.style.backgroundColor = "black";
		this.#audioMonitorUI.width = "100";
		this.#audioMonitorUI.height = "10";

		//Set correct properties
		//Video element is NOT inserted into DOM since it is used as translation to canvas
		videoElement.width = "1280";
		videoElement.height = "720";
		videoElement.autoplay = true;
		videoElement.muted = true;
		videoElement.classList.add("camera-canvas");

		this.setInputAndOutput(videoElement, canvasElement); //Connect elements to class variables.
	
		// Build Close Button
		closeButton.classList.add("close-button");
		closeImage.classList.add("close-button-image")
		closeImage.setAttribute("src","../images/x.svg");
		closeButton.appendChild(closeImage);

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

		// Build recordCheckContainer
		recordCheckContainer.classList.add("record-check-container");

		this.#recordCheckbox = document.createElement("input");
		this.#recordCheckbox.type = 'checkbox';
		this.#recordCheckbox.checked = true;
		var recordLabel = document.createElement('label');
		recordLabel.htmlFor = this.#recordCheckbox;
		recordLabel.appendChild(document.createTextNode('Record:  '));

		recordCheckContainer.appendChild(recordLabel);
		recordCheckContainer.appendChild(this.#recordCheckbox);

		// Build avCheckContainer 
		avCheckContainer.classList.add("av-check-container");
		
		audioCheckContainer.classList.add("av-inner-container");
		videoCheckContainer.classList.add("av-inner-container");

		this.#videoCheckbox = document.createElement("input");
		this.#videoCheckbox.type = 'checkbox';
		this.#videoCheckbox.checked = true;
		var videoLabel = document.createElement('label');
		videoLabel.htmlFor = this.#videoCheckbox;
		videoLabel.appendChild(document.createTextNode('Video: '));

		this.#audioCheckbox = document.createElement("input");
		this.#audioCheckbox.type = 'checkbox';
		this.#audioCheckbox.checked = true;
		var audioLabel = document.createElement('label');
		audioLabel.htmlFor = this.#audioCheckbox;
		audioLabel.appendChild(document.createTextNode('Audio: '));

		this.#recordCheckbox.classList.add('flipswitch');
		this.#videoCheckbox.classList.add('flipswitch');
		this.#audioCheckbox.classList.add('flipswitch');

		this.#recordCheckbox.classList.add('checkbox-disabled');
		this.#videoCheckbox.classList.add('checkbox-disabled');
		this.#audioCheckbox.classList.add('checkbox-disabled');
		//this.#audioSelector.classList.add('checkbox-disabled')

		recordCheckContainer.addEventListener("click", () => {
			this.updateRecordStatus();
		});
		
		videoCheckContainer.addEventListener("click", () => {
			this.updateConstraints();
		});

		audioCheckContainer.addEventListener("click", () => {
			// this.#audio/videoCheckbox value is being updated instantly to false
			//console.log(this.#audioCheckbox.checked);
			this.updateConstraints();
		});

		// ! Final step for avCheckContainer - add a decibel meter below audio option for live monitoring.
		videoCheckContainer.append(videoLabel);
		videoCheckContainer.appendChild(this.#videoCheckbox);
		
		audioCheckContainer.append(audioLabel);
		audioCheckContainer.appendChild(this.#audioCheckbox);
		
		avCheckContainer.appendChild(videoCheckContainer);
		avCheckContainer.appendChild(audioCheckContainer);

		// var recordBtn = document.getElementById("record-all-btn");

		// Start adding buttons and containers to the full video element
		cameraButtonsContainer.classList.add("camera-buttons-container");
		cameraButtonsContainer.classList.add("camera-buttons-container-spacing");
		// Add recordCheckContainer
		cameraButtonsContainer.appendChild(recordCheckContainer);
		// Add fileNameContainer
		cameraButtonsContainer.appendChild(fileNameContainer);
		// Add avCheckContainer 
		cameraButtonsContainer.appendChild(avCheckContainer);

		// Attach all to div in the correct order and add to the page
		cameraContainer.classList.add("camera-inner-container");
		//Camera specific identifier
		cameraContainer.id = `${this.getDeviceId()}`;

		//Sharing camera id with close
		closeButton.id = cameraContainer.id;
		cameraContainer.appendChild(closeButton);

		cameraContainer.appendChild(videoContainer);
		videoContainer.appendChild(videoElement);
		videoContainer.appendChild(audioContainer);
		audioContainer.appendChild(this.#audioSelector);
		audioContainer.appendChild(audioMonitorContainer);
		audioMonitorContainer.appendChild(this.#audioMonitorUI);

		navigator.mediaDevices.enumerateDevices().then(devices => {
			this.gotAudioDevices(devices);
		});

		this.#audioSelector.onchange = () => {
			this.updateConstraints();
		}

		cameraContainer.appendChild(cameraButtonsContainer);
		cameraContainer.appendChild(this.#pluginDiv);

		// Autostart camera with all options selected
		this.checkboxConstraintHelper();
		this.startStream();
		this.#isVisible = true;
		return cameraContainer;
	}

	/**
	 * Changes boolean value of record/audio/video option to be true or false
	 * 
	 * @param {String} elementOption - String value of option that needs to was checked
	 */
	async checkboxConstraintHelper() {
		if (this.#videoCheckbox.checked) {
			// Turning on Video and setting constraints
			this.#constraints.video = {
				deviceId: this.#deviceId,
				width: { ideal: this.#videoResolutionWidth },
				height: { ideal: this.#videoResolutionHeight }
			};
		} else if (!this.#videoCheckbox.checked) {
			// Unchecks video and turns off constraints
			this.#constraints.video = false;

		}
		
		if (this.#audioCheckbox.checked) {
			// Preview is off and audio isn't checked, so check
			const audioSource = this.#audioSelector.value;
			this.#constraints.audio = {
				deviceId: audioSource,
			};
		} else if (!this.#audioCheckbox.checked) {
			// Preview is off and audio isn't checked, so check
			this.#constraints.audio = false;
		}

		// this.#recordStatus = this.#recordCheckbox.checked;
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
	async stop() {
		await this.stopStream();
	}

	clearUI(){
		this.#isVisible = false;
		this.#recordCheckbox = null;
		return;
	}

	/**
	 * Returns the boolean value of record selection status
	 * 
	 * @returns {bool} - True if selected to record, false otherwise.
	 */
	 getRecordStatus() {
		try{
			return this.#recordCheckbox.checked;
		}
		catch{
			return false;
		}
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
				// console.log(devices[i].kind + ": " + devices[i].label + " id = " + devices[i].deviceId);
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
