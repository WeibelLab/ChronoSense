export class Camera {
	#deviceId;
	#videoElement;
	#canvasElement;

	/**
	 *
	 * @param {string} deviceId - Identifier for the device used in input capture.
	 */
	constructor(deviceId) {
		this.#deviceId = deviceId;
	}

	/**
	 * Getter function to retrieve the object's Device ID
	 *
	 * @return {string} - device identifier used in capturing image/sound
	 */
	getDeviceId() {
		return this.#deviceId;
	}

	/**
	 * Function used for setting the <Video> element that will interpret the video content
	 * and the <Canvas> element that will display the video content.
	 *
	 */
	/*
	setInputAndOutput(video, canvas) {
		if (video != null && canvas != null) {
			this.#videoElement = video;
			this.#canvasElement = canvas;
		} else {
			console.log("Function requires a valid video and canvas element");
			return;
		}
	}
	*/

	/**
	 * Function used to stream in specified camera data to the video element that
	 * in turn outputs it to a canvas element.
	 */
	/*
	startCameraStreaming() {
		/* First check that the canvas and video elements are valid */
	/*
		if (this.#videoElement == null || this.#canvasElement == null) {
			console.log(
				"Video and canvas elements not set. Cannot stream video"
			);
			return;
		}

		/* Check if browser allows getting the user's media devices */
	/*
		if (navigator.mediaDevices.getUserMedia) {
			console.log(navigator.mediaDevices.enumerateDevices());
		}
	}
	*/
} //End of Camera Class
