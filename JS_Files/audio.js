import { AVRecorder } from "./avRecorder.js";

const wait=ms=>new Promise(resolve => setTimeout(resolve, ms));

export class Audio {
	#deviceId = "Audio";
	#groupId = "Audio";
	#kind = "audioinput";
	#label = "Audio Only";
	#videoElement = null;
	#audioSelector = null;
	#audioCheckbox = null;
	#audioMonitorUI = null;
	#audioContext = null;
	#pluginDiv = null;
	#constraints = {audio: false, video: false}
	#stream = null;

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
		this.#deviceId = "Audio";
		this.#groupId = "Audio";
		this.#kind = "audioinput";
		this.#label = "Audio Only";
	}

	getPluginDiv() {
		let _pluginDiv = this.#pluginDiv;
		return _pluginDiv;
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

	monitorAudio(stream) {
		let max_level_L = 0;
		let old_level_L = 0;
		let cnvs = this.#audioMonitorUI;
		let cnvs_cntxt = cnvs.getContext("2d");
		this.#audioContext = new AudioContext();
		let microphone = this.#audioContext.createMediaStreamSource(stream);
		let javascriptNode = this.#audioContext.createScriptProcessor(1024, 1, 1);
		
		microphone.connect(javascriptNode);
		javascriptNode.connect(this.#audioContext.destination);
		javascriptNode.onaudioprocess = function(event){
			let inpt_L = event.inputBuffer.getChannelData(0);
			let instant_L = 0.0;
			let sum_L = 0.0;
			for(let i = 0; i < inpt_L.length; ++i) {
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
		/* Second check that this object has a deviceId set */
		if (this.#deviceId === null) {
			swal(
				"[audio.js:startStream()] - ERROR: deviceId NOT set"
			);
			
			return false;
		}

		/* Try to open and start the stream */
		try {
			this.#stream = await navigator.mediaDevices.getUserMedia(this.#constraints);
			if (this.#audioCheckbox.checked){
				this.monitorAudio(this.#stream);
			}

		} catch (err) {
			swal(
				`audio.js:startStream()] - ERROR: ${err.message}`
			);
			return false;
		}

		return true;
	}

	async closeAudioContext(){
		try{
			await this.#audioContext.close();
		} catch (err) {
			swal("#audioContext not open")
		}
		let cnvs = this.#audioMonitorUI;
		let cnvs_cntxt = cnvs.getContext("2d");
		cnvs_cntxt.clearRect(0, 0, cnvs.width, cnvs.height);
	}

	/**
	 * Stop the camera feed.
	 *
	 */
	async stopStream() {
		try {
			if(this.#audioContext){
				if (this.#audioContext.state != "closed"){
					await this.closeAudioContext();
				}
			}
		}
		catch {
			console.log("audio not open");
		}
		//console.log("[audio.js:stopStream()] - Camera has been stopped");

	}

	updateRecordStatus() {
		this.checkboxConstraintHelper();
	}

	updateConstraints() {
		this.stopStream();
		this.checkboxConstraintHelper();
		if(this.#audioCheckbox.checked) {
			this.startStream();
		}
	}

	/**
	 * Start recording current camera canvas feed
	 *
	 * ! Note: Assumes connection of canvas elements prior to call.
	 *
	 */
	async startRecording() {
		if (!this.#isRecording) {
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
			document.querySelectorAll('.checkbox-disabled').forEach(elem => {
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
			this.#recorder.stopRecording();
			this.#isRecording = false;
			// Reenable recording file name after finished recording
			this.#fileNameInputElement.disabled = false;
			this.#audioSelector.disabled = false;
			//Enables record/video/audio checkbox option when recording stops
			document.querySelectorAll('.checkbox-disabled').forEach(elem => {
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
		let audioCheckContainer = document.createElement("div");
		let fileNameContainer = document.createElement("div");
		let closeButton = document.createElement("button");
		let closeImage = document.createElement("img");
		this.#pluginDiv = document.createElement("div");

		this.#audioMonitorUI.style.backgroundColor = "black";
		this.#audioMonitorUI.width = "100";
		this.#audioMonitorUI.height = "10";

		//Set correct properties
		//Video element is NOT inserted into DOM since it is used as translation to canvas
		videoElement.width = "0";
		videoElement.height = "0";
		videoElement.autoplay = false;
		videoElement.muted = false;
		//videoElement.classList.add("camera-canvas");
	
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

		// Build avCheckContainer 
		avCheckContainer.classList.add("av-check-container");
		// Matches record checkbox for audio only
		avCheckContainer.style.height = "2em";
		
		audioCheckContainer.classList.add("av-inner-container");

		this.#audioCheckbox = document.createElement("input");
		this.#audioCheckbox.type = 'checkbox';
		this.#audioCheckbox.checked = true;
		let audioLabel = document.createElement('label');
		audioLabel.htmlFor = this.#audioCheckbox;
		audioLabel.appendChild(document.createTextNode('Audio: '));

		this.#audioCheckbox.classList.add('flipswitch');
		this.#audioCheckbox.classList.add('checkbox-disabled');
		//this.#audioSelector.classList.add('checkbox-disabled')

		audioCheckContainer.addEventListener("click", () => {
			this.updateConstraints();
		});
		
		audioCheckContainer.append(audioLabel);
		audioCheckContainer.appendChild(this.#audioCheckbox);
		
		//avCheckContainer.appendChild(videoCheckContainer);
		avCheckContainer.appendChild(audioCheckContainer);

		// Start adding buttons and containers to the full video element
		cameraButtonsContainer.classList.add("camera-buttons-container");
		cameraButtonsContainer.classList.add("camera-buttons-container-spacing");
		// Add fileNameContainer
		cameraButtonsContainer.appendChild(fileNameContainer);
		// Add avCheckContainer 
		cameraButtonsContainer.appendChild(avCheckContainer);

		// Attach all to div in the correct order and add to the page
		cameraContainer.classList.add("camera-inner-container");
		// Matches width with other screen/video container
		cameraContainer.style.width = "480";

		//Camera specific identifier
		cameraContainer.id = `${this.getDeviceId()}`;

		//Sharing camera id with close
		closeButton.id = cameraContainer.id;
		cameraContainer.appendChild(closeButton);

		cameraContainer.appendChild(videoContainer);
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
		return cameraContainer;
	}

	/**
	 * Changes boolean value of record/audio/video option to be true or false
	 * 
	 * @param {String} elementOption - String value of option that needs to was checked
	 */
	async checkboxConstraintHelper() {
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
		let audioDevices = []
		audioDevices.push(new Audio());
		return audioDevices;
	}
}
