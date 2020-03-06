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

## Change Notes:
- In Docker build file, added the installation of network tools in order to allow for client/server connection between Host and Docker Container. 
- Added PowerShell script for easy container startup. Look up how to add a shortcut to run the script in Windows 10.
- Added Webcam selection and webcam live stream to application functionality
- Added ability to record current stream from a camera to an MP4 file with decent quality bitrate while taking into consideration quality vs. storage.