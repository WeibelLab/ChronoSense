import { getDevices } from "../JS_Files/chronosense.js"

export class Plugin {
	pluginName = null;
	pluginMediaType = null;
	pluginDeviceType = null;
	pluginDeviceList = null;
	activeDeviceList = null;

    /**
	 *
	 * @param {string} pluginName - Identifier for each plugin.
	 * @param {string} pluginMediaType - Types of media the plugin interfaces with (e.g. audio, video, etc).
	 * @param {string} pluginDeviceType - Types of devices the plugin interfaces with (e.g. camera, screenCapture, etc).
	 */
	constructor(pluginName, pluginMediaType, pluginDeviceType) {
		this.pluginName = pluginName;
		this.pluginMediaType = pluginMediaType;
		this.pluginDeviceType = pluginDeviceType;
	}

    async init() {
		this.activeDeviceList = [];
		addToPluginList(this);
        this.pluginDeviceList = await this.queryDevices();
        this.pluginDeviceList = this.filterDevices(this.pluginDeviceList, this.pluginDeviceType);
		return;
	}

	async refresh() {
		this.activeDeviceList = [];
		this.pluginDeviceList = await this.queryDevices();
        this.pluginDeviceList = this.filterDevices(this.pluginDeviceList, this.pluginDeviceType);
		return;
	}

	async queryDevices() {
		let devices = await getDevices()
		return devices;
	}

	filterDevices(devices, deviceType) {
		let filteredDevices = [];
		if (deviceType == "All"){
			return devices;
		}
		devices.forEach(device => {
			if (device.constructor.name == deviceType){
				filteredDevices.push(device)
			}
		});
		return filteredDevices;
	}

	addToActiveDeviceList(d) {
		this.activeDeviceList.push(d);
		return;
	}

	checkIfActiveDevice(d) {
		return this.activeDeviceList.includes(d);
	}

	removeActiveDeviceList(d) {
		const index = this.activeDeviceList.indexOf(d);
		this.activeDeviceList.splice(index, 1);
		return;
	}

	createUI(){}

}

let	pluginList = [];

function addToPluginList(p) {
	pluginList.push(p);
	return;
}

export function getPluginCount() {
	return pluginList.length;
}

export function getPluginList() {
	return pluginList;
}

export async function getPluginUI() {
	pluginList.forEach(async p => {
		await p.createUI();
	});
	return;
}

export async function refreshPlugins() {
	pluginList.forEach(async p => {
		await p.refresh();
	});
	return;
}

async function init() {
	const fs = require('fs');
	const directoryPath = "./plugins";

	fs.readdir(directoryPath, function (err, files) {
		if (err) {
			return console.log('Unable to scan plugins directory: ' + err);
		} 
		files.forEach(file => {
			if (file[0] != "."){
				const module = import('../plugins/' + file).then(async m =>
					await m.init()
				);
			}
		});
	});
	return;
}

init();
