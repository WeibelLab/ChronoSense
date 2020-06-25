# ChronoSenseV3

## Installation / run with Docker
- Clone/pull this repository and move into it with `cd chronosense`
- Create the base image from dockerfile in build directory with`docker build ./Docker -t chronosense` (only need to do this the first time)
- Since Electron wants a chromium window, it helps to install x11 (XQuartz on MacOS and Xming on Windows) for window forwarding
- [On MacOS] be sure to activate the option ‘Allow connections from network clients’ in XQuartz settings, then quit and restart XQuartz
- [On MacOS] run `xhost +` to grant permission for the remote display
- [On Windows] be sure that Xming is running
- Enter the docker image `docker run -it -e DISPLAY=host.docker.internal:0 -v /tmp/.X11-unix:/tmp/.X11-unix -v </absolute/path/to/git/repo/>:/chronosense chronosense`

## Run ChronoSense Electron App:
- CD into chronosense folder and enter the command `npm install` to make sure you have all the needed dependencies/electron (node-gyp, kinect-azure, production windows build tools, etc.).
- Next enter `npm start` and the application window will open up.
- If you get a `electron: cannot execute binary file` error, run `npm install electron@^8.0.2` then try again

## Get Up and Running for Developing:
1.  Clone the repository to a location of your choosing using the command:  
    `git clone https://github.com/WeibelLab/ChronoSenseV3.git`
    
2.  Make sure you have [Node.js](https://nodejs.org/en/) installed (includes node and npm commands).  

3.  Navigate to where you cloned the ChronoSenseV3 folder and run the command:  
    `npm install`
    
4.  **(Optional)** If there are submodules not fully cloned in the ChronoSenseV3 folder, run the command:  
    `git submodule update --init --recursive`
    
5.  **(If on Windows)** Install node-gyp to fix some errors that may occur:  
    `npm install -g node-gyp`
    
6.  **(If on Windows)** Install all the required tools and configurations using Microsoft's windows-build-tools using  
    `npm install --global --production windows-build-tools` from an elevated PowerShell or CMD.exe (run as Administrator).

7.  Once you have the submodule installed for the 'kinect-azure' module (or in the node_modules folder), go to kinect-azure/scripts/ and enter the following command:  
    `node install.js`
    - *The above command will download the sensor dlls and other necessary files to use the Kinect in development and application use.*

8.  Move the files that were created with the above command into the main ChronoSenseV3 folder. 
    List of Files to move:  
    * cublas64_100.dll
    * cudart64_100.dll
    * cudnn64_7.dll
    * dnn_model_2_0.onnx
    * onnxruntime.dll
    * vcomp140.dll
    
9. Test to see if the application (as it is) can now run by going to the main ChronoSenseV3 folder and typing the following command to start the application:  
    `npm start`
    
10. Ready to Develop!


## Change Notes:
- In Docker build file, added the installation of network tools in order to allow for client/server connection between Host and Docker Container. 
- Added PowerShell script for easy container startup. Look up how to add a shortcut to run the script in Windows 10.
- Added Webcam selection and webcam live stream to application functionality
- Added ability to record current stream from a camera to an MP4 file with decent quality bitrate while taking into consideration quality vs. storage.
- Application is split up into pages for Home, Webcam, Kinect, Kinect Body Tracking, and About.
- Kinect color feed displays properly on the Kinect Page.
- Kinect Body Tracking works within the Kinect Body Tracking Page and displays both color and depth images spearately with joint data on top of both feeds.
- Kinect Body Tracking data writes continuously to a CSV file. The CSV file has the naming scheme of year-month-day-hour-minute-second and can contain any data within the 'skeleton' class.
- Elapsed time from the moment of starting to record to a CSV file is stored on said file for future reference.