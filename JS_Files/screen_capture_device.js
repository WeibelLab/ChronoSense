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

	#isRecording = false;
	#isStreaming = false;
	
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
			            console.log(sources);
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
					this.startCaptureStream(this.#videoElement, source);
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
	 */
	async startCaptureStream(videoElement, source) {
        if (!this.#isStreaming) {
			try {
				var stream = await navigator.mediaDevices.getUserMedia({ 
					audio: false,
					video: {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: source.id, 
							minWidth: 1280,
							maxWidth: 1280,
							minHeight: 720,
							maxHeight: 720
						}
					}
				})
				videoElement.srcObject = stream;
				this.#isStreaming = true;
	
			} catch (error) {
				console.log(error);
			}
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
			this.#isStreaming
		) {
			this.stopRecording();
			this.#videoElement.srcObject.getTracks().forEach((track) => {
				track.stop();
			});
			this.#isStreaming = false;
		}
	}

	/**
	 * Starts recording video/audio from the currently streaming source.
	 */
	startRecording() {
		if (!this.#isRecording && this.#isStreaming) {
			this.#recorder = new AVRecorder(
				this.#videoElement.captureStream(),
				this.#label
			);
			this.#recorder.startRecording();
			this.#isRecording = true;
		} else {
			this.stopRecording();
		}

	}

	/**
	 * Stops recording video/audio from the currently streaming source.
	 */
	stopRecording() {
		if (this.#isRecording && this.#isStreaming) {
			this.#recorder.stopRecording();
			this.#isRecording = false;
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
		let recordElement = document.createElement("button");
		let videoButtonsContainerOnOff = document.createElement("div");
		let onElement = document.createElement("button");
		let offElement = document.createElement("button");

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
		videoElement.classList.add("camera-canvas"); //! Change later OR allow user to manipulate sizing of containers (e.g. drag edges)

		recordElement.innerText = "Start Recording";
		recordElement.onclick = () => {
			this.startRecording();
			if (this.#isRecording) {
				recordElement.innerText = "Stop Recording";
			} else {
				recordElement.innerText = "Start Recording";
			}
		}; //assign function
		recordElement.classList.add("camera-record-btn");

		onElement.innerText = "ON";
		onElement.onclick = () => {
			this.start();
		};
		onElement.classList.add("kinect_on");
		onElement.style.marginRight = "4px";

		offElement.innerText = "OFF";
		offElement.onclick = () => {
			this.stopCaptureStream();
		};
		offElement.classList.add("kinect_off");

		videoButtonsContainer.classList.add("camera-buttons-container");
		videoButtonsContainer.classList.add("camera-buttons-container-spacing");
		videoButtonsContainer.appendChild(recordElement);
		videoButtonsContainerOnOff.classList.add("camera-buttons-container");
		videoButtonsContainerOnOff.appendChild(onElement);
		videoButtonsContainerOnOff.appendChild(offElement);
		videoButtonsContainer.appendChild(videoButtonsContainerOnOff);

		// Attach all to div in the correct order and add to the page
		videoContainer.classList.add("video-inner-container");
		//Camera specific identifier
		videoContainer.id = `${this.getDeviceId()}`;

		videoContainer.appendChild(optionContainer);
        videoContainer.appendChild(videoElement);
        videoContainer.appendChild(videoButtonsContainer);

		return videoContainer;
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
	stop() {
		this.stopCaptureStream(this.#videoElement);
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