import { Plugin } from "../JS_Files/plugin.js";

class ExampleAll extends Plugin {
    createUI() {
        this.pluginDeviceList.forEach(device => {
			let pluginDiv = device.getPluginDiv();
            if(pluginDiv != null && !this.checkIfActiveDevice(device)){
                let pluginContainer = document.createElement("div");
                pluginContainer.classList.add("plugin-container");
                let textExample = document.createTextNode("This is an example plugin for All devices");
                pluginContainer.appendChild(textExample);
                pluginDiv.appendChild(pluginContainer);
                this.addToActiveDeviceList(device);
            }
		});
    }
}

export async function init(){
    let example = new ExampleAll("Example Plugin", "Video", "All");
    await example.init();
}