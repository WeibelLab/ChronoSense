const { desktopCapturer } = require('electron');
import { AVRecorder } from './avRecorder.js';

const wait=ms=>new Promise(resolve => setTimeout(resolve, ms));

export class ScreenCaptureDevice {

    #label = "Screen Capture";
    #deviceId = "ScreenCaptureModule";
	#videoElement = null;
	#optionContainer = null;
	#sources = []
	#recorder = null;
	#fileNameInputElement = null;
	#pluginDiv = null;

	#videoCheckbox = null;
	#audioCheckbox = null;
	#constraints = {audio: false, video: false}

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

	fixForMacOS() {
		if(process.platform === "darwin") {
			this.#constraints.audio = false;
			this.#audioCheckbox.classList.remove('checkbox-disabled');
			this.#audioCheckbox.disabled = true;
			this.#audioCheckbox.checked = false;
		}
	}

	getPluginDiv() {
		let _pluginDiv = this.#pluginDiv;
		return _pluginDiv;
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
	displaySourceOptions() {
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
					this.#constraints.video = {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: source.id,
							minWidth: 1280,
							maxWidth: this.#videoResolutionWidth,
							minHeight: 720,
							maxHeight: this.#videoResolutionHeight
						}
					};
		
					this.#constraints.audio = {
						mandatory: {
							chromeMediaSource: 'desktop'
						}
					};

					this.fixForMacOS();

					this.startCaptureStream();
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
	async startCaptureStream() {
        if (this.#stream == null ) {
			try {
				this.#stream = await navigator.mediaDevices.getUserMedia(this.#constraints)
				this.#videoElement.srcObject = this.#stream;
			} catch (error) {
				swal("STARTCAPTURE:"+error);
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
		// console.log("screen_capture_device.js:stopStream()] - Camera has been stopped");

	}

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
			this.#recorder = null;
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
		let screenCapContainer = document.createElement("div");
		let videoContainer = document.createElement("div");
		screenCapContainer.style.position = "relative";
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
		let closeButton = document.createElement("button");
		let closeImage = document.createElement("img");
		this.#pluginDiv = document.createElement("div");

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

		audioCheckContainer.classList.add("av-inner-container");
		videoCheckContainer.classList.add("av-inner-container");

		this.#videoCheckbox = document.createElement("input");
		this.#videoCheckbox.type = 'checkbox';
		this.#videoCheckbox.checked = true;
		let videoLabel = document.createElement('label');
		videoLabel.htmlFor = this.#videoCheckbox;
		videoLabel.appendChild(document.createTextNode('Video: '));

		this.#audioCheckbox = document.createElement("input");
		this.#audioCheckbox.type = 'checkbox';
		this.#audioCheckbox.checked = true;
		let audioLabel = document.createElement('label');
		audioLabel.htmlFor = this.#audioCheckbox;
		audioLabel.appendChild(document.createTextNode('Audio: '));

		this.#videoCheckbox.classList.add('flipswitch');
		this.#audioCheckbox.classList.add('flipswitch');

		this.#videoCheckbox.classList.add('checkbox-disabled');
		this.#audioCheckbox.classList.add('checkbox-disabled');


		videoCheckContainer.addEventListener("click", () => {
			if(this.#videoCheckbox.checked) {
				this.stopCaptureStream();
				this.displaySourceOptions();
				this.#audioCheckbox.checked = true;
			} else {
				this.stopCaptureStream();
				this.#audioCheckbox.checked = false;
				// can't record audio without screen capture so stop capture
			}
		});

		audioCheckContainer.addEventListener("click", () => {
			this.stopCaptureStream();
			if(this.#audioCheckbox.checked) {
				this.#constraints.audio = {
					mandatory: {
						chromeMediaSource: 'desktop'
					}
				};
			} else {
				this.#constraints.audio = false;
			}
			this.startCaptureStream();
		});

		// ! Final step for avCheckContainer - add a decibel meter below audio option for live monitoring.
		videoCheckContainer.append(videoLabel);
		videoCheckContainer.appendChild(this.#videoCheckbox);

		audioCheckContainer.append(audioLabel);
		audioCheckContainer.appendChild(this.#audioCheckbox);

		avCheckContainer.appendChild(videoCheckContainer);
		avCheckContainer.appendChild(audioCheckContainer);


		// Start adding buttons and containers to the full video element
		videoButtonsContainer.classList.add("camera-buttons-container");
		videoButtonsContainer.classList.add("camera-buttons-container-spacing");
		// Add fileNameContainer
		videoButtonsContainer.appendChild(fileNameContainer);
		// Add avCheckContainer 
		videoButtonsContainer.appendChild(avCheckContainer);


		// Attach all to div in the correct order and add to the page
		screenCapContainer.classList.add("screen-cap-inner-container");
		//Camera specific identifier
		screenCapContainer.id = `${this.getDeviceId()}`;

		//Sharing screencap id with close
		closeButton.id = screenCapContainer.id;
		screenCapContainer.appendChild(closeButton);

		screenCapContainer.appendChild(optionContainer); // Allows user to select screen/window to capture.
        screenCapContainer.appendChild(videoElement);
        screenCapContainer.appendChild(videoButtonsContainer);
		screenCapContainer.appendChild(this.#pluginDiv);


		this.displaySourceOptions();
		return screenCapContainer;
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
	 * Function used to start transmitting data from the device.
	 */
	start() {
		this.displaySourceOptions();

	}

	/**
	 * Function used to stop the device from transmitting data/running
	 */
	async stop() {
		await this.stopCaptureStream(this.#videoElement);
	}

	/**
	 * 
	 * @param {string} dirName - (path + name) of directory for recordings to be stored.
	 */
	 setDirName(dirName) {
		this.#dirName = dirName;
	}

	/**
	 * Getter function to check if there is an active screen capture
	 *
	 */
	 getScreenCaptureStatus() {
		return this.#stream;
	}

	/**
	 * Creates and returns all the current device's objects that can be instantiated
	 * from the connected devices.
	 * 
	 * @return {array} List of instantiated device objects 
	 */
	static getDeviceObjects() {
        let captureDevices = []
        captureDevices.push(new ScreenCaptureDevice());
        return captureDevices;

	}

}  // End of screenCaptureDevice Class