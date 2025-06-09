# jspsych-app

This repository allows experimenters, researchers, and all other users of jsPsych to create an app to launch their experiments on mobile platforms (Android and iOS). The app is made using Apache Cordova, which will be locally installed into the new project directorry when creating the app as well as the necessary Cordova plugins required for the default app template. Experiments in this template all follow a similar template to the default jsPsych template and conversion is simple.

## Creating a new app

Running the following command in your command line / terminal will allow the user to start the creation process for their new app.
```
npx @jspsych/new-app
```
Upon running this command, the user will be asked to create a name for their new project, which will be used as the name of the directory the app is located in. After inputting the name, the app will be created with Cordova and all of the required plugins installed.

## Running the app