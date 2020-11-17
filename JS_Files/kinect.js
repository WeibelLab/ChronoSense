/*
 * Description: File is used to display the direct camera feed from the
 *              Azure Kinect.
 *
 */
import { JointWriter } from "./jointwriter.js";
import { AVRecorder } from "./avRecorder.js";
const KinectAzure = require("../kinect-azure");

export class Kinect {
	#kinectDevice;
	#serial;
	#displayCanvas; //Display canvas and outputctx used to display feed
	#outputCtx;
	#isKinectOn = false;
	#isKinectOpen = false;
	#isKinectCamerasStarted = false;
	#isKinectListening = false;
	#isKinectStreaming = false;
	#isRecording = false;
	#depthModeRange;
	#jointWriter = null;
	#recorder; //Used for recording video/audio to file

	//List of all changeable parameters for Kinect sensor feed:
	#CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_30;
	#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_720P;
	#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32;
	#DepthMode = KinectAzure.K4A_DEPTH_MODE_OFF;
	#SyncMode = false;

	/**
	 * Constructor for a Kinect object that is a SINGLE Kinect device.
	 *
	 * @param {number} index - Used to select Kinect, index = -1 does NOT open Kinect device (use to get device count).
	 */
	constructor(index = 0) {
		this.#kinectDevice = new KinectAzure();
		if (index != -1) {
			if (this.open(index)) {
				//Device open
				this.#serial = this.#kinectDevice.getSerialNumber();
				if (this.#serial === "\0") {
					//Failed to get serial
					console.log(
						"[Kinect Class Constructor Index] - Failed to get Kinect Serial Number"
					);
				}
				this.close();
			}
		}

		// Try putting this in start function and only when body tracking added
		//this.#jointWriter = new JointWriter();
	}

	/**
	 * Getter function to retrieve the device's serial number
	 *
	 * @return String of device serial number (from Kinect Class)
	 *
	 */
	getSerial() {
		return this.#serial;
	}

	/**
	 * Getter function to retrieve the amount of Kinect devices currently
	 * connected to the system.
	 *
	 * @return {number} Number of connected Kinect devices
	 */
	getInstalledCount() {
		return this.#kinectDevice.getInstalledCount();
	}

	/**
	 *	Open the Kinect Device through the SDK (kinect-azure package)
	 *
	 * @param {number} index of the Kinect Device in the SDK
	 * @return {bool} true if success, false if fail
	 */
	open(index) {
		if (this.#kinectDevice.open(index)) {
			this.#isKinectOpen = true;
			return true;
		}

		//Device didn't open. Either doesn't exist or failed.
		console.log("[kinect.js:Open()] - Kinect Device Failed to open");
		return false;
	}

	/**
	 * Open the Kinect Device through the SDK via serial # saved in object
	 * (from constructor)
	 *
	 * @return {bool} true if success, false if fail
	 */
	serialOpen() {
		if (this.#kinectDevice.serialOpen(this.#serial)) {
			this.#isKinectOpen = true;
			return true;
		}

		//Device didn't open. Either doesn't exist or failed.
		console.log("[kinect.js:serialOpen()] - Kinect Device Failed to open");
		return false;
	}

	/**
	 * Close the Kinect Device through the SDK (kinect-azure package)
	 *
	 * @return {bool} true if success, false if fail
	 */
	close() {
		if (this.#kinectDevice.close()) {
			//Device Close Successful
			this.#isKinectOpen = false;
			return true;
		}

		//Device Close Unsuccessful
		console.log("[kinect.js:close()] - Kinect Device Failed to close");
		return false;
	}

	/**
	 * Function starts the Kinect cameras with the set parameters. By default it
	 * uses the parameters below; they can be changed later through UI options in
	 * the application [in progress].
	 *
	 */
	async sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Start up the Kinect and make sure the device is ready to steam to feed
	 *
	 */
	start() {
		//First check if device is open
		if (!this.#isKinectOpen) {
			this.serialOpen();
			this.#isKinectOpen = true;
		}

		//Second check if cameras have been started
		if (!this.#isKinectCamerasStarted) {
			this.#kinectDevice.startCameras({
				camera_fps: this.#CameraFPS,
				color_format: this.#ColorFormat,
				color_resolution: this.#ColorResolution,
				depth_mode: this.#DepthMode,
				synchronized_images_only: this.#SyncMode,
			});

			this.#isKinectCamerasStarted = true;
		}

		//Third check if depthmode != 0
		if (this.#DepthMode !== KinectAzure.K4A_DEPTH_MODE_OFF) {
			this.#depthModeRange = this.#kinectDevice.getDepthModeRange(
				this.#DepthMode
			);
			this.#kinectDevice.createTracker();
			// Try creating joint writer only if body tracking enabled
			this.#jointWriter = new JointWriter();
		}
	} //End of startKinect()

	/**
	 *  Get isListening data for error checking
	 *
	 * @return {boolean} isKinectStreaming variable value
	 */

	getIsStreaming() {
		return this.#isKinectStreaming;
	}

	/**
	 * Set the canvas where the Kinect stream will display.
	 *
	 * @param {object} canvas for stream display (HTML element)
	 * @return {bool} true if success, false if fail
	 */
	setDisplayCanvas(canvas) {
		if (canvas instanceof HTMLCanvasElement) {
			this.#displayCanvas = canvas;
			this.#outputCtx = canvas.getContext("2d");
			return true;
		}

		console.log(
			"[kinect.js:setDisplayCanvas()] - ERROR: Passed element is NOT a canvas!"
		);
		return false;
	}

	stopListeningAndCameras() {
		if (this.#isKinectListening) {
			return this.#kinectDevice.stopListening().then(() => {
				console.log("stoppedListening");
				this.#isKinectListening = false;
				this.#isKinectStreaming = false;
				this.#kinectDevice.stopCameras();
				console.log("stoppedCameras");
				this.#isKinectCamerasStarted = false;

				if (this.#DepthMode != KinectAzure.K4A_DEPTH_MODE_OFF) {
					if (this.#jointWriter != null) {
						this.#jointWriter.closeWrittenFile();
					}
					this.#kinectDevice.destroyTracker();
				}

				console.log(
					"[kinect.js:stopListeningAndCameras()] - END HIT -> check for race condition"
				);

				return new Promise((resolve, reject) => {
					resolve(true);
				});
			});
		} else {
			console.log(
				"[kinect.js:stopListeningAndCameras()] - ERROR: Cameras and Listening ALREADY off"
			);
			return new Promise((resolve, reject) => {
				resolve(false);
			});
		}
	}

	/* The color (RGB) video feed of the Azure Kinect is output to a display
	   canvas */
	colorVideoFeed() {
		//First check if the Kinect is already running and don't start if it is:
		if (!this.#isKinectListening) {
			this.#isKinectListening = true;
			this.#kinectDevice.startListening((data) => {
				//Currently doesn't reach here when going between pages... BUG
				//console.log('Color listening for data...');
				var outputImageData = null;
				this.#isKinectStreaming = true;
				if (!outputImageData && data.colorImageFrame.width > 0) {
					//console.log("START RENDER REACHED");
					this.#displayCanvas.width = data.colorImageFrame.width;
					this.#displayCanvas.height = data.colorImageFrame.height;
					outputImageData = this.#outputCtx.createImageData(
						this.#displayCanvas.width,
						this.#displayCanvas.height
					);
				}

				if (outputImageData) {
					this.renderBGRA32ColorFrame(
						this.#outputCtx,
						outputImageData,
						data.colorImageFrame
					);
					//Call recording render frame (checks state in func)
					this.recordFrame();
				}
			});
		}
	}

	/* Function used to render data retrieved from Kinect to the canvas */
	renderBGRA32ColorFrame(ctx, canvasImageData, imageFrame) {
		//console.log("Start of renderBGRA32ColorFrame() reached");
		const newPixelData = Buffer.from(imageFrame.imageData);
		const pixelArray = canvasImageData.data;
		//console.log(pixelArray);
		for (let i = 0; i < canvasImageData.data.length; i += 4) {
			pixelArray[i] = newPixelData[i + 2];
			pixelArray[i + 1] = newPixelData[i + 1];
			pixelArray[i + 2] = newPixelData[i];
			pixelArray[i + 3] = 0xff;
		}
		ctx.putImageData(canvasImageData, 0, 0);
	}

	/**
	 * Function that allows the user to set the CAMERA FPS of the Kinect.
	 *
	 * @param {string} a - 	string variable that dictates selection and change kinect param
	 *          			{"fps5", "fps15", "fps30"}
	 *
	 */
	setCameraFPS(a) {
		switch (a) {
			case "fps5":
				this.#CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_5;
				break;

			case "fps15":
				this.#CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_15;
				break;

			case "fps30":
				this.#CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_30;
				break;

			default:
				this.#CameraFPS = KinectAzure.K4A_FRAMES_PER_SECOND_15;
		}
	}

	/**
	 * Function that allows the user to set the COLOR FORMAT of the Kinect.
	 *
	 * @param {string} b - 	string variable that dictates selection and change kinect param
	 *          			{"mjpg", "nv12", "yuy2", "BGRA32"}
	 *
	 */
	setColorFormat(b) {
		switch (b) {
			case "mjpg":
				this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_MJPG;
				break;

			case "nv12":
				this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_NV12;
				break;

			case "yuy2":
				this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_YUY2;
				break;

			case "BGRA32":
				this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32;
				break;

			default:
				this.#ColorFormat = KinectAzure.K4A_IMAGE_FORMAT_COLOR_MJPG;
		}
	}

	/**
	 * Function that allows the user to set the COLOR RESOLUTION of the Kinect.
	 *
	 * @param {string} c - 	string variable that dictates selection and change kinect param
	 *          			{"off", "res720", "res1080", "res1440", "res1536", "res2160",
	 *           			"res3072"}
	 *
	 */
	setColorResolution(c) {
		switch (c) {
			case "off":
				this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_OFF;
				break;

			case "res720":
				this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_720P;
				break;

			case "res1080":
				this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1080P;
				break;

			case "res1440":
				this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1440P;
				break;

			case "res1536":
				this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1536P;
				break;

			case "res2160":
				this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_2160P;
				break;

			case "res3072":
				this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_3072P;
				break;

			default:
				//Set default to 1080P
				this.#ColorResolution = KinectAzure.K4A_COLOR_RESOLUTION_1080P;
		}
	}

	/**
	 * Function that allows the user to set the DEPTH mode of the Kinect.
	 *
	 * @param {string} d - 	string variable that dictates selection and change kinect param
	 *          			{"off", "nfov2x2binned", "nfovunbinned", "wfov2x2binned",
	 *           			"wfovunbinned", "passive"}
	 *
	 */
	setDepthMode(d) {
		switch (d) {
			case "off":
				this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_OFF;
				break;

			case "nfov2x2binned":
				this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_NFOV_2X2BINNED;
				break;

			case "nfovunbinned":
				this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED;
				break;

			case "wfov2x2binned":
				this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_WFOV_2X2BINNED;
				break;

			case "wfovunbinned":
				this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_WFOV_UNBINNED;
				break;

			case "passive":
				this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_PASSIVE_IR;
				break;

			default:
				//Set default to passive IR at 1024x1024
				this.#DepthMode = KinectAzure.K4A_DEPTH_MODE_PASSIVE_IR;
		}
	}

	/**
	 * Function that allows the user to only allow SYNCHRONIZED IMAGES only.
	 *
	 * @param {string} e - 	string variable that dictates cselection and change kinect param
	 *          			{"sync", "nosync"}
	 */
	setSyncMode(e) {
		switch (e) {
			case "sync":
				this.#SyncMode = true;
				break;

			case "nosync":
				this.#SyncMode = false;
				break;

			default:
				//Set default to no synchronization
				this.#SyncMode = false;
		}
	}

	/**
	 * Condensed function that allows the above functions to be set in one call
	 *
	 * @param {string} fps - 	Camera FPS string [see setCameraFPS for details on
	 *                  		passable strings]
	 * @param {string} format - Color Format string [see setColorFormat for details on
	 *                  		passable strings]
	 * @param {string} res -   	Color Resolution string [see setColorResolution for
	 *                  		details on passable strings]
	 * @param {string} depth - 	Depth Mode string [see setDepthMode for details on
	 *                  		passable strings]
	 * @param {string} sync -	Sync Mode string [see setSyncMode for details on
	 *                  		passable strings]
	 */
	changeParameters(fps, format, res, depth, sync) {
		this.setCameraFPS(fps);
		this.setColorFormat(format);
		this.setColorResolution(res);
		this.setDepthMode(depth);
		this.setSyncMode(sync);
	}

	/* Takes in the video and depth data to show image with overlayed joints */
	bodyTrackingFeed() {
		//First check if the Kinect is already running and don't start if it is:
		if (!this.#isKinectListening) {
			this.#isKinectListening = true;
			this.#kinectDevice.startListening((data) => {
				this.#isKinectStreaming = true;
				var outputImageData2 = null;
				if (!outputImageData2 && data.colorImageFrame.width > 0) {
					this.#displayCanvas.width = data.colorImageFrame.width;
					this.#displayCanvas.height = data.colorImageFrame.height;
					outputImageData2 = this.#outputCtx.createImageData(
						this.#displayCanvas.width,
						this.#displayCanvas.height
					);
				}

				if (outputImageData2) {
					this.renderBGRA32ColorFrame(
						this.#outputCtx,
						outputImageData2,
						data.colorImageFrame
					);
				}

				if (data.bodyFrame.bodies) {
					// render the skeleton joints on top of the color feed
					this.#outputCtx.save();
					this.#outputCtx.fillStyle = "red";
					data.bodyFrame.bodies.forEach((body) => {
						//TEST: For each body, write joint data to CSV
						//console.log('BEFORE writing to file');
						// * Commented out while developing other features
						if (this.#jointWriter != null) {
							this.#jointWriter.writeToFile(body.skeleton);
						}
						body.skeleton.joints.forEach((joint) => {
							this.#outputCtx.fillRect(
								joint.colorX,
								joint.colorY,
								10,
								10
							);
						});
					});
					this.#outputCtx.restore();
					//Call recording render frame (checks state in func)
					this.recordFrame();
				}
			});
		}
	}

	/* Render the DepthFrame image as grey scale on canvas */
	renderDepthFrameAsGreyScale(ctx, canvasImageData, imageFrame) {
		const newPixelData = Buffer.from(imageFrame.imageData);
		const pixelArray = canvasImageData.data;
		var depthPixelIndex = 0;
		for (var i = 0; i < canvasImageData.data.length; i += 4) {
			const depthValue =
				(newPixelData[depthPixelIndex + 1] << 8) |
				newPixelData[depthPixelIndex];
			const normalizedValue = this.map(
				depthValue,
				this.#depthModeRange.min,
				this.#depthModeRange.max,
				255,
				0
			);
			pixelArray[i] = normalizedValue;
			pixelArray[i + 1] = normalizedValue;
			pixelArray[i + 2] = normalizedValue;
			pixelArray[i + 3] = 0xff;
			depthPixelIndex += 2;
		}
		ctx.putImageData(canvasImageData, 0, 0);
	}

	/* Change the values on depth to map within the maximum and minimum dist*/
	map(value, inputMin, inputMax, outputMin, outputMax) {
		return (
			((value - inputMin) * (outputMax - outputMin)) /
				(inputMax - inputMin) +
			outputMin
		);
	}

	/**
	 * Start recording current Kinect canvas feed
	 *
	 * ! Note: Assumes connection of canvas elements prior to call.
	 *
	 */
	startRecording() {
		if (!this.#isRecording) {
			// * Slightly inefficient use of memory management (i.e. GC) but good enough for time being
			this.#recorder = new AVRecorder(
				this.#displayCanvas,
				this.#outputCtx,
				null,
				"kinectVideo"
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
	 * Stop recording current Kinect canvas feed
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
	 * @return {HTML Div Element} Single div element that contains all UI elements
	 * 							  for display.
	 */
	getUI() {

		//First create the necessary elements
		// * video, canvas, buttons, video option menus, etc.
		let videoContainer = document.createElement("div");
		let videoButtonsContainer = document.createElement("div");
		let mirrorButtonDiv = document.createElement("div");
		let canvasElement = document.createElement("canvas");
		let mirrorCheckElement = document.createElement("img");
		let mirrorLabelElement = document.createElement("label");
		let recordElement = document.createElement("button");
		let onElement = document.createElement("button");
		let offElement = document.createElement("button");


		canvasElement.width = "1280";
		canvasElement.height = "720";
		canvasElement.classList.add("camera-canvas");

		mirrorCheckElement.src = "../images/checkmarkWhite.png";
		mirrorCheckElement.style.visibility = "hidden";
		mirrorCheckElement.style.width = "16%";
		mirrorCheckElement.style.marginRight = "6%";

		mirrorLabelElement.innerText = "Mirror Video";
		mirrorLabelElement.classList.add("mirrorlabel");

		mirrorButtonDiv.style.backgroundColor = "#11366b";
		mirrorButtonDiv.style.height = "3em";
		mirrorButtonDiv.style.display = "flex";
		mirrorButtonDiv.style.justifyContent = "space-between";
		mirrorButtonDiv.style.alignItems = "center";
		mirrorButtonDiv.style.borderRadius = "5px";
		mirrorButtonDiv.style.cursor = "pointer";
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

		onElement.innerText = "ON";
		this.setDisplayCanvas(canvasElement);
		onElement.onclick = () => {
			this.start();
			this.colorVideoFeed();
		};
		onElement.classList.add("kinect_on");

		offElement.innerText = "OFF";
		offElement.onclick = () => {
			this.stopListeningAndCameras();
		};
		offElement.classList.add("kinect_off");

		videoButtonsContainer.classList.add("camera-buttons-container");
		videoButtonsContainer.appendChild(mirrorButtonDiv);
		videoButtonsContainer.appendChild(recordElement);
		videoButtonsContainer.appendChild(onElement);
		videoButtonsContainer.appendChild(offElement);

		// Attach all to div in the correct order and add to the page
		videoContainer.classList.add("video-inner-container");
		//Kinect specific identifier
		videoContainer.id = this.getDeviceId();

		videoContainer.appendChild(canvasElement);
		videoContainer.appendChild(videoButtonsContainer);

		return videoContainer;
	}

	/**
	 * Getter function to retrieve the object's "label"
	 *
	 * @return {string} Device's English name
	 */
	getLabel() {
		let name = `Azure Kinect (${this.getSerial()})`;
		return name;
	}

	/**
	 * Getter function to retrieve the object's Device ID
	 *
	 * @return {string} Device identifier used in capturing image/sound
	 */
	getDeviceId() {
		return this.getSerial();
	}

	/**
	 * Function used to stop the device from transmitting data/running
	 */
	stop() {
		return this.stopListeningAndCameras().then((resolve, reject) => {
			this.close();
			return new Promise((resolve, reject) => {
				resolve(true);
			});
		});
	}

	/**
	 * Creates and returns all the current device's objects that can be instantiated
	 * from the connected devices.
	 * 
	 * @return {array} List of instantiated device objects 
	 */
	static getDeviceObjects() {
		var kinectDevices = []
		var tempKinect = new Kinect(-1); //Used to call Kinect specific getter methods for general info
		var kinectCount = tempKinect.getInstalledCount();

		for (var i = 0; i < kinectCount; i++) {
			//Create the object, then add to the device array
			let kinect = new Kinect(i);
			kinectDevices.push(kinect);
		}

		return kinectDevices;
	}

} //End of Kinect class
