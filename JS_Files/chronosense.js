// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require("electron").remote;
const usb = require("usb");
import { Kinect } from "./kinect.js";
import { Webcam } from "./webcam.js";

//Variables of HTML elements for later manipulation
const btnHome = document.getElementById("homePage");
const btnWebcam = document.getElementById("webcamPage");
const btnKinect = document.getElementById("kinectPage");
const btnKinectBodyTracking = document.getElementById("kinectBodyPage");
const btnAbout = document.getElementById("aboutPage");
const btnsKinectOn = document.getElementsByClassName("kinect_on");
const btnsKinectOff = document.getElementsByClassName("kinect_off");

//Used in Kinect Class for displaying content
//Send through constructor to Kinect class object
const displayCanvas = document.getElementById("video_canvas");
const displayCanvas2 = document.getElementById("video_canvas2");
const displayCanvas3 = document.getElementById("video_canvas3");

//Used in webcam methods
const recordingButton = document.getElementById("record");
const camVideo = document.getElementById("webcam-video");
const webcamDropdown = document.getElementById("dropdown");

//Arrays for all devices
var kinectDevices = []; //All from class Kinect
var otherVideoDevices = []; //All from class Webcam

//Constants for application to know which "page" is displayed.
const HOME_PAGE_NUM = 0;
const WEBCAM_PAGE_NUM = 1;
const KINECT_PAGE_NUM = 2;
const KINECT_BODY_PAGE_NUM = 3;
const ABOUT_PAGE_NUM = 4;

//Holds a value for which page is open for the device so it knows which
//functions to call from which page.
//Legend:
// 0 - Home
// 1 - Webcam
// 2 - Kinect
// 3 - Kinect Body Tracking
// 4 - About
let currentlyOpenPage = false;

// When document has loaded, initialize
document.onreadystatechange = () => {
	if (document.readyState == "complete") {
		draw();
		handleWindowControls();
	}
};

/**
 * Handles all window controls from app specific minimization to page
 * navigation. Called above when the page is ready to be displayed.
 *
 */
async function handleWindowControls() {
	let win = remote.getCurrentWindow();

	// Make minimise/maximise/restore/close buttons work when they are clicked
	document.getElementById("min-button").addEventListener("click", (event) => {
		win.minimize();
	});

	document.getElementById("max-button").addEventListener("click", (event) => {
		win.maximize();
	});

	document
		.getElementById("restore-button")
		.addEventListener("click", (event) => {
			win.unmaximize();
		});

	document
		.getElementById("close-button")
		.addEventListener("click", (event) => {
			win.close();
		});

	// Toggle maximise/restore buttons when maximisation/unmaximisation occurs
	toggleMaxRestoreButtons();
	win.on("maximize", toggleMaxRestoreButtons);
	win.on("unmaximize", toggleMaxRestoreButtons);

	function toggleMaxRestoreButtons() {
		if (win.isMaximized()) {
			document.body.classList.add("maximized");
		} else {
			document.body.classList.remove("maximized");
		}
	}

	/*
	 * Set of functions below are for clicking buttons <a> elements on the main
	 * navigation bar for the application. Mainly to switch src of webview to
	 * change the contents of the page.
	 *
	 * Buttons: homePage, webcamPage, kinectPage, kinectBodyPage, aboutPage
	 */
	btnHome.addEventListener("click", (event) => {
		console.log("YOU ARE HOME");
		checkClosingWindowAndChangeContent(HOME_PAGE_NUM);
	});
	btnWebcam.addEventListener("click", (event) => {
		console.log("YOU ARE WEBCAM");
		checkClosingWindowAndChangeContent(WEBCAM_PAGE_NUM);
	});

	btnKinect.addEventListener("click", (event) => {
		console.log("YOU ARE KINECT CAM");
		checkClosingWindowAndChangeContent(KINECT_PAGE_NUM);
	});

	btnKinectBodyTracking.addEventListener("click", (event) => {
		console.log("YOU ARE BODY TRACKING");
		checkClosingWindowAndChangeContent(KINECT_BODY_PAGE_NUM);
	});

	btnAbout.addEventListener("click", (event) => {
		console.log("YOU ARE ABOUT");
		checkClosingWindowAndChangeContent(ABOUT_PAGE_NUM);
	});

	/*
	 * Add events below to buttons and items within "pages."
	 */
	//Add to each element in the kinect button class
	for (let i = 0; i < btnsKinectOn.length; i++) {
		btnsKinectOn[i].addEventListener("click", async (event) => {
			//If no kinect object, create one
			if (kinect == null) {
				//kinect = new Kinect(displayCanvas, displayCanvas2, displayCanvas3);
			}

			await kinect.start(); //Start the Kinect
			if (currentlyOpenPage == KINECT_PAGE_NUM) {
				kinect.colorVideoFeed();
			} else if (currentlyOpenPage == KINECT_BODY_PAGE_NUM) {
				kinect.bodyTrackingFeed();
			}
		});
	}

	for (let i = 0; i < btnsKinectOff.length; i++) {
		btnsKinectOff[i].addEventListener("click", (event) => {
			kinect.stopListeningAndCameras();
		});
	}

	/* Add event everytime the webcam drop down menu is selected */
	dropdown.addEventListener("change", (evt) => {
		/* CURRENTLY ONLY VIDEO SO JUST START STREAMING */
	});

	/*
	 * Complete an initial scan for Kinect devices already plugged in and
	 * populate the Kinect Devices list in the UI.
	 *
	 * Note: When opening a device, only use the appropriate API/SDK associated
	 * with it. (i.e. For Kinects, use kinect-azure NOT USB directly)
	 *
	 */
	var tempKinect = Kinect(); //Used to call Kinect specific getter methods for general info
	var kinectCount = await tempKinect.getInstalledCount();

	//i represents the Kinect indices
	for (var i = 0; i < kinectCount; i++) {
		//Create the object, then add to the device array
		let kinect = new Kinect(serial);
		deviceArr.push(kinect);
	}

	/* Steps to add Kinect device to the application page:
			//Add kinect to drop down menu
			let newDeviceElem = document.createElement("a");
			newDeviceElem.title = data.toString(); //serial
			newDeviceElem.text = "Kinect (" + data + ")";
			newDeviceElem.id = currDeviceAddress;
			document
				.getElementById("kinect-dropdown-content")
				.appendChild(newDeviceElem);
	*/

	/*
	 * Add events for plugging and unplugging USB devices (kinect, webcam, etc.)
	 */
	usb.on("attach", function (device) {
		//The below correctly gets the serial number of the device
		try {
			//Check for Kinect and then update the device in the dropdown menu.
			//Depth camera on Kinect is the only one with Serial number attached
			if (
				device.deviceDescriptor.idVendor === 0x045e &&
				device.deviceDescriptor.idProduct === 0x097c
			) {
				var kinectSerialNumber = null;
				console.log("CONNECTED A KINECT");
				//console.log(device.deviceDescriptor);
				console.log(device.deviceAddress);
				device.open();

				device.getStringDescriptor(
					device.deviceDescriptor.iSerialNumber,
					(error, data) => {
						if (data != null) {
							console.log(data);
							kinectSerialNumber = data.toString();
							//Add kinect to drop down menu
							let newDeviceElem = document.createElement("a");
							newDeviceElem.title = data.toString(); //serial
							newDeviceElem.text = "Kinect (" + data + ")";
							newDeviceElem.id = device.deviceAddress;
							document
								.getElementById("kinect-dropdown-content")
								.appendChild(newDeviceElem);
						} else {
							console.log("NO DATA TO TRANSFER");
						}
					}
				);
				device.close();
				//Call after closing since USB can't be open in multiple apps/apis
				if (kinectSerialNumber != null) {
					createKinect(kinectSerialNumber, kinectDevices);
				}
			}
		} catch (error) {
			//Device is unknown by installed drivers
			/*
			console.log(
				"Serial number of device NOT read due to lack of installed drivers"
            );
            */
		}
	}); //End of USB attach event

	usb.on("detach", function (device) {
		//Remove disconnected device by their device identifier (through usb)
		try {
			//Check for Kinect and then delete from list of devices
			if (
				device.deviceDescriptor.idVendor === 0x045e &&
				device.deviceDescriptor.idProduct === 0x097c
			) {
				console.log("DISCONNECTED A KINECT");
				console.log(device.deviceAddress);

				let deletedElem = document.getElementById(device.deviceAddress);
				destroyKinect(deletedElem.title, kinectDevices);
				deletedElem.parentNode.removeChild(deletedElem);
			}
		} catch (error) {}
	}); //End of USB detach event
} //End of handleWindowControls()

/**
 * Function that checks which windows are being closed out in order to call
 * the correct functions from their respective js files to close out running
 * device functionality before switching.
 *
 * Also serves as the function that manipulates the webviewer!
 *
 * Parameters:
 *      newPageNum -    Holds one of the global constant page values to
 *                      determine what should be displayed or hidden.
 */
async function checkClosingWindowAndChangeContent(newPageNum) {
	//Check which window is closing; if changing to same as before, don't
	//refresh
	if (currentlyOpenPage == newPageNum) {
		return;
	}

	//Manipulate webviewer to change for NEW window parameters.
	switch (newPageNum) {
		case HOME_PAGE_NUM:
			currentlyOpenPage = HOME_PAGE_NUM;
			changeWindowFeatures();
			/*
			await kinect.stopListeningAndCameras();
			*/
			break;

		case WEBCAM_PAGE_NUM:
			currentlyOpenPage = WEBCAM_PAGE_NUM;
			changeWindowFeatures(WEBCAM_PAGE_NUM);

			populateWebcamList(webcamDropdown);
			/*
			await kinect.stopListeningAndCameras(); 
			*/
			break;

		case KINECT_PAGE_NUM:
			currentlyOpenPage = KINECT_PAGE_NUM;
			changeWindowFeatures(KINECT_PAGE_NUM);

			/*
			await kinect.stopListeningAndCameras();
			kinect.changeParameters(
				"fps30",
				"BGRA32",
				"res1080",
				"off",
				"nosync"
			);
			await kinect.start();
			kinect.colorVideoFeed();
			*/
			/* Attempt some sort of check or cycle to restart
            // until the port is open.
            while(!kinect.getIsStreaming()){
                await kinect.stopListeningAndCameras();
                kinect.start();
                kinect.colorVideoFeed();
            }
            */

			break;

		case KINECT_BODY_PAGE_NUM:
			currentlyOpenPage = KINECT_BODY_PAGE_NUM;
			changeWindowFeatures(KINECT_BODY_PAGE_NUM);

			/*
			await kinect.stopListeningAndCameras();
			kinect.changeParameters(
				"fps30",
				"BGRA32",
				"res1080",
				"wfov2x2binned",
				"nosync"
			);
			await kinect.start();
			kinect.bodyTrackingFeed();
			*/
			break;

		case ABOUT_PAGE_NUM:
			currentlyOpenPage = ABOUT_PAGE_NUM;
			changeWindowFeatures();
			/*
			await kinect.stopListeningAndCameras();
			*/
			break;
	} //End of NEW page switch
}

/**
 * Changes certain aspects of the application based on the current "page" that
 * the application is showing.
 *
 * Parameters:
 *      pageName - Page number to indicate case choice and manipulate
 *                  DOM elements to manipulate
 */
function changeWindowFeatures(pageNum) {
	switch (pageNum) {
		case KINECT_PAGE_NUM:
			document.getElementById("webcam-page").style.display = "none";
			document.getElementById("kinect-page").style.display = "block";
			document.getElementById("kinect-body-page").style.display = "none";
			break;

		case KINECT_BODY_PAGE_NUM:
			document.getElementById("webcam-page").style.display = "none";
			document.getElementById("kinect-page").style.display = "none";
			document.getElementById("kinect-body-page").style.display = "block";
			break;

		case WEBCAM_PAGE_NUM:
			document.getElementById("webcam-page").style.display = "block";
			document.getElementById("kinect-page").style.display = "none";
			document.getElementById("kinect-body-page").style.display = "none";
			break;

		default:
			//Default to home page
			document.getElementById("webcam-page").style.display = "none";
			document.getElementById("kinect-page").style.display = "none";
			document.getElementById("kinect-body-page").style.display = "none";
	}
} //End of changeWindowFeatures

/**
 * Function used to return an array of all audio/video inputs capable of
 * display/recording. The ONLY filtering is looking for input devices.
 *
 * Returns: array of objects with each device's properties
 *          -> "deviceId, groupId, kind, label"
 */
async function getInputDevices() {
	var devices = await navigator.mediaDevices.enumerateDevices();
	var inputDevices = [];
	for (var i = 0; i < devices.length; i++) {
		if (
			devices[i].kind.localeCompare("audioinput") == 0 ||
			devices[i].kind.localeCompare("videoinput") == 0
		) {
			inputDevices.push(devices[i]);
		}
	}
	console.log(inputDevices);
	return inputDevices;
}

/**
 * Function used to return an array of all unique audio/video inputs capable
 * of display/recording.
 *
 * Returns: array of objects with each device's properties
 *          -> "deviceId, groupId, kind, label"
 */
async function getUniqueInputDevices() {
	var devices = await navigator.mediaDevices.enumerateDevices();
	var uniqueInputDevices = [];
	for (var i = 0; i < devices.length; i++) {
		if (
			devices[i].kind.localeCompare("audioinput") == 0 ||
			devices[i].kind.localeCompare("videoinput") == 0
		) {
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
				//identifier.
				uniqueInputDevices.push(devices[i]);
			}
		}
	}
	console.log(uniqueInputDevices);
	return uniqueInputDevices;
}

/**
 * Function used to return an array of all unique video inputs capable
 * of display/recording.
 *
 * Returns: array of objects with each device's properties
 *          -> "deviceId, groupId, kind, label"
 */
async function getUniqueVideoInputDevices() {
	var devices = await navigator.mediaDevices.enumerateDevices();
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
	console.log(uniqueInputDevices);
	return uniqueInputDevices;
}

/**
 * Function used to populate the webcam dropdown menu with all unique input
 * devices
 */
async function populateWebcamList(dropdown) {
	/* First clear the list */
	clearDropdown(dropdown);
	let selectionMessage = document.createElement("option");
	selectionMessage.value = "";
	selectionMessage.disabled = true;
	selectionMessage.selected = true;
	selectionMessage.hidden = true;
	selectionMessage.textContent = "Select Device";
	document.getElementById("dropdown").appendChild(selectionMessage);

	var currentDevices = await getUniqueVideoInputDevices();
	for (var i = 0; i < currentDevices.length; i++) {
		var option = document.createElement("option");
		option.text = currentDevices[i].label;
		option.value = currentDevices[i].deviceId;
		dropdown.add(option);
	}
}

/**
 * Function that clears all of the options in a dropdown menu
 */
function clearDropdown(dropdown) {
	var i,
		length = dropdown.options.length;
	for (i = length - 1; i >= 0; i--) {
		dropdown.remove(i);
	}
}

/**
 * Creats a Kinect object and adds it to the array of devices
 *
 * @param {number} - Index of the Kinect Device in the SDK
 * @param {array} - Array of Kinect devices where new device is added
 */
function createKinect(index, deviceArr) {
	//Create the object, then add to the device array
	let kinect = new Kinect(index);
	deviceArr.push(kinect);
}

/**
 * Destroys a Kinect object and deletes it to the array of devices
 *
 * @param {string} - Serial number of the Kinect Device to destroy
 * @param {array} - Array of Kinect devices where specific device is stored
 */
function destroyKinect(serial, deviceArr) {
	console.log(`[chronosense destroyKinect] - serial #: ${serial}`);
	//Check if a device has specified serial number
	let i,
		length = deviceArr.length;
	for (i = 0; i < length; i++) {
		if (serial.localeCompare(deviceArr[i].getSerial()) == 0) {
			deviceArr[i].close();
			deviceArr = deviceArr.splice(i, 1);
			return;
		}
	}
}

/**
 * Function that is called to make sure all devices are properly shut down
 * before the application shuts down.
 * Acts as an EventHandler for Node.
 */
global.onbeforeunload = () => {};
