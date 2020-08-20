// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require("electron").remote;
const usb = require("usb");
import { Kinect } from "./kinect.js";
import { Camera } from "./camera.js";
import { AudioRecorder } from "./audio_recorder.js";

//Variables of HTML elements for later manipulation
const btnHome = document.getElementById("homePage");
const btnCamera = document.getElementById("cameraPage");
const btnKinect = document.getElementById("kinectPage");
const btnKinectBodyTracking = document.getElementById("kinectBodyPage");
const btnAbout = document.getElementById("aboutPage");
const btnsKinectOn = document.getElementsByClassName("kinect_on");
const btnsKinectOff = document.getElementsByClassName("kinect_off");

//Used in Kinect Class for displaying content
//Send through constructor to Kinect class object
const displayCanvas = document.getElementById("video_canvas"); //For Kinect page
const displayCanvas2 = document.getElementById("video_canvas2"); //For Camera page

//Used in camera methods
const recordingButton = document.getElementById("record");
const camVideo = document.getElementById("camera-video");
const cameraDropdown = document.getElementById("dropdown");

//Arrays for all devices
var kinectDevices = []; //All from class Kinect
var cameraDevices = []; //All from class Camera

//Constants for application to know which "page" is displayed.
const HOME_PAGE_NUM = 0;
const CAMERA_PAGE_NUM = 1;
const KINECT_PAGE_NUM = 2;
const KINECT_BODY_PAGE_NUM = 3;
const ABOUT_PAGE_NUM = 4;

//Holds a value for which page is open for the device so it knows which
//functions to call from which page.
//Legend:
// 0 - Home
// 1 - Camera
// 2 - Kinect
// 3 - Kinect Body Tracking
// 4 - About
let currentlyOpenPage = false;

// When document has loaded, initialize
document.onreadystatechange = () => {
	if (document.readyState == "complete") {
		draw();
		handleWindowControls();
		setupDevices();
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
	 * Buttons: homePage, cameraPage, kinectPage, kinectBodyPage, aboutPage
	 */
	btnHome.addEventListener("click", (event) => {
		console.log("YOU ARE HOME");
		checkClosingWindowAndChangeContent(HOME_PAGE_NUM);
	});
	btnCamera.addEventListener("click", (event) => {
		console.log("YOU ARE CAMERA");
		checkClosingWindowAndChangeContent(CAMERA_PAGE_NUM);
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

	//! TODO: Remove buttons/functionality and attach later to specific devices
	//! 	  when streaming from them.
	/*
	 * Add events below to buttons and items within "pages."
	 */
	//Add to each element in the kinect button class
	for (let i = 0; i < btnsKinectOn.length; i++) {
		btnsKinectOn[i].addEventListener("click", (event) => {
			kinectDevices[0].setDisplayCanvas(displayCanvas);
			kinectDevices[0].start();

			if (currentlyOpenPage == KINECT_PAGE_NUM) {
				kinectDevices[0].colorVideoFeed();
			} else if (currentlyOpenPage == KINECT_BODY_PAGE_NUM) {
				kinectDevices[0].bodyTrackingFeed();
			}
		});
	}

	//! TODO: Remove buttons/functionality and attach later to specific devices
	//! 	  when streaming from them.
	for (let i = 0; i < btnsKinectOff.length; i++) {
		btnsKinectOff[i].addEventListener("click", (event) => {
			kinectDevices[0].stopListeningAndCameras();
		});
	}

	/* Add event everytime the CAMERA drop down menu is selected */
	dropdown.addEventListener("change", (evt) => {
		/* CURRENTLY ONLY VIDEO SO JUST START STREAMING */
	});

	/* Add event to refresh Kinect Devices on push - WORKS*/
	document
		.getElementById("kinect-refresh-btn")
		.addEventListener("click", (evt) => {
			refreshKinectDevices();
		});
} //End of handleWindowControls()

/**
 * Searches for all devices connected on startup for organizing and initializing.
 * Also, it adds events for plugging and unplugging USB devices.
 *
 */
function setupDevices() {
	/*
	 * Complete an initial scan for Kinect devices already plugged in and
	 * populate the Kinect Devices list in the UI.
	 *
	 * Note: When opening a device, only use the appropriate API/SDK associated
	 * with it. (i.e. For Kinects, use kinect-azure NOT USB directly)
	 *
	 */
	var tempKinect = new Kinect(-1); //Used to call Kinect specific getter methods for general info
	var kinectCount = tempKinect.getInstalledCount();

	//i represents the Kinect indices
	for (var i = 0; i < kinectCount; i++) {
		//Create the object, then add to the device array
		createKinect(i, kinectDevices);

		let newDeviceElem = document.createElement("a");
		newDeviceElem.title = kinectDevices[i].getSerial(); //serial
		newDeviceElem.text = "Kinect (" + kinectDevices[i].getSerial() + ")";
		document
			.getElementById("kinect-dropdown-content")
			.appendChild(newDeviceElem);
	}

	/*
	 * Complete an initial scan for Camera devices already plugged in and
	 * populate the Camera Devices list in the UI.
	 *
	 * Note: When opening a device, only use the appropriate API/SDK associated
	 * with it. (i.e. For Kinects, use kinect-azure NOT USB directly)
	 *
	 */
	getUniqueVideoInputDevices().then((currentDevices) => {
		console.log(currentDevices.length);
		console.log(currentDevices);

		for (var k = 0; k < currentDevices.length; k++) {
			if (
				!(
					currentDevices[k].label.includes("kinect") ||
					currentDevices[k].label.includes("Kinect")
				)
			) {
				//ONLY add devices that are NOT Kinects (use Kinect SDK instead)
				createCamera(cameraDevices, currentDevices[k]);
			}
		} //All camera devices added to the correct array
		console.log(cameraDevices);
	});

	/*
	 * Add events for plugging and unplugging USB devices (kinect, camera, etc.)
	 */
	// ! TODO: Set up handling of plugging in devices
	usb.on("attach", function (device) {
		//The below correctly gets the serial number of the device
		try {
			//Check for Kinect and then update the device in the dropdown menu.
			//Depth camera on Kinect is the only one with Serial number attached
			if (
				device.deviceDescriptor.idVendor === 0x045e &&
				device.deviceDescriptor.idProduct === 0x097c
			) {
				console.log("CONNECTED A KINECT");
				//Don't do anything immediately. Wait for user to select refresh button.
			} else {
				// ! TODO: All other device actions
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

	// ! TODO: Set up handling of unplugging devices
	usb.on("detach", function (device) {
		//Remove disconnected device by their device identifier (through usb)
		try {
			//Check for Kinect and then delete from list of devices
			if (
				device.deviceDescriptor.idVendor === 0x045e &&
				device.deviceDescriptor.idProduct === 0x097c
			) {
				console.log("DISCONNECTED A KINECT");
				//Don't do anything immediately. Wait for user to select refresh button.
			} else {
				// ! TODO: All other device actions
			}
		} catch (error) {}
	}); //End of USB detach event
}

/**
 * Function that checks which windows are being closed out in order to call
 * the correct functions from their respective js files to close out running
 * device functionality before switching.
 *
 * Also serves as the function that manipulates the webviewer!
 *
 * @param {number} newPageNum - Holds one of the global constant page values to
 *                      		determine what should be displayed or hidden.
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

		case CAMERA_PAGE_NUM:
			currentlyOpenPage = CAMERA_PAGE_NUM;
			changeWindowFeatures(CAMERA_PAGE_NUM);

			populateCameraList(cameraDropdown);
			/*
			await kinect.stopListeningAndCameras(); 
			*/
			break;

		case KINECT_PAGE_NUM:
			currentlyOpenPage = KINECT_PAGE_NUM;
			changeWindowFeatures(KINECT_PAGE_NUM);
			// ! TEMP Hard Coded - For example and testing; change later!
			kinectDevices[0].setDisplayCanvas(displayCanvas);
			kinectDevices[0].start();
			kinectDevices[0].colorVideoFeed();

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
 * @param {number} pageNum - Page number to indicate case choice and manipulate
 *                  		 DOM elements
 */
function changeWindowFeatures(pageNum) {
	switch (pageNum) {
		case KINECT_PAGE_NUM:
			document.getElementById("camera-page").style.display = "none";
			document.getElementById("kinect-page").style.display = "block";
			document.getElementById("kinect-body-page").style.display = "none";
			break;

		case KINECT_BODY_PAGE_NUM:
			document.getElementById("camera-page").style.display = "none";
			document.getElementById("kinect-page").style.display = "none";
			document.getElementById("kinect-body-page").style.display = "block";
			break;

		case CAMERA_PAGE_NUM:
			document.getElementById("camera-page").style.display = "block";
			document.getElementById("kinect-page").style.display = "none";
			document.getElementById("kinect-body-page").style.display = "none";
			break;

		default:
			//Default to home page
			document.getElementById("camera-page").style.display = "none";
			document.getElementById("kinect-page").style.display = "none";
			document.getElementById("kinect-body-page").style.display = "none";
	}
} //End of changeWindowFeatures

/**
 * Function used to return an array of all audio/video inputs capable of
 * display/recording. The ONLY filtering is looking for input devices.
 *
 * @return {array} 	of objects with each device's properties
 *          		-> "deviceId, groupId, kind, label"
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
 * @return {Promise} - A promise that resolves to an array of objects with each
 * 						device's properties -> "deviceId, groupId, kind, label"
 */
async function getUniqueInputDevices() {
	return navigator.mediaDevices.enumerateDevices().then((devices) => {
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
		return new Promise((resolve, reject) => {
			resolve(uniqueInputDevices);
		});
	});
}

/**
 * Function used to return an array of all unique video inputs capable
 * of display/recording.
 *
 * @return {Promise} - A promise that resolves to an array of objects with each
 * 					   device's properties -> "deviceId, groupId, kind, label"
 */
async function getUniqueVideoInputDevices() {
	return navigator.mediaDevices.enumerateDevices().then((devices) => {
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
		return new Promise((resolve, reject) => {
			resolve(uniqueInputDevices);
		});
	});
}

/**
 * Function used to populate the camera dropdown menu with all unique input
 * devices
 *
 * @param {HTML Select Element} dropdown - Dropdown menu on HTML page
 */
function populateCameraList(dropdown) {
	/* First clear the list */
	clearDropdown(dropdown);
	let selectionMessage = document.createElement("option");
	selectionMessage.value = "";
	selectionMessage.disabled = true;
	selectionMessage.selected = true;
	selectionMessage.hidden = true;
	selectionMessage.textContent = "Select Device";
	document.getElementById("dropdown").appendChild(selectionMessage);

	//Use Kinect device list and Camera device list to populate dropdown
	//Kinect Devices
	for (var i = 0; i < kinectDevices.length; i++) {
		console.log(
			`Creating dropdown option: Azure Kinect (${kinectDevices[
				i
			].getSerial()})`
		);
		let option = document.createElement("option");
		option.text = `Azure Kinect (${kinectDevices[i].getSerial()})`;
		option.value = kinectDevices[i].deviceId;
		dropdown.add(option);
	}
	//Camera Devices
	for (var j = 0; j < cameraDevices.length; j++) {
		console.log(
			`Creating dropdown option: Camera (${cameraDevices[j].getLabel()})`
		);
		let option = document.createElement("option");
		option.text = cameraDevices[j].getLabel();
		option.value = cameraDevices[j].getDeviceId();
		dropdown.add(option);
	}
}

/**
 * Function that clears all of the options in a dropdown menu
 *
 * @param {HTML Select Element} dropdown - Dropdown menu on HTML page
 */
function clearDropdown(dropdown) {
	var i,
		length = dropdown.options.length;
	for (i = length - 1; i >= 0; i--) {
		dropdown.remove(i);
	}
}

/**
 * Refreshes the entire list of Kinect Devices. Deleting missing devices and
 * adding new devices.
 */
function refreshKinectDevices() {
	destroyAllKinects(kinectDevices); //Close and clear all devices
	//Remove all kinect list <a> elements
	//Currently an ad hoc (hard coded) method for specific app page and will change later
	var myList = document.getElementById("kinect-dropdown-content");
	while (myList.firstElementChild) {
		myList.removeChild(myList.lastElementChild);
	}

	var tempKinect = new Kinect(-1); //Used to call Kinect specific getter methods for general info
	var kinectCount = tempKinect.getInstalledCount();

	//i represents the Kinect indices
	for (var i = 0; i < kinectCount; i++) {
		//Create the object, then add to the device array
		createKinect(i, kinectDevices);

		let newDeviceElem = document.createElement("a");
		newDeviceElem.title = kinectDevices[i].getSerial(); //serial
		newDeviceElem.text = "Kinect (" + kinectDevices[i].getSerial() + ")";
		document
			.getElementById("kinect-dropdown-content")
			.appendChild(newDeviceElem);
	}
}

/**
 * Creats a Kinect object and adds it to the array of devices
 *
 * @param {number} index - Index of the Kinect Device in the SDK
 * @param {array} deviceArr - Array of Kinect devices where new device is added
 */
function createKinect(index, deviceArr) {
	//Create the object, then add to the device array
	let kinect = new Kinect(index);
	deviceArr.push(kinect);
}

/**
 * Destroys a Kinect object and deletes it from the array of devices
 *
 * @param {string} serial - Serial number of the Kinect Device to destroy
 * @param {array} deviceArr - Array of Kinect devices where specific device is stored
 */
function destroyKinect(serial, deviceArr) {
	console.log(`[chronosense destroyKinect] - serial #: ${serial}`);
	//Check if a device has specified serial number
	let i,
		length = deviceArr.length;
	for (i = 0; i < length; i++) {
		if (serial.localeCompare(deviceArr[i].getSerial()) == 0) {
			deviceArr[i].stopListeningAndCameras();
			deviceArr[i].close();
			deviceArr = deviceArr.splice(i, 1);
			return;
		}
	}
}

/**
 * Destroy all of the kinects in the device array.
 *
 * @param {array} deviceArr - Array of Kinect devices
 */
function destroyAllKinects(deviceArr) {
	//Go through all kinects closing and clearing the array
	let i,
		length = deviceArr.length;
	for (i = 0; i < length; i++) {
		deviceArr[i].stopListeningAndCameras();
		deviceArr[i].close();
	}

	deviceArr.length = 0;
}

/**
 * Create a Camera object and add it to the array of devices
 *
 * @param {array} deviceArr - Array of Camera devices
 * @param {string} device - Device object retrieved from getInputDevices containing necessary properties
 */
function createCamera(deviceArr, device) {
	var camera = new Camera(
		device.deviceId,
		device.groupId,
		device.kind,
		device.label
	);
	deviceArr.push(camera);
}

/**
 * Destroys a Camera object and deletes it from the array of devices
 *
 * @param {array} deviceArr - Array of Camera devices where specific device is stored
 * @param {string} deviceId - Device identifier for local video devices
 */
function destroyCamera(deviceArr, deviceId) {
	console.log(`[chronosense destroyCamera] -  deviceId: ${deviceId}`);
	//Check if a device has specified deviceId
	let i,
		length = deviceArr.length;
	for (i = 0; i < length; i++) {
		if (deviceId.localeCompare(deviceArr[i].getDeviceId()) == 0) {
			// ! TODO: Add shutdown process of Camera object before deletion
			deviceArr = deviceArr.splice(i, 1);
			return;
		}
	}
}

/**
 * Destroy all of Cameras in the device array.
 *
 * @param {array} deviceArr - Array of Camera devices
 */
function destroyAllCameras(deviceArr) {
	//Go through all Cameras closing and clearing the array
	let i,
		length = deviceArr.length;
	for (i = 0; i < length; i++) {
		// ! TODO: Add shutdown process of Camera object before deletion
	}

	deviceArr.length = 0;
}

/**
 * Function that is called to make sure all devices are properly shut down
 * before the application shuts down.
 * Acts as an EventHandler for Node.
 */
global.onbeforeunload = () => {
	//Close all Kinects
	for (var i = 0; i < kinectDevices.length; i++) {
		kinectDevices[i].close();
	}
};
