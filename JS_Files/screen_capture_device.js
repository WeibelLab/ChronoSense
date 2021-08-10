const { desktopCapturer } = require('electron');
import { AVRecorder } from './avRecorder.js';

export class ScreenCaptureDevice {

    #label = "Screen Capture";
    #deviceId = "ScreenCaptureModule";
	#videoElement = null;
	#videoContainer = null;
	#optionContainer = null;
	#sources = []
	#recorder = null;
	#fileNameInputElement = null;

	#recordCheckbox = null;
	#videoCheckbox = null;
	#audioCheckbox = null;


	#videoResolutionWidth = 1280; // Default: 1280
	#videoResolutionHeight = 720; // Default: 720

	#dirName = null;

	#isRecording = false;
	#stream = null;

	/**
	 * Constructor for a ScreenCaptureDevice object that captures stream of video/audio from user screens & windows.
	 *
	 */
    constructor() {
        this.getCaptureSources();
    }

	/**
	 * Collects all of the possible screen and window sources into an array for later use.
	 *
	 * @return {Promise} Resolves to (1) when all sources have been added to sources []
	 */
    getCaptureSources() {
		return new Promise((resolve, reject) => {
			desktopCapturer.getSources({ types: ['window', 'screen'], thumbnailSize: {width: 900, height: 900} }).then(sources => {
			            this.#sources = sources;
			            //console.log(sources);
						resolve(1);
					});
		});
        
	}

	/**
	 * Displays previews for all capture options and allows the user to click them to start streaming.
	 *
	 */
	displaySourceOptions(recordCheckContainer) {
		// Display source options on top of video element with thumbnail & name.
		// User can click on one to select it and start streaming in video/audio.
		
		// Refresh sources
		this.getCaptureSources().then(() => {
			// Display sources over video
			this.#sources.forEach(source => {
				// <div><img/><p>name_of_source</p></div>
				let newDiv = document.createElement("div");
				let newImage = document.createElement("img");
				let newP = document.createElement("p");

				newDiv.style.width = "20vw";
				newDiv.style.height = "auto";
				newDiv.style.margin = "20px";
				newDiv.style.borderWidth = "1px";
				newDiv.style.borderColor = "rgba(255, 255, 255, 0)";
				newDiv.style.borderRadius = "2px";
				newDiv.style.cursor = "pointer";
				newDiv.style.overflow = "hidden";

				newDiv.onmouseover = () => {
					newDiv.style.borderStyle = "solid";
					newDiv.style.borderColor = "white";

				};

				newDiv.onmouseout = () => {
					newDiv.style.borderColor = "rgba(255, 255, 255, 0)";

				};

				newDiv.onclick = () => {
					// Start streaming this particular source option
					// ! Allow options later 
					this.startCaptureStream(this.#videoElement, source, recordCheckContainer);
					this.hideSourceOptions();
				};

				newImage.src = source.thumbnail.toDataURL();
				newImage.style.width = "100%";
				newImage.style.height = "auto";

				newP.appendChild(document.createTextNode(source.name));
				newP.style.width = "100%";

				newDiv.appendChild(newImage);
				newDiv.appendChild(newP);

				this.#optionContainer.appendChild(newDiv);

			});

			// Finally, reveal options
			this.#optionContainer.style.display = "flex";
		});
		
	}

	/**
	 * Hides visible source selection options and then deletes those elements from the DOM.
	 *
	 */
	hideSourceOptions() {
		this.#optionContainer.style.display = "none";

		// Also remove the elements in the list 
		// Note: Maybe remove later if testing shows performance issue
		this.deleteSourceOptions();

	}

	/**
	 * Removes the source option elements from the DOM.
	 *
	 */
	deleteSourceOptions() {
		while (this.#optionContainer.firstChild) {
			this.#optionContainer.removeChild(this.#optionContainer.firstChild);
		}
	}

	/**
	 * Starts streaming video/audio from the selected (passed in) source.
	 *
	 * @param {Video Element} videoElement - HTML Video Element for the MediaStream to display.
	 * @param {MediaStream} source - MediaStream object from a screen or window.
	 * @return {bool} - Returns true if the capture stream started successfully, false if otherwise.
	 */
	async startCaptureStream(videoElement, source, recordCheckContainer) {
        if (this.#stream == null ) {
			let constraints = {audio: false, video: false};

			constraints.video = {
				mandatory: {
					chromeMediaSource: 'desktop',
					chromeMediaSourceId: source.id,
					minWidth: 1280,
					maxWidth: this.#videoResolutionWidth,
					minHeight: 720,
					maxHeight: this.#videoResolutionHeight
				}
			};

			if (this.#audioCheckbox.checked) {
				constraints.audio = {
					mandatory: {
						chromeMediaSource: 'desktop'
					}
				};
			}

			try {
				this.#stream = await navigator.mediaDevices.getUserMedia(constraints)
				this.#videoElement.srcObject = this.#stream;
			} catch (error) {
				console.log("STARTCAPTURE:"+error);
				return false;
			}
			return true;
		}
	}
	
	/**
	 * Stops streaming video/audio from the currently streaming source.
	 * Note: Also stops recording.
	 *
	 * @param {Video Element} videoElement - HTML Video Element to stop streaming data to.
	 */
	async stopCaptureStream(videoElement) {
		if (
			this.#videoElement !== null &&
			this.#videoElement.srcObject !== null &&
			this.#stream != null
		) {
			this.stopRecording();
			this.#videoElement.srcObject.getTracks().forEach((track) => {
				track.stop();
			});
			this.#stream = null;
		}
		// Ask what this is
		// if (this.#audioCheckbox.checked) {
		// 	await this.closeAudioContext();
		// }
		console.log("screen_capture_device.js:stopStream()] - Camera has been stopped");

	}

	// updateRecordStatus() {
	// 	this.checkboxConstraintHelper();
	// }

	// updateConstraints() {
	// 	//this.stopCaptureStream();
	// 	this.checkboxConstraintHelper();
	// 	//this.startCaptureStream();
	// }

	/**
	 * Starts recording video/audio from the currently streaming source.
	 */
	startRecording() {
		if (!this.#isRecording) {
			this.#recorder = new AVRecorder(
				this.#stream,
				this.#dirName,
				this.#fileNameInputElement.value
			);
			this.#recorder.startRecording();
			this.#isRecording = true;
			// Disable the record filename input when recording
			this.#fileNameInputElement.disabled = true;
			//Disables record/video/audio checkbox option when recording starts
			document.querySelectorAll('input.checkbox-disabled').forEach(elem => {
    			elem.disabled = true;
			});
		} else {
			this.stopRecording();
		}

	}

	/**
	 * Stops recording video/audio from the currently streaming source.
	 */
	stopRecording() {
		if (this.#isRecording) {
			this.#recorder.stopRecording();
			this.#isRecording = false;
			// Reenable recording file name after finished recording
			this.#fileNameInputElement.disabled = false;
			//Enables record/video/audio checkbox option when recording stops
			document.querySelectorAll('input.checkbox-disabled').forEach(elem => {
    			elem.disabled = false;
			});
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
		videoContainer.style.position = "relative";
		this.#videoContainer = videoContainer;
		let videoButtonsContainer = document.createElement("div");
		let videoElement = document.createElement("video");
		this.#videoElement = videoElement;
		let videoButtonsContainerSub = document.createElement("div");
		let onElement = document.createElement("button");
		let offElement = document.createElement("button");
		let videoCheckContainer = document.createElement("div");
		let avCheckContainer = document.createElement("div");
		let audioCheckContainer = document.createElement("div");
		let fileNameContainer = document.createElement("div");
		let recordCheckContainer = document.createElement("div");

		// Unique to screen capture to display different capture options.
		let optionContainer = document.createElement("div");
		this.#optionContainer = optionContainer;
		optionContainer.classList.add("camera-canvas"); //! Change later OR allow user to manipulate sizing of containers (e.g. drag edges)
		optionContainer.style.height = "100%";
		optionContainer.style.display = "none";
		optionContainer.style.flexDirection = "row";
		optionContainer.style.flexWrap = "wrap";
		optionContainer.style.position = "absolute";
		optionContainer.style.zIndex = "1";
		optionContainer.style.overflow = "auto";

		//Set correct properties
		//Video element is NOT inserted into DOM since it is used as translation to canvas
		videoElement.width = "1280";
		videoElement.height = "720";
        videoElement.autoplay = true;
		videoElement.muted = true;
		videoElement.classList.add("camera-canvas"); //! Change later OR allow user to manipulate sizing of containers (e.g. drag edges)

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

		// recordCheckContainer.addEventListener("click", () => {
		// 	// Don't think I need a helper b/c screen capture only updates true and false
		// 	//this.updateRecordStatus();
		// 	this.#recordStatus = this.#recordCheckbox.checked;
		// });

		videoCheckContainer.addEventListener("click", () => {
			if(this.#videoCheckbox.checked) {
				console.log(this.#videoCheckbox.checked)
				this.displaySourceOptions(recordCheckContainer);
			} else {
				console.log(this.#videoCheckbox.checked)
				this.stopCaptureStream();
			}
		});

		// audioCheckContainer.addEventListener("click", () => {
			//Can directly check the state of the checkbox
		// 	this.updateConstraints();
		// });

		// ! Final step for avCheckContainer - add a decibel meter below audio option for live monitoring.
		videoCheckContainer.append(videoLabel);
		videoCheckContainer.appendChild(this.#videoCheckbox);

		audioCheckContainer.append(audioLabel);
		audioCheckContainer.appendChild(this.#audioCheckbox);

		avCheckContainer.appendChild(videoCheckContainer);
		avCheckContainer.appendChild(audioCheckContainer);

		// // Build on/off buttons
		// videoButtonsContainerSub.classList.add("on-off-btn-container");

		// onElement.innerText = "ON";
		// onElement.onclick = () => {
		// 	this.displaySourceOptions(recordCheckContainer);
		// };
		// // onElement.classList.add("general-btn");
		// // onElement.style.height = "48%";

		// // offElement.innerText = "OFF";
		// offElement.onclick = () => {
		// 	this.stopCaptureStream();
		// };
		// offElement.classList.add("general-btn");
		// offElement.style.height = "48%";
		
		// videoButtonsContainerSub.appendChild(onElement);
		// videoButtonsContainerSub.appendChild(offElement);

		// Start adding buttons and containers to the full video element
		videoButtonsContainer.classList.add("camera-buttons-container");
		videoButtonsContainer.classList.add("camera-buttons-container-spacing");
		// Add recordCheckContainer
		videoButtonsContainer.appendChild(recordCheckContainer);
		// Add fileNameContainer
		videoButtonsContainer.appendChild(fileNameContainer);
		// Add avCheckContainer 
		videoButtonsContainer.appendChild(avCheckContainer);

		// Deleted
		// // Add on/off buttons
		// videoButtonsContainer.appendChild(videoButtonsContainerSub);

		// Attach all to div in the correct order and add to the page
		videoContainer.classList.add("video-inner-container");
		//Camera specific identifier
		videoContainer.id = `${this.getDeviceId()}`;

		videoContainer.appendChild(optionContainer); // Allows user to select screen/window to capture.
        videoContainer.appendChild(videoElement);
        videoContainer.appendChild(videoButtonsContainer);

		// Autostart screen capture with all options selected
		//this.checkboxConstraintHelper();
		this.displaySourceOptions(recordCheckContainer);

		return videoContainer;
	}

	// /**
	//  * Changes boolean value of record/audio/video option to be true or false
	//  * 
	//  * @param {String} elementOption - String value of option that needs to was checked
	//  */
	//  checkmarkHelper(elementOption) {
	// 	if (elementOption == 'Audio') {
	// 		if (/*!this.#isOn && */!this.#isAudioChecked) {
	// 			// Preview is off and audio isn't checked, so check
	// 			this.#isAudioChecked = true;	
	// 		} else if (/*!this.#isOn && */this.#isAudioChecked) {
	// 			// Preview is off and audio isn't checked, so check
	// 			this.#isAudioChecked = false;
	
	// 		} else {
	// 			// Preview is on while changing, send error
	// 			console.log("Error: Can't change sources when stream is live.");
	// 		}
	// 	}
	// 	else if (elementOption == 'Record') {
	// 		// Check record section with visible check mark and bool in class
	// 		if (!this.#isRecordOptionChecked && !this.#isRecording) {
	// 			// Record isn't checked and not currently recording, so check
	// 			this.#isRecordOptionChecked = true;
		
	// 		} else if (this.#isRecordOptionChecked && !this.#isRecording) {
	// 			// Record is checked and not currently recording, so uncheck
	// 			this.#isRecordOptionChecked = false;
	// 		} else {
	// 			// Preview is off while changing or currently recording this feed; send error
	// 			console.log("Error: Can't enable recording without live feed or while recording.");
	// 		}
	// 	}
	// }


	// /**
	//  * Changes boolean value of record/audio/video option to be true or false
	//  * 
	//  * @param {String} elementOption - String value of option that needs to was checked
	//  */
	//  async checkboxConstraintHelper() {
	// 	this.#recordStatus = this.#recordCheckbox.checked;
	// }

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
	 * Function used to start transmitting data from the device.
	 */
	start() {
		this.displaySourceOptions();

	}

	/**
	 * Function used to stop the device from transmitting data/running
	 */
	stop() {
		this.stopCaptureStream(this.#videoElement);
	}

	clearUI(){
		return false;
	}

	/**
	 * Returns the boolean value of record selection status
	 * 
	 * @returns {bool} - True if selected to record, false otherwise.
	 */
	 getRecordStatus() {
		return this.#recordCheckbox.checked;
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
        var captureDevices = []
        captureDevices.push(new ScreenCaptureDevice());
        return captureDevices;

	}

}  // End of screenCaptureDevice Class