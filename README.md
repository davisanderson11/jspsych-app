# jspsych-app

This repository allows experimenters, researchers, and all other users of jsPsych to create an app to launch their experiments on mobile platforms (Android and iOS). The app is made using Apache Cordova, which will be locally installed into the new project directorry when creating the app as well as the necessary Cordova plugins required for the default app template. Experiments in this template all follow a similar template to the default jsPsych template and conversion is simple.

## Creating a new app

Running the following command in your command line / terminal will allow the user to start the creation process for your new app.
```
npx @jspsych/new-app
```
Upon running this command, the user will be asked to create a name for their new project, which will be used as the name of the directory the app is located in. After inputting the name, the app will be created with Cordova and all of the required plugins installed.

## Running the app

After you have navigated to your new app directory, running `npm run android` or `npm run ios` from the root of the project will open an Android Studio Emulator instance or an Xcode Simulator instance assuming you have downloaded the necessary applications. Additionally, if you have a device plugged in it will default to running on that device.

## Creating and running experiments

All experiments should be located within a folder of your desired name at `www/js/experiments/YOUR-FOLDER-NAME` from there, creating an `index.js` file within that directory and inputting your code should be all that is necessary. For the format that your JavaScript experiment code should be in, please see `www/js/experiments/sample-experiment/index.js` and feel free to delete the `sample-experiment` folder when you are ready to launch your experiment. After the experiment has been created, the folder name must be listed in `www/js/app.js` at the code segment listed below.
```
const EXPERIMENTS = [
    'profile',
    'sample-experiment',
    'YOUR-EXPERIMENT-HERE'
];
```
Please feel free to delete `sample-experiment` but do not delete `profile` as it is required for DataPipe integration, data collection, and push notifications.