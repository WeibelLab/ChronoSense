import { Plugin } from "../JS_Files/plugin.js";

class ExampleCamera extends Plugin {
    createUI() {
        this.pluginDeviceList.forEach(device => {
			let pluginDiv = device.getPluginDiv();
            if(pluginDiv != null && !this.checkIfActiveDevice(device)){
                let pluginContainer = document.createElement("div");
                pluginContainer.classList.add("plugin-container");
                let textExample = document.createTextNode("This is an example plugin for Camera devices");
                pluginContainer.appendChild(textExample);
                pluginDiv.appendChild(pluginContainer);
                this.addToActiveDeviceList(device);
            }
		});
    }
}

export async function init(){
    let example = new ExampleCamera("Example Plugin", "Video", "Camera");
    await example.init();
}