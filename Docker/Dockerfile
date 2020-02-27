# Use ubuntu:18.04 as the parent image
FROM ubuntu:18.04

# Open a port for ssh or whatever we need
EXPOSE 1234

# Tell Ubuntu non-interactive install
ARG DEBIAN_FRONTEND=noninteractive

# Run apt-get steps
RUN apt-get update && apt-get install -y \ 
    pkg-config \
    ninja-build \
    doxygen \
    clang \
    gcc-multilib \
    g++-multilib \
    python3 \
    git-lfs \
	curl \ 
    nasm \
    cmake \
    libgl1-mesa-dev \
    libsoundio-dev \
    libvulkan-dev \
    libx11-dev \
    libxcursor-dev \
    libxinerama-dev \
    libxrandr-dev \
    libusb-1.0-0-dev \
    libssl-dev \
    libudev-dev \
    mesa-common-dev \
    uuid-dev \
    libopencv-dev \
	x11-apps

# Install node.js, npm, yarn, and electron
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN apt-get update && apt-get install -y yarn
RUN apt-get install -y net-tools 
# ^^ Install net tools to communicate with host machine (client-server kinect)

RUN npm install electron-prebuilt@latest --save-dev

RUN bash
