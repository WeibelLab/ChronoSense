import { AVRecorder } from "./avRecorder.js";

// WORKERS START WHERE HTML IS
/*
console.log("I'm the boss!");
var theWorker = new Worker("../JS_Files/worker_test.js");
*/

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
	#recorder;

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
			console.log(
				"[camera.js:setWidth()] - ERROR: Width value is invalid"
			);
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
			console.log(
				"[camera.js:setHeight()] - ERROR: Height value is invalid"
			);
			return false;
		}

		this.#videoResolutionHeight = height;
		return true;
	}

	// ! List of Functions to create:
	// // ! 1. Set quality, bitrate, etc. - finished: set resolution,
	// // ! 2. Set output canvas/video
	// ! 3. Get bool values for ifStreaming, ifOpen, ifValuesSet, etc.
	// // ! 4. Start streaming to set canvas

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
	 * @return {bool} - true if success, false if fail
	 */

	async startCameraStream() {
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

		var constraints = {
			video: {
				deviceId: this.#deviceId,
				width: { ideal: this.#videoResolutionWidth },
				height: { ideal: this.#videoResolutionHeight },
			},
		};

		var stream = null;

		/* Try to open cameras and start the stream */
		try {
			stream = await navigator.mediaDevices.getUserMedia(constraints);
			this.#videoElement.srcObject = stream;
			this.#isOn = true;

			requestAnimationFrame(() => {
				this.drawToCanvas(
					this.#videoElement,
					this.#canvasContext,
					this.#canvasElement.width,
					this.#canvasElement.height
				);
			});
		} catch (err) {
			console.log(
				`camera.js:startCameraStream()] - ERROR: ${err.message}`
			);
			return false;
		}
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
		console.log("[camera.js:stopCameraStream()] - Camera has been stopped");
	}

	/**
	 * Start recording current camera canvas feed
	 *
	 * ! Note: Assumes connection of canvas elements prior to call.
	 *
	 */
	startRecording() {
		if (!this.#isRecording) {
			// * Slightly inefficient use of memory management (i.e. GC) but good enough for time being
			this.#recorder = new AVRecorder(
				this.#canvasElement,
				this.#canvasContext,
				null,
				"cameraVideo"
			);
			this.#recorder.recorderSetup(0); //0 for video only
			this.#isRecording = true;
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
			this.#recorder.closeFile();
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
		let videoButtonsContainer = document.createElement("div");
		let mirrorButtonDiv = document.createElement("div");
		let videoElement = document.createElement("video");
		let canvasElement = document.createElement("canvas");
		let mirrorCheckElement = document.createElement("img");
		let mirrorLabelElement = document.createElement("label");
		let recordElement = document.createElement("button");
		let onElement = document.createElement("button");
		let offElement = document.createElement("button");

		//Set correct properties
		//Video element is NOT inserted into DOM since it is used as translation to canvas
		videoElement.width = "1280";
		videoElement.height = "720";
		videoElement.autoplay = true;

		canvasElement.width = "1280";
		canvasElement.height = "720";
		canvasElement.classList.add("camera-canvas");

		mirrorCheckElement.src = "../images/checkmarkWhite.png";
		mirrorCheckElement.style.visibility = "hidden";
		mirrorCheckElement.style.width = "10%";

		mirrorLabelElement.innerText = "Mirror Video";
		mirrorLabelElement.classList.add("mirrorlabel");

		mirrorButtonDiv.classList.add('kinect_on');
		mirrorButtonDiv.style.display = "flex";
		mirrorButtonDiv.style.width = "8em";
		mirrorButtonDiv.style.justifyContent = "space-between";
		mirrorButtonDiv.style.alignItems = "center";
		mirrorButtonDiv.style.padding = "0.5em";
		mirrorButtonDiv.appendChild(mirrorLabelElement);
		mirrorButtonDiv.appendChild(mirrorCheckElement);
		mirrorButtonDiv.addEventListener("click", () => {
			if (canvasElement.style.transform.localeCompare("scaleX(-1)") === 0) {
				// Change back to "normal" scaling
				canvasElement.style.transform = "scaleX(1)";
			} else {
				// Mirror canvas
				canvasElement.style.transform = "scaleX(-1)";
			}
			if (
				mirrorCheckElement.style.visibility.localeCompare("hidden") ===
				0
			) {
				mirrorCheckElement.style.visibility = "visible";
			} else {
				mirrorCheckElement.style.visibility = "hidden";
			}
		});

		recordElement.innerText = "Start Recording";
		recordElement.onclick = () => {
			this.startRecording();
		}; //assign function
		recordElement.classList.add("camera-record-btn");

		this.setInputAndOutput(videoElement, canvasElement)

		onElement.innerText = "ON";
		onElement.onclick = () => {
			this.startCameraStream();
		};
		onElement.classList.add("kinect_on");

		offElement.innerText = "OFF";
		offElement.onclick = () => {
			this.stopCameraStream();
		};
		offElement.classList.add("kinect_off");

		videoButtonsContainer.classList.add("camera-buttons-container");
		videoButtonsContainer.appendChild(mirrorButtonDiv);
		videoButtonsContainer.appendChild(recordElement);
		videoButtonsContainer.appendChild(onElement);
		videoButtonsContainer.appendChild(offElement);

		// Attach all to div in the correct order and add to the page
		videoContainer.classList.add("video-inner-container");
		//Camera specific identifier
		videoContainer.id = `${this.getDeviceId()}`;

		videoContainer.appendChild(canvasElement);
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
	 * Function used to stop the device from transmitting data/running
	 */
	stop() {
		this.stopCameraStream();
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
			console.log(devices);
			var uniqueInputDevices = [];
			for (var i = 0; i < devices.length; i++) {
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
			console.log(currentDevices);
			for (var k = 0; k < currentDevices.length; k++) {
				if (
					!(
						currentDevices[k].label.includes("kinect") ||
						currentDevices[k].label.includes("Kinect")
					)
				) {
					//ONLY add devices that are NOT Kinects (use Kinect SDK instead)
					var camera = new Camera(
						currentDevices[k].deviceId,
						currentDevices[k].groupId,
						currentDevices[k].kind,
						currentDevices[k].label
					);
					cameraDevices.push(camera);
				}
			} 
			console.log(cameraDevices);
			return new Promise((resolve, reject) => {
				resolve(cameraDevices);
			});
		});

	}

} //End of Camera Class
