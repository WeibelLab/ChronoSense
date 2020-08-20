export class Camera {
	#deviceId = null;
	#groupId = null;
	#kind = null;
	#label = null;
	#videoElement = null;
	#canvasElement = null;

	#videoResolutionWidth = 1280; //Default to 4k
	#videoResolutionHeight = 720; //Default to 4k

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
	 * Getter function to retrieve the object's Device ID
	 *
	 * @return {string} - Device identifier used in capturing image/sound
	 */
	getDeviceId() {
		return this.#deviceId;
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
	 * Getter function to retrieve the object's "label"
	 *
	 * @return {string} - Device's English name
	 */
	getLabel() {
		return this.#label;
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
	// ! 4. Start streaming to set canvas

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

		var canvasContext = this.#canvasElement.getContext("2d");
		var canvasWidth = this.#canvasElement.width;
		var canvasHeight = this.#canvasElement.height;
		var stream = null;

		/* Try to open cameras and start the stream */
		try {
			stream = await navigator.mediaDevices.getUserMedia(constraints);
			console.log(`type of stream: ${typeof stream}`);
			this.#videoElement.srcObject = stream;

			requestAnimationFrame(() => {
				this.drawToCanvas(
					this.#videoElement,
					canvasContext,
					canvasWidth,
					canvasHeight
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
		canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
		canvasContext.drawImage(video, 0, 0, canvasWidth, canvasHeight);
		requestAnimationFrame(() => {
			this.drawToCanvas(
				this.#videoElement,
				canvasContext,
				canvasWidth,
				canvasHeight
			);
		});
	}
} //End of Camera Class
