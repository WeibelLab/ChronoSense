export class Plugin {
	pluginName = null;
	pluginMediaType = null;
	pluginDeviceType = null;

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

    init(){}

    start(){}

    stop(){}

}

export function deviceList(){
    
}

export function pluginList(){

}
