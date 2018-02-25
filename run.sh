#!/bin/bash
echo "Setting environments"
export JAVA_HOME=/home/rampi/tools/java/jdk1.8.0_101
export ANDROID_HOME="/home/rampi/Android/Sdk"
export PATH=${PATH}:"${ANDROID_HOME}/platform-tools":"${ANDROID_HOME}/tools":${JAVA_HOME}
echo "Environments OK"
echo "Building"
#ionic build android
#ionic platform remove android
#ionic platform add android
ionic run android
#"$ANDROID_HOME"/platform-tools/adb logcat WifiStateMachine:E ContextImpl:E SBar.NetworkController:E *:I
"$ANDROID_HOME"/platform-tools/adb logcat chromium:I *:S Cordova*:I
#"$ANDROID_HOME"/platform-tools/adb logcat 
