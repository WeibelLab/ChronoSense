const { desktopCapturer } = require('electron');

export class ScreenCaptureDevice {

    #label = "Screen Capture";
    #deviceId = "ScreenCaptureModule";
    #sources = []

    constructor() {
        this.getCaptureSources();
    }

    getCaptureSources() {
        desktopCapturer.getSources({ types: ['window', 'screen'] }).then(sources => {
            this.#sources = sources;
            console.log(sources);
        });
    }

    async startCaptureStream(videoElement) {
        try {
            var stream = await navigator.mediaDevices.getUserMedia({ 
                audio: false,
                video: { 
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: this.#sources[1].id,
                        minWidth: 1280,
                        maxWidth: 1280,
                        minHeight: 720,
                        maxHeight: 720


                    }
                }
            })
            videoElement.srcObject = stream;

        } catch (error) {
            console.log(error);
        }
    }



    // TODO ALL BELOW
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
		let videoElement = document.createElement("video");
		let canvasElement = document.createElement("canvas");
		let recordElement = document.createElement("button");
		let onElement = document.createElement("button");
		let offElement = document.createElement("button");

		//Set correct properties
		//Video element is NOT inserted into DOM since it is used as translation to canvas
		videoElement.width = "1280";
		videoElement.height = "720";
        videoElement.autoplay = true;
        
		//canvasElement.width = "1280";
		//canvasElement.height = "720";
		//canvasElement.classList.add("camera-canvas");

		recordElement.innerText = "Start Recording";
		recordElement.onclick = () => {
			this.startRecording();
		}; //assign function
		recordElement.classList.add("camera-record-btn");

		//this.setInputAndOutput(videoElement, canvasElement)

		onElement.innerText = "ON";
		onElement.onclick = () => {
			this.startCaptureStream(videoElement);
		};
		onElement.classList.add("kinect_on");

		offElement.innerText = "OFF";
		offElement.onclick = () => {
			this.stopCameraStream();
		};
		offElement.classList.add("kinect_off");

		videoButtonsContainer.classList.add("camera-buttons-container");
		videoButtonsContainer.appendChild(recordElement);
		videoButtonsContainer.appendChild(onElement);
		videoButtonsContainer.appendChild(offElement);

		// Attach all to div in the correct order and add to the page
		videoContainer.classList.add("video-inner-container");
		//Camera specific identifier
		videoContainer.id = `${this.getDeviceId()}`;

		//videoContainer.appendChild(canvasElement);
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
	 * Function used to stop the device from transmitting data/running
	 */
	stop() {
		//this.stopCameraStream();
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