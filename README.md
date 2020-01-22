# ChronoSenseV3

# Link to resources: https://docs.google.com/document/d/1xQVBlklc_CoGBttZNWiYTv_ziILPdIOycgu9LpXBchE/edit

## Installation / run
- Clone/pull this repository and move into it with `cd chronosense`
- Create the base image from dockerfile in build directory with`docker build ./Docker -t chronosense` (only need to do this the first time)
- Since Electron wants a chromium window, it helps to install x11 (XQuartz on MacOS and Xming) for window forwarding
- With XQuartz, be sure to activate the option ‘Allow connections from network clients’ in XQuartz settings, then quit and restart XQuartz
- [On MacOS] run `xhost +` to grant permission for the remote display
- Enter the docker image `docker run -it -e DISPLAY=host.docker.internal:0 -v /tmp/.X11-unix:/tmp/.X11-unix -v </absolute/path/to/git/repo/>:/chronosense chronosense`

## Test Electron
- To test the sample Electron Quickstart app, go to `cd /chronosense/electron-quick-start`
- Install and run the example `npm install && npm start`
