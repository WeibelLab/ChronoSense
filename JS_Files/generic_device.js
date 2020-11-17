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