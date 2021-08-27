// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require("electron").remote;
import { Plugin } from "./plugin.js";
const { dialog } = remote;
//import { Kinect } from "./kinect.js";   ** Commented out due to Kinect currently treated as generic camera
import { Camera } from "./camera.js";
//import { AudioRecorder } from "./audio_recorder.js";
//import { GenericDevice } from "./generic_device.js";
import { ScreenCaptureDevice } from "./screen_capture_device.js";

var recordBtn = document.getElementById("record-all-btn");
var recordDirInput = document.getElementById("recording-dir-path");
var recordDirBtn = document.getElementById("record-path-btn");

var isRecording = false;
var isDirSetToDate = true;

//Arrays for all devices
var devices = []; // Generic Device Model -> Move to this instead of specific device arrays

const wait=ms=>new Promise(resolve => setTimeout(resolve, ms));

export async function getDevices() {
	let _devices = [];
	await wait(1000).then(() => _devices = devices)
	return _devices;
}


// When document has loaded, initialize
document.onreadystatechange = () => {
	if (document.readyState == "complete") {
		handleWindowControls();
		setupDevices();

		//Set default directory to current date and time
		// Used for setting file current date/time
		var currDate = new Date();
		recordDirInput.value = "./".concat(currDate.getFullYear().toString()).concat('_').concat((currDate.getMonth() + 1).toString()).concat("_").concat(currDate.getDate().toString()).concat('_').concat(currDate.getHours().toString()).concat('_').concat(currDate.getMinutes().toString()).concat('_').concat(currDate.getSeconds().toString());
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

	/* Add event to open and close device drop down menus seamlessly */
	document.addEventListener("click", (evt) => {
		openCloseDeviceDropMenus(evt);
	}); //End of dropdown open listener

	// Attach record button at the top of the page to a recording method to start recording 
	// all selected devices.
	recordBtn.addEventListener("click", () => {
		recordButtonClick();
	});

	// Dialog popup button to select directory folder
	recordDirBtn.addEventListener("click", () => {
		// Only allow button to set directory if it is not currently recording.
		if (!isRecording) {
			dialog.showOpenDialog({ title: "Select Directory for Recording", defaultPath: "./", properties: ["openDirectory"] }).then((promise) => {
				if (!promise.canceled) {
					recordDirInput.value = promise.filePaths[0];
					isDirSetToDate = false; // Change to false if user selects their own folder.
				} else if (recordDirInput.value.localeCompare("") == 0) {
					// Default set to current directory + date/time sequence
					// Used for setting file current date/time
					var currDate = new Date();
					recordDirInput.value = "./".concat(currDate.getFullYear().toString()).concat('_').concat((currDate.getMonth() + 1).toString()).concat("_").concat(currDate.getDate().toString()).concat('_').concat(currDate.getHours().toString()).concat('_').concat(currDate.getMinutes().toString()).concat('_').concat(currDate.getSeconds().toString());
					isDirSetToDate = true;
				}
			})
		}
	});


    // Refresh devices in drop down and reset live previews
	document
		.getElementById("refresh-cameras-btn")
		.addEventListener("click", () => {
			refreshDevices();
		});
} //End of handleWindowControls()


function recordButtonClick() {
	recordAllSelectedDevices();
}

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
		populateDeviceList(document.getElementById("device-dropdown-content"));
	})
}

/**
 * Function used to populate the camera dropdown menu with all unique input
 * devices
 *
 * @param {HTML Element} dropdown - Custom dropdown content div element to store options
 */
function populateDeviceList(dropdown) {
	/* First clear the list */
	clearDropdown(dropdown);

	for (var i = 0; i < devices.length; i++) {
		let deviceName = devices[i].getLabel();
		let deviceID = devices[i].getDeviceId();

		addDropdownMenuOption(dropdown, deviceID, deviceName, devices[i]);
	}
}

/**
 * Refresh the device list and connected devices
 */
function refreshDevices() {
	// First close and  clear current devices
	//Stop all incoming device data
	for (let device of devices) {
		device.stop();
	}
	devices = [];
	// Clear out the list of devices
	clearPageContent(document.getElementById("camera-video-feed-container"));
	clearDropdown(document.getElementById("device-dropdown-content"));
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

var isDeviceListOpen = false;

/**
 * Opens or closes device dropdown menus to account for clicking outside options to close & open seamlessly.
 * ! Maybe simplify if possible with HTML IDs
 *
 * @param {MouseEvent} evt - Mouse click event on DOM
 */
function openCloseDeviceDropMenus(evt) {

	const deviceList = document.getElementById("device-dropdown");

	let clickedElement = evt.target;

	do {
		if (deviceList == clickedElement) {
			if (!isDeviceListOpen) {
				isDeviceListOpen = true;
				document.getElementById(
					"device-dropdown-content"
				).style.display = "block";
				return;
			} else {
				isDeviceListOpen = false;
				document.getElementById(
					"device-dropdown-content"
				).style.display = "none";
				return;
			}
		}
		// Go up the DOM
		clickedElement = clickedElement.parentNode;
	} while (clickedElement);
	//Clicked outside of devices list
	document.getElementById("device-dropdown-content").style.display = "none";
	isDeviceListOpen = false;

} //End of device switch

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

		device.clearUI();

		while (outermostDiv.lastElementChild) {
			outermostDiv.removeChild(outermostDiv.lastElementChild);
		}
		outermostDiv.remove();

		device.stop();
	}
}

/**
 * Starts the recording methods for all devices that have been selected to record.
 * 
 * ! Todo: add checks for errors and graceful shutdowns
 */
async function recordAllSelectedDevices() {
	if (!isRecording) {
		// Not recording - start
		// First, change directory to most up to date time if not set by user
		if (isDirSetToDate) {
			// Used for setting file current date/time
			var currDate = new Date();
			recordDirInput.value = "./".concat(currDate.getFullYear().toString()).concat('_').concat((currDate.getMonth() + 1).toString()).concat("_").concat(currDate.getDate().toString()).concat('_').concat(currDate.getHours().toString()).concat('_').concat(currDate.getMinutes().toString()).concat('_').concat(currDate.getSeconds().toString());
		}

		// Start recording on all devices that are selected. Keep running total of devices recording
		let numRecording = 0;
		devices.forEach((device) => {
			if (device.getRecordStatus()) {
				// Start recording
				device.setDirName(recordDirInput.value);
				device.startRecording();
				numRecording++;
			} 
		});

		if (numRecording == 0) {
			console.log("Error: No device(s) have been selected to record.");
		} else {
			recordBtn.innerText = "Stop Recording All Selected";
			isRecording = true;
		}
	} else {
		// Currently recording - stop 
		devices.forEach((device) => {
			if (device.getRecordStatus()) {
				// Stop Recording
				device.stopRecording();
			} 
		});

		recordBtn.innerText = "Record All Selected";
		isRecording = false;
		
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
		device.stop();
	}
};