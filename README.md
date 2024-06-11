# web-ros-monitor
## What is it?
It's a website created to monitor your current ros setup. It displays the nodes, topics, services and params and how they are connected to each other. The only requirement to use this site is a rosbridge server running in your pc.

## Motivation
Create a simple site to visualize (and control?) your complex project. The initial motivation is to make something where the user does not have to do adition steps (other than ros oriented package installation) to use the product.

## How to use it?

### Install the rosbridge suite
```
sudo apt install ros-noetic-rosbridge-suite
```
### Launch the rosbridge server
```
roslaunch rosbridge_server rosbridge_websocket.launch
```
### Open/Refresh the web-ros-monitor page
[web-ros-monitor](https://mithunkinarullathil.github.io/web-ros-monitor/)