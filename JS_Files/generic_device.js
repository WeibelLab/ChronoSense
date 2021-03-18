/*
* Description: File used as a generic device communication class for devices
*              without drivers, sdks, or that use network communcation to send data. 
*
*
*/
// ! CURRENTLY DATA TRANSFER OVER LOCAL TCP WORKING !
// ! TODO: Figure out how to present data in a GUI in a useful way
const net = require('net');

export class GenericDevice {

    #server = null;
    #port = 0;
    #connectedSocket = null;

    /**
     * Constructor function for the GenericDevice class. Sets up the server to 
     * listen for any incoming data.
     * 
     * @param {string} port - port number that the server will listen to. Defaults
     *                        to "0" which will pick a random not-in-use port.
     */
    constructor(port="0") {
        // If port randomly assigned, retrieve with: server.address().port after server.listen() call
        this.#port = port;
        this.#server = net.createServer((socket) => {
            console.log("New Connection");
            socket.write("Echo from server \r\n");
            this.#connectedSocket = socket;
            socket.on("data", (data) => {
                //Use the incoming data in some way
                console.log(data);
            });
        });
        this.#server.on("listening", () => {
            console.log(this.#server.address());
        });
        this.#server.listen(port, 'localhost');
        
    }


    // * Start Required Methods for a Chronosense Device Add-On
	
	/**
	 * Function that creates all the UI elements needed for one Generic Device &
	 * wraps them all into a single div returned for display.
	 * 
	 * @return {HTML Div Element} Single div element that contains all UI elements
	 * 							  for display.
	 */
	getUI() {
		// ! TODO: List of things I might display in the UI:
		// ! Port that the device is listening on
		// ! A feed that updates with incoming data
		// ! Some sort of indication that the connection is active

		//First create the necessary elements
		// * video, canvas, buttons, video option menus, etc.
		let videoContainer = document.createElement("div");
		let videoButtonsContainer = document.createElement("div");
		let canvasElement = document.createElement("canvas");
		let recordElement = document.createElement("button");
		let onElement = document.createElement("button");
		let offElement = document.createElement("button");


		canvasElement.width = "1280";
		canvasElement.height = "720";
		canvasElement.classList.add("camera-canvas");
		/*
		recordElement.innerText = "Start Recording";
		recordElement.onclick = () => {
			this.startRecording();
		}; //assign function
		recordElement.classList.add("camera-record-btn");
		*/

		/*
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
		*/

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
	}

	/**
	 * Getter function to retrieve the object's Device ID
	 *
	 * @return {string} Device identifier used in capturing image/sound
	 */
	getDeviceId() {
		// ! TEMP
		return "serialDeviceTester";
	}

	/**
	 * Function used to stop the device from transmitting data/running
	 */
	stop() {
	}

	/**
	 * Creates and returns all the current device's objects that can be instantiated
	 * from the connected devices.
	 * 
	 * @return {array} List of instantiated device objects 
	 */
	static getDeviceObjects() {
		
	}


} //End of GenericDevice class