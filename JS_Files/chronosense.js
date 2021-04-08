// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require("electron").remote;
//import { Kinect } from "./kinect.js";   ** Commented out due to Kinect currently treated as generic camera
import { Camera } from "./camera.js";
import { AudioRecorder } from "./audio_recorder.js";
import { GenericDevice } from "./generic_device.js";
import { ScreenCaptureDevice } from "./screen_capture_device.js";

//Arrays for all devices
var devices = [] // Generic Device Model -> Move to this instead of specific device arrays


// When document has loaded, initialize
document.onreadystatechange = () => {
	if (document.readyState == "complete") {
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

	/* Add event to open and close Camera drop down menus seamlessly */
	document.addEventListener("click", (evt) => {
		openCloseCameraDropMenus(evt);
	}); //End of dropdown open listener

	// * Attach refresh cameras for testing * CHANGE LATER - TEMP *

	document
		.getElementById("refresh-cameras-btn")
		.addEventListener("click", () => {
			refreshCameraDevices();
		});
} //End of handleWindowControls()

/**
 * Searches for all devices connected on startup for organizing and initializing.
 * Also, it adds events for plugging and unplugging USB devices.
 *
 */
async function setupDevices() {
	/*
	 * Complete an initial scan for Kinect devices already plugged in and
	 * populate the Kinect Devices list in the UI.
	 *
	 * Note: When opening a device, only use the appropriate API/SDK associated
	 * with it. (i.e. For Kinects, use kinect-azure NOT USB directly)
	 *
	 */
	// ! For now, let all devices be generic camera
	// ! To change back to Kinect and Camera as separate. Uncomment line below and go to
	// ! camera.js and uncomment lines in getDeviceObjects() that filters out Kinect devices.
	//devices = devices.concat(Kinect.getDeviceObjects());

	/*
	 * Complete an initial scan for Screen Capture Devices. Populate UI with 
	 * options.
	 * 
	 * Note: Only one screen capture device is initially added to the list and
	 * from inside the opened screen capture device, more may be spawned.
	 */
	devices = devices.concat(ScreenCaptureDevice.getDeviceObjects());


	/*
	 * Complete an initial scan for Camera devices already plugged in and
	 * populate the Camera Devices list in the UI.
	 *
	 * Note: When opening a device, only use the appropriate API/SDK associated
	 * with it. (i.e. For Kinects, use kinect-azure NOT USB directly)
	 *
	 */
	Camera.getDeviceObjects().then((cameraDevices) => {
		devices = devices.concat(cameraDevices);

		//console.log(devices);
		// Once done getting all device objects, add to dropdown menu
		populateCameraList(document.getElementById("camera-dropdown-content"));
	});



}


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
		//console.log(uniqueInputDevices);

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
		//console.log(devices);
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
	});
}

/**
 * On Camera dropdown menu change, use selected option to start streaming video.
 *
 * @param {HTML Select Element} dropdown - Dropdown menu on HTML page
 * 
 * ! DEPRECATED
 */
/*
function onCameraDropdownChange(option) {
	//Stop cameras and Kinect
	stopAllCameraStream(cameraDevices);
	stopAllKinectStream(kinectDevices).then(() => {
		//Check if Kinect or generic camera/webcam
		if (option.text.includes("kinect") || option.text.includes("Kinect")) {
			//Kinect
			var serialNumber = option.value; //serial number
			var kinect = null; //Kinect device object

			//Look through Kinects to find specified device
			for (var i = 0; i < kinectDevices.length; i++) {
				if (
					kinectDevices[i].getSerial().localeCompare(serialNumber) ==
					0
				) {
					kinect = kinectDevices[i];
					break;
				}
			}

			if (kinect != null) {
				kinect.setDisplayCanvas(displayCanvas2);
				kinect.start();
				kinect.colorVideoFeed();
			}
		} else {
			//NOT a Kinect
			var deviceId = option.value;
			var camera = null;

			//Look through cameras for specified device
			for (var j = 0; j < cameraDevices.length; j++) {
				if (
					cameraDevices[j].getDeviceId().localeCompare(deviceId) == 0
				) {
					camera = cameraDevices[j];
					break;
				}
			}

			if (camera != null) {
				camera.setInputAndOutput(camVideo, displayCanvas2);
				camera.startCameraStream();
			}
		}
	});
}
*/

/**
 * Function used to populate the camera dropdown menu with all unique input
 * devices
 *
 * @param {HTML Element} dropdown - Custom dropdown content div element to store options
 */
function populateCameraList(dropdown) {
	/* First clear the list */
	clearDropdown(dropdown);

	for (var i = 0; i < devices.length; i++) {
		let deviceName = devices[i].getLabel();
		let deviceID = devices[i].getDeviceId();

		addDropdownMenuOption(dropdown, deviceID, deviceName, devices[i]);
	}
}

/**
 * Refresh the Camera list and connected devices on the "Camera Page"
 */
function refreshCameraDevices() {
	// First close and  clear current devices
	//Stop all incoming device data
	for (let device of devices) {
		device.stop()
	}
	devices = []
	// Clear out the Camera list of devices
	clearPageContent(document.getElementById("camera-video-feed-container"));
	clearDropdown(document.getElementById("camera-dropdown-content"));
	setupDevices(); // Finds, creates, and adds all devices to dropdown
}

/**
 * Clears all of the HTML elements in the page used for video feeds.
 */
function clearPageContent(contentContainer) {
	clearContainer(contentContainer);
}

/**
 * Function that clears all of the options in a dropdown menu
 *
 * @param {HTML Element} dropdown - Custom dropdown div element menu on HTML page
 */
function clearDropdown(dropdown) {
	clearContainer(dropdown);
}

/**
 * Genralized function to clear any HTML "container" with multiple items within it.
 * ALL higher level functions call this to clear containers of items.
 */
function clearContainer(container) {
	while (container.lastElementChild) {
		container.removeChild(container.lastElementChild);
	}
}

/**
 * Refreshes the entire list of Kinect Devices. Deleting missing devices and
 * adding new devices.
 * 
 * ! DEPRECATED
 */
/*
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
*/

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
	/* console.log(`[chronosense.js:destroyKinect()] - serial #: ${serial}`); */
	//Check if a device has specified serial number
	let i,
		length = deviceArr.length;
	for (i = 0; i < length; i++) {
		if (serial.localeCompare(deviceArr[i].getSerial()) == 0) {
			stopKinectStream(deviceArr[i]);
			deviceArr = deviceArr.splice(i, 1);
			return;
		}
	}
}

/**
 * Destroy all of the kinects in the device array & remove from array.
 *
 * @param {array} deviceArr - Array of Kinect devices
 */
function destroyAllKinects(deviceArr) {
	//Go through all kinects closing and clearing the array
	let i,
		length = deviceArr.length;
	stopAllKinectStream(deviceArr);
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
	/* console.log(`[chronosense.js:destroyCamera()] -  deviceId: ${deviceId}`); */
	//Check if a device has specified deviceId
	let i,
		length = deviceArr.length;
	for (i = 0; i < length; i++) {
		if (deviceId.localeCompare(deviceArr[i].getDeviceId()) == 0) {
			stopCameraStream(deviceArr[i]);
			deviceArr = deviceArr.splice(i, 1);
			return;
		}
	}
}

/**
 * Destroy all of Cameras in the device array & remove from array
 *
 * @param {array} deviceArr - Array of Camera devices
 */
function destroyAllCameras(deviceArr) {
	//Go through all Cameras closing and clearing the array
	let i,
		length = deviceArr.length;
	stopAllCameraStream(deviceArr);

	deviceArr.length = 0;
}

/**
 * Stop the streaming (close all tracks) of a single Camera device.
 *
 * @param {Camera} device - Camera object to stop/close
 */
function stopCameraStream(device) {
	device.stopCameraStream();
}

/**
 * Stop the streaming (close all tracks) of a ALL Camera devices.
 *
 * @param {array} deviceArr - Array of Camera devices to stop/close
 */
function stopAllCameraStream(deviceArr) {
	for (var i = 0; i < deviceArr.length; i++) {
		deviceArr[i].stopCameraStream();
	}
}

/**
 * Stop the streaming of a single Kinect device.
 *
 * @param {Kinect} device - Kinect object to stop/close
 */
function stopKinectStream(device) {
	return device.stopListeningAndCameras().then((resolve, reject) => {
		device.close();
		return new Promise((resolve, reject) => {
			resolve(true);
		});
	});
}

/**
 * Stop the streaming of a ALL Kinect devices.
 *
 * @param {array} deviceArr - Array of Kinect devices to stop/close
 */
async function stopAllKinectStream(deviceArr) {
	/*
	console.log(
		"[chronosense.js:stopAllKinectStream()] - BEGIN Stopping Kinect streams"
	);
	*/
	for (var i = 0; i < deviceArr.length; i++) {
		await stopKinectStream(deviceArr[i]);
	}
	/*
	console.log(
		"[chronosense.js:stopAllKinectStream()] - DONE Stopping Kinect streams"
	);
	*/
	return new Promise((resolve, reject) => {
		resolve(true);
	});
}

/**
 * Opens or closes dropdown menus to account for clicking outside options to close & open seamlessly.
 * ! Maybe simplify if possible with HTML IDs
 *
 * @param {MouseEvent} evt - Mouse click event on DOM
 */
function openCloseKinectDropMenus(evt) {
	var isKinectOpen = false;
	var isFpsOpen = false;
	var isResOpen = false;
	var isFormatOpen = false;
	var isDepthOpen = false;
	var isSyncOpen = false;

	const kinectList = document.getElementById("kinect-dropdown");
	const kinectOptionFPS = document.getElementById(
		"kinect-option-dropdown-fps"
	);
	const kinectOptionRes = document.getElementById(
		"kinect-option-dropdown-res"
	);
	const kinectOptionFormat = document.getElementById(
		"kinect-option-dropdown-format"
	);
	const kinectOptionDepth = document.getElementById(
		"kinect-option-dropdown-depth"
	);
	const kinectOptionSync = document.getElementById(
		"kinect-option-dropdown-sync"
	);
	let clickedElement = evt.target;

	do {
		if (kinectList == clickedElement) {
			document.getElementById(
				"kinect-option-dropdown-content-fps"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-res"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-format"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-depth"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-sync"
			).style.display = "none";

			isFpsOpen = false;
			isResOpen = false;
			isFormatOpen = false;
			isDepthOpen = false;
			isSyncOpen = false;

			if (!isKinectOpen) {
				isKinectOpen = true;
				document.getElementById(
					"kinect-dropdown-content"
				).style.display = "block";
				return;
			} else {
				isKinectOpen = false;
				document.getElementById(
					"kinect-dropdown-content"
				).style.display = "none";
				return;
			}
		}
		if (kinectOptionFPS == clickedElement) {
			document.getElementById("kinect-dropdown-content").style.display =
				"none";

			document.getElementById(
				"kinect-option-dropdown-content-res"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-format"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-depth"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-sync"
			).style.display = "none";

			isKinectOpen = false;
			isResOpen = false;
			isFormatOpen = false;
			isDepthOpen = false;
			isSyncOpen = false;

			if (!isFpsOpen) {
				isFpsOpen = true;
				document.getElementById(
					"kinect-option-dropdown-content-fps"
				).style.display = "block";
				return;
			} else {
				isFpsOpen = false;
				document.getElementById(
					"kinect-option-dropdown-content-fps"
				).style.display = "none";
				return;
			}
		}
		if (kinectOptionRes == clickedElement) {
			document.getElementById("kinect-dropdown-content").style.display =
				"none";

			document.getElementById(
				"kinect-option-dropdown-content-fps"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-format"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-depth"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-sync"
			).style.display = "none";

			isKinectOpen = false;
			isFpsOpen = false;
			isFormatOpen = false;
			isDepthOpen = false;
			isSyncOpen = false;

			if (!isResOpen) {
				isResOpen = true;
				document.getElementById(
					"kinect-option-dropdown-content-res"
				).style.display = "block";
				return;
			} else {
				isResOpen = false;
				document.getElementById(
					"kinect-option-dropdown-content-res"
				).style.display = "none";
				return;
			}
		}
		if (kinectOptionFormat == clickedElement) {
			document.getElementById("kinect-dropdown-content").style.display =
				"none";

			document.getElementById(
				"kinect-option-dropdown-content-fps"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-res"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-depth"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-sync"
			).style.display = "none";

			isKinectOpen = false;
			isFpsOpen = false;
			isResOpen = false;
			isDepthOpen = false;
			isSyncOpen = false;

			if (!isFormatOpen) {
				isFormatOpen = true;
				document.getElementById(
					"kinect-option-dropdown-content-format"
				).style.display = "block";
				return;
			} else {
				isFormatOpen = false;
				document.getElementById(
					"kinect-option-dropdown-content-format"
				).style.display = "none";
				return;
			}
		}
		if (kinectOptionDepth == clickedElement) {
			document.getElementById("kinect-dropdown-content").style.display =
				"none";

			document.getElementById(
				"kinect-option-dropdown-content-fps"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-res"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-format"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-sync"
			).style.display = "none";

			isKinectOpen = false;
			isFpsOpen = false;
			isResOpen = false;
			isFormatOpen = false;
			isSyncOpen = false;

			if (!isDepthOpen) {
				isDepthOpen = true;
				document.getElementById(
					"kinect-option-dropdown-content-depth"
				).style.display = "block";
				return;
			} else {
				isDepthOpen = false;
				document.getElementById(
					"kinect-option-dropdown-content-depth"
				).style.display = "none";
				return;
			}
		}
		if (kinectOptionSync == clickedElement) {
			document.getElementById("kinect-dropdown-content").style.display =
				"none";

			document.getElementById(
				"kinect-option-dropdown-content-fps"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-res"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-format"
			).style.display = "none";

			document.getElementById(
				"kinect-option-dropdown-content-depth"
			).style.display = "none";

			isKinectOpen = false;
			isFpsOpen = false;
			isResOpen = false;
			isFormatOpen = false;
			isDepthOpen = false;

			if (!isSyncOpen) {
				isSyncOpen = true;
				document.getElementById(
					"kinect-option-dropdown-content-sync"
				).style.display = "block";
				return;
			} else {
				isSyncOpen = false;
				document.getElementById(
					"kinect-option-dropdown-content-sync"
				).style.display = "none";
				return;
			}
		}
		// Go up the DOM
		clickedElement = clickedElement.parentNode;
	} while (clickedElement);
	//Clicked outside of Kinect devices list
	document.getElementById("kinect-dropdown-content").style.display = "none";

	document.getElementById(
		"kinect-option-dropdown-content-fps"
	).style.display = "none";

	document.getElementById(
		"kinect-option-dropdown-content-res"
	).style.display = "none";

	document.getElementById(
		"kinect-option-dropdown-content-format"
	).style.display = "none";

	document.getElementById(
		"kinect-option-dropdown-content-depth"
	).style.display = "none";

	document.getElementById(
		"kinect-option-dropdown-content-sync"
	).style.display = "none";

	isKinectOpen = false;
	isFpsOpen = false;
	isResOpen = false;
	isFormatOpen = false;
	isDepthOpen = false;
	isSyncOpen = false;
}

/**
 * Opens or closes Camera dropdown menus to account for clicking outside options to close & open seamlessly.
 * ! Maybe simplify if possible with HTML IDs
 *
 * @param {MouseEvent} evt - Mouse click event on DOM
 */
function openCloseCameraDropMenus(evt) {
	var isCameraOpen = false;

	const cameraList = document.getElementById("camera-dropdown");

	let clickedElement = evt.target;

	do {
		if (cameraList == clickedElement) {
			if (!isCameraOpen) {
				isCameraOpen = true;
				document.getElementById(
					"camera-dropdown-content"
				).style.display = "block";
				return;
			} else {
				isCameraOpen = false;
				document.getElementById(
					"camera-dropdown-content"
				).style.display = "none";
				return;
			}
		}
		// Go up the DOM
		clickedElement = clickedElement.parentNode;
	} while (clickedElement);
	//Clicked outside of Camera devices list
	document.getElementById("camera-dropdown-content").style.display = "none";

	isCameraOpen = false;
} //End of camera switch

/**
 * Add custom dropdown menu option to specified menu.
 *
 * @param {HTML Element} dropdownElement - dropdown content div for either camera or kinect or etc.
 * @param {String} dropdownID - Name for dropdown option/element that is added, in order to have ID for later calls.
 * @param {String} dropdownName - Literal name that will be displayed in the dropdown menu.
 * @param {Video Object} device - Camera/Kinect Class object used to attach canvas/video for output and control.
 */
async function addDropdownMenuOption(
	dropdownElement,
	dropdownID,
	dropdownName,
	device
) {
	//Create necessary elements with outer div wrapper and inner content
	var parentDiv = document.createElement("div");
	var childDiv = document.createElement("div");
	var checkImg = document.createElement("img");

	parentDiv.id = "Device" + dropdownID;
	childDiv.innerText = dropdownName;
	checkImg.src = "../images/checkmark.webp";
	checkImg.style.visibility = "hidden";

	parentDiv.appendChild(childDiv);
	parentDiv.appendChild(checkImg);
	// Currently the plan is to have a single "device" page. So only focus on camera page functions
	// * Camera Dropdown Option
	parentDiv.addEventListener("click", (evt) => {
		onCameraSelection(evt.currentTarget, device);
	});

	// Add elements to
	dropdownElement.appendChild(parentDiv);
}

/**
 * Create Camera Page HTML elements necessary to start streaming feed to UI on selection from custom dropdown menu.
 *
 * @param {HTML Element} targetElement - HTML div element associated with the dropdown menu option that was selected.
 * @param {Video Object} device - Camera Class object used to attach canvas/video for output and control.
 */
async function onCameraSelection(targetElement, device) {
	//If VISIBLE, make check invisible, clear out HTML elements, close feed.
	//If INVISIBLE, make visible, create HTML elements, start feed.
	if (
		targetElement.childNodes[1].style.visibility.localeCompare("hidden") ===
		0
	) {
		//Make check mark visible indicating the device is "live"
		targetElement.childNodes[1].style.visibility = "visible";
		//Get UI elements for device display
		let cameraVideoFeedOuterContainer = document.getElementById(
			"camera-video-feed-container"
		);
		cameraVideoFeedOuterContainer.appendChild(device.getUI());


	} else {
		//Make check mark invisible indicating the device is NOT "live"
		targetElement.childNodes[1].style.visibility = "hidden";

		let outermostDiv = document.getElementById(device.getDeviceId());

		while (outermostDiv.lastElementChild) {
			outermostDiv.removeChild(outermostDiv.lastElementChild);
		}
		outermostDiv.remove();

		device.stop()
	}
}

/**
 * Create Kinect Page HTML elements necessary to start streaming feed to UI on selection from custom dropdown menu.
 *
 * @param {HTML Element} targetElement - HTML div element associated with the dropdown menu option that was selected.
 */
function onKinectSelection(targetElement) {
	//If VISIBLE, make check invisible, clear out HTML elements, close feed.
	//If INVISIBLE, make visible, create HTML elements, start feed.
	if (
		targetElement.childNodes[1].style.visibility.localeCompare("hidden") ===
		0
	) {
		//First create the necessary elements
		// ! video, canvas, buttons, video option menus, etc.
		//Finally, make check mark visible indicating the device is "live"
		targetElement.childNodes[1].style.visibility = "visible";
	} else {
		//First delete the necessary elements (for performance)
		//Finally, make check mark visible indicating the device is NOT "live"
		targetElement.childNodes[1].style.visibility = "hidden";
	}
}

/**
 * Mirror the specified canvas element about the y-axis (x=1 -> x=-1).
 */
function mirrorCanvas(canvas) {
	if (canvas.style.transform.localeCompare("scaleX(-1)") === 0) {
		// Change back to "normal" scaling
		canvas.style.transform = "scaleX(1)";
	} else {
		// Mirror canvas
		canvas.style.transform = "scaleX(-1)";
	}
}

/**
 * Function that is called to make sure all devices are properly shut down
 * before the application shuts down.
 * Acts as an EventHandler for Node.
 */
global.onbeforeunload = () => {
	//Close all Kinects & cameras gracefully
	for (let device of devices) {
		device.stop()
	}
};
