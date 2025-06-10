# Complete Tutorial: Building Mobile Psychology Experiments with jspsych-app

This comprehensive tutorial will guide you through creating mobile psychology experiments using jsPsych and Apache Cordova. Whether you're a complete beginner or an experienced researcher, this guide provides step-by-step instructions to get you started.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [What You'll Learn](#what-youll-learn)
3. [Understanding the Technology](#understanding-the-technology)
4. [Setting Up Your Development Environment](#setting-up-your-development-environment)
5. [Creating Your First App](#creating-your-first-app)
6. [Understanding the Project Structure](#understanding-the-project-structure)
7. [Building Your First Experiment](#building-your-first-experiment)
8. [Testing and Running Your App](#testing-and-running-your-app)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Best Practices](#best-practices)
12. [Additional Resources](#additional-resources)

## Prerequisites

### Required Knowledge
- **Basic understanding of JavaScript** - You should be comfortable with variables, functions, and basic programming concepts
- **Familiarity with HTML** - Understanding how to create basic web pages
- **Research or experimentation background** - Knowledge of experimental psychology or behavioral research principles

### Required Software
Before starting, ensure you have the following installed:

#### Essential Tools
1. **Node.js** (version 14 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - This includes npm (Node Package Manager)
   - Verify installation: `node --version` and `npm --version`

2. **Code Editor**
   - Recommended: [Visual Studio Code](https://code.visualstudio.com/)
   - Alternatives: Atom, Sublime Text, or any text editor

#### For Android Development
3. **Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Includes Android SDK and emulator
   - Requires at least 8GB RAM and 8GB storage

#### For iOS Development (Mac only)
4. **Xcode**
   - Download from Mac App Store
   - Includes iOS Simulator
   - Requires macOS and Apple ID

## What You'll Learn

By the end of this tutorial, you will be able to:

- Create a mobile app framework for psychology experiments
- Build interactive experiments using jsPsych
- Test your experiments on mobile devices and simulators
- Collect and manage experimental data
- Deploy your experiments to app stores
- Troubleshoot common issues

## Understanding the Technology

### What is jsPsych?
jsPsych is a JavaScript library designed specifically for creating behavioral experiments that run in web browsers. It provides:
- Pre-built experiment components (trials, stimuli, responses)
- Data collection and storage
- Timeline management
- Randomization and counterbalancing

### What is Apache Cordova?
Apache Cordova is a framework that allows you to:
- Build mobile apps using HTML, CSS, and JavaScript
- Access native device features (camera, GPS, accelerometer)
- Deploy to multiple platforms from a single codebase
- Create apps that feel native to each platform

### How They Work Together
jspsych-app combines these technologies to create mobile psychology experiments that:
- Run natively on smartphones and tablets
- Access device sensors and features
- Collect data locally and sync to servers
- Work offline when needed

## Setting Up Your Development Environment

### Step 1: Install Node.js and npm

1. **Download Node.js**
   - Visit [nodejs.org](https://nodejs.org/)
   - Download the LTS (Long Term Support) version
   - Run the installer with default settings

2. **Verify Installation**
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers for both commands.

### Step 2: Install a Code Editor

**For Visual Studio Code:**
1. Download from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install with default settings
3. Recommended extensions:
   - JavaScript (ES6) code snippets
   - HTML CSS Support
   - Live Server

### Step 3: Set Up Mobile Development Tools

#### For Android:
1. **Install Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Run the installer
   - Follow the setup wizard to install Android SDK

2. **Configure Environment Variables**
   - Add Android SDK to your PATH
   - Set ANDROID_HOME environment variable
   - Details vary by operating system

#### For iOS (Mac only):
1. **Install Xcode**
   - Download from Mac App Store (free)
   - Install may take 1-2 hours
   - Accept license agreements

2. **Install Command Line Tools**
   ```bash
   xcode-select --install
   ```

## Creating Your First App

### Step 1: Create the App

Open your terminal or command prompt and run:

```bash
npx @jspsych/new-app
```

**What happens when you run this command:**
1. The jspsych-app generator downloads and runs
2. You'll be prompted to enter a project name
3. A new directory is created with your project name
4. Apache Cordova is installed locally
5. Required plugins are automatically added
6. A template project structure is generated

### Step 2: Choose Your Project Name

When prompted, enter a name for your project. Good naming practices:
- Use lowercase letters and hyphens: `my-experiment-app`
- Avoid spaces and special characters
- Make it descriptive: `stroop-task-mobile`
- Keep it reasonably short

**Example:**
```
? What do you want to name your project? stroop-experiment
```

### Step 3: Wait for Installation

The setup process will:
- Create project directory
- Install dependencies (may take 5-10 minutes)
- Configure Cordova
- Set up the basic app structure

You'll see output like:
```
Creating new jsPsych app: stroop-experiment
Installing dependencies...
Setting up Cordova...
Project created successfully!
```

### Step 4: Navigate to Your Project

```bash
cd stroop-experiment
```

## Understanding the Project Structure

Let's explore what was created:

```
stroop-experiment/
├── config.xml              # Cordova configuration
├── package.json            # Node.js dependencies
├── www/                    # Your app's web content
│   ├── index.html         # Main HTML file
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   │   ├── app.js         # Main app logic
│   │   ├── experiments/   # Your experiments go here
│   │   │   ├── profile/   # User profile experiment
│   │   │   └── sample-experiment/  # Example experiment
│   │   └── lib/           # Libraries and utilities
│   └── assets/            # Images, sounds, etc.
└── platforms/             # Platform-specific code (auto-generated)
```

### Key Files Explained

#### `config.xml`
This file contains your app's configuration:
- App name and description
- Version information
- Permissions and plugins
- Platform-specific settings

#### `www/index.html`
The main HTML file that loads when your app starts. It includes:
- jsPsych library
- Required plugins
- Your app's JavaScript files

#### `www/js/app.js`
The main JavaScript file that:
- Lists available experiments
- Handles app initialization
- Manages navigation between experiments

#### `www/js/experiments/`
This directory contains your experiments:
- Each experiment has its own folder
- `profile/` - Required for user data collection
- `sample-experiment/` - Example you can modify or delete

## Building Your First Experiment

Let's create a simple reaction time experiment from scratch.

### Step 1: Create Experiment Directory

```bash
mkdir www/js/experiments/reaction-time
```

### Step 2: Create the Experiment File

Create `www/js/experiments/reaction-time/index.js`:

```javascript
/**
 * Simple Reaction Time Experiment
 * Measures how quickly participants respond to visual stimuli
 */

// Define experiment parameters
const TRIAL_COUNT = 10;
const MIN_DELAY = 1000; // Minimum delay before stimulus (ms)
const MAX_DELAY = 3000; // Maximum delay before stimulus (ms)

// Create welcome screen
const welcome = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h1>Reaction Time Experiment</h1>
        <p>In this experiment, you will see a red circle appear on the screen.</p>
        <p>Press the button as quickly as possible when you see it.</p>
        <p>Try to be as fast and accurate as possible.</p>
    `,
    choices: ['Start Experiment'],
    post_trial_gap: 500
};

// Create instructions
const instructions = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Instructions</h2>
        <p>1. You will see a white screen</p>
        <p>2. After a random delay, a red circle will appear</p>
        <p>3. Press the "React!" button as quickly as possible</p>
        <p>4. You will complete ${TRIAL_COUNT} trials</p>
        <p>Ready to begin?</p>
    `,
    choices: ['I\'m Ready!'],
    post_trial_gap: 500
};

// Create fixation cross
const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div style="font-size: 60px;">+</div>',
    choices: "NO_KEYS",
    trial_duration: function() {
        return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY)) + MIN_DELAY;
    }
};

// Create reaction time trial
const reactionTrial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="width: 200px; height: 200px; background-color: red; 
                    border-radius: 50%; margin: 50px auto;"></div>
    `,
    choices: ['React!'],
    data: {
        task: 'reaction-time',
        trial_type: 'stimulus'
    },
    on_finish: function(data) {
        // Calculate reaction time
        data.reaction_time = data.rt;
        console.log('Reaction time:', data.rt, 'ms');
    }
};

// Create trial sequence (fixation + stimulus)
const trialSequence = {
    timeline: [fixation, reactionTrial],
    repetitions: TRIAL_COUNT
};

// Create results screen
const results = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        // Calculate average reaction time
        const reactionTimeData = jsPsych.data.get().filter({task: 'reaction-time'});
        const avgRT = Math.round(reactionTimeData.select('rt').mean());
        const fastestRT = Math.round(reactionTimeData.select('rt').min());
        
        return `
            <h2>Results</h2>
            <p>You completed ${TRIAL_COUNT} trials!</p>
            <p><strong>Average reaction time:</strong> ${avgRT} ms</p>
            <p><strong>Fastest reaction time:</strong> ${fastestRT} ms</p>
            <p>Thank you for participating!</p>
        `;
    },
    choices: ['Finish']
};

// Create the experiment timeline
const timeline = [
    welcome,
    instructions,
    trialSequence,
    results
];

// Initialize and run the experiment
jsPsych.run(timeline);
```

### Step 3: Add Your Experiment to the App

Edit `www/js/app.js` and add your experiment to the EXPERIMENTS array:

```javascript
const EXPERIMENTS = [
    'profile',
    'sample-experiment',
    'reaction-time'  // Add this line
];
```

### Step 4: Add Required Plugins

Check `www/index.html` and ensure these plugins are included:

```html
<!-- jsPsych and plugins -->
<script src="https://unpkg.com/jspsych@8.2.1"></script>
<script src="https://unpkg.com/@jspsych/plugin-html-keyboard-response@2.0.0"></script>
<script src="https://unpkg.com/@jspsych/plugin-html-button-response@2.0.0"></script>
<script src="https://unpkg.com/@jspsych/plugin-survey-html-form@2.0.0"></script>
<script src="https://unpkg.com/@jspsych/plugin-call-function@2.0.0"></script>
```

## Testing and Running Your App

### Step 1: Test in Browser First

Before testing on mobile, verify your experiment works in a web browser:

1. **Install a local server** (if you don't have one):
   ```bash
   npm install -g live-server
   ```

2. **Start the server** from your project directory:
   ```bash
   live-server www/
   ```

3. **Open your browser** to the displayed URL (usually `http://localhost:8080`)

4. **Navigate through your app** and test the reaction time experiment

### Step 2: Run on Android Emulator

1. **Start Android Studio** and create a virtual device:
   - Open Android Studio
   - Go to Tools > AVD Manager
   - Create Virtual Device
   - Choose a device definition (e.g., Pixel 4)
   - Download and select a system image
   - Finish setup and start the emulator

2. **Build and run** your app:
   ```bash
   npm run android
   ```

   This command:
   - Builds your app for Android
   - Installs it on the emulator
   - Launches the app automatically

### Step 3: Run on iOS Simulator (Mac only)

```bash
npm run ios
```

This will:
- Build your app for iOS
- Launch the iOS Simulator
- Install and run your app

### Step 4: Run on Physical Device

#### Android:
1. Enable Developer Options on your device
2. Enable USB Debugging
3. Connect via USB
4. Run `npm run android`

#### iOS:
1. Connect your device via USB
2. Trust the computer when prompted
3. Run `npm run ios`
4. May require Apple Developer Account for deployment

## Advanced Features

### Data Collection and Storage

#### Local Data Storage
Your app automatically saves data locally. To access it:

```javascript
// Get all data
const allData = jsPsych.data.get();

// Get specific data
const reactionData = jsPsych.data.get().filter({task: 'reaction-time'});

// Save data to file
jsPsych.data.get().localSave('csv', 'experiment-data.csv');
```

#### DataPipe Integration
For cloud data storage, configure DataPipe:

1. **Set up DataPipe account** at [pipe.jspsych.org](https://pipe.jspsych.org)
2. **Configure in your experiment**:
   ```javascript
   jsPsych.data.addProperties({
       subject_id: 'participant_001',
       session_id: 'session_001'
   });
   ```

### Using Device Sensors

#### Accelerometer Data
```javascript
const accelerometerTrial = {
    type: jsPsychCallFunction,
    func: function() {
        // Access device motion
        window.addEventListener('devicemotion', function(event) {
            console.log('Acceleration X:', event.acceleration.x);
            console.log('Acceleration Y:', event.acceleration.y);
            console.log('Acceleration Z:', event.acceleration.z);
        });
    }
};
```

#### Camera Access
```javascript
const cameraButton = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<p>Take a photo</p>',
    choices: ['Take Photo'],
    on_finish: function() {
        // Camera functionality would be implemented here
        // Requires additional Cordova plugins
    }
};
```

### Customizing App Appearance

#### Changing App Icon
1. Replace files in `www/assets/icon/`
2. Update `config.xml` icon references
3. Rebuild the app

#### Modifying App Name
Edit `config.xml`:
```xml
<name>My Experiment App</name>
<description>
    A mobile app for psychology experiments
</description>
```

### Adding Custom Styling

Create `www/css/custom.css`:
```css
/* Custom styles for your experiment */
body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
}

.experiment-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.stimulus {
    font-size: 24px;
    text-align: center;
    padding: 40px;
}

.button-container {
    text-align: center;
    margin-top: 30px;
}

.response-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 15px 30px;
    font-size: 18px;
    border-radius: 5px;
    cursor: pointer;
}

.response-button:hover {
    background-color: #0056b3;
}
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: App shows white screen on startup
**Symptoms:** App launches but displays blank white screen

**Causes:**
- Missing jsPsych plugins
- JavaScript errors in experiment code
- Incorrect file paths

**Solutions:**
1. **Check browser console** for error messages
2. **Verify all plugins** are included in `index.html`
3. **Test experiment** in web browser first
4. **Check file paths** in your experiment code

**Example fix:**
```html
<!-- Make sure all required plugins are included -->
<script src="https://unpkg.com/@jspsych/plugin-html-button-response@2.0.0"></script>
```

#### Issue: Experiment not showing in app menu
**Symptoms:** Your experiment doesn't appear in the app's experiment list

**Solutions:**
1. **Check EXPERIMENTS array** in `www/js/app.js`
2. **Verify folder name** matches array entry exactly
3. **Ensure index.js exists** in experiment folder

**Example:**
```javascript
// In app.js
const EXPERIMENTS = [
    'profile',
    'my-experiment'  // Must match folder name exactly
];
```

#### Issue: Build fails with "Platform not found"
**Symptoms:** Error when running `npm run android` or `npm run ios`

**Solutions:**
1. **Add the platform**:
   ```bash
   npx cordova platform add android
   # or
   npx cordova platform add ios
   ```
2. **Reinstall dependencies**:
   ```bash
   npm install
   ```

#### Issue: Data not saving
**Symptoms:** Experiment runs but no data is collected

**Solutions:**
1. **Check data properties** in your trials
2. **Verify jsPsych data calls**
3. **Test data collection** in browser console

**Example:**
```javascript
// Add data properties to trials
const trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: 'Hello world',
    data: {
        task: 'my-task',
        trial_type: 'test'
    }
};
```

#### Issue: Slow performance on mobile
**Symptoms:** App runs slowly or freezes on mobile devices

**Solutions:**
1. **Optimize images** - use compressed formats
2. **Minimize DOM manipulations**
3. **Reduce trial complexity**
4. **Test on actual devices**, not just emulators

#### Issue: iOS app won't install
**Symptoms:** Build succeeds but app won't install on iOS device

**Solutions:**
1. **Check provisioning profile**
2. **Verify Apple Developer Account** settings
3. **Try iOS Simulator** first
4. **Check device compatibility**

### Debug Mode

Enable debug mode for more detailed error information:

1. **For Android:**
   ```bash
   npx cordova run android --debug
   ```

2. **For iOS:**
   ```bash
   npx cordova run ios --debug
   ```

3. **View logs:**
   - Android: Use `adb logcat` or Android Studio's Logcat
   - iOS: Use Safari's Web Inspector or Xcode's console

## Best Practices

### Experiment Design

#### 1. Keep It Simple
- Start with basic experiments
- Add complexity gradually
- Test frequently during development

#### 2. Mobile-First Design
- Design for small screens
- Use large touch targets (minimum 44px)
- Consider thumb-friendly navigation
- Test on actual devices

#### 3. Performance Optimization
- Minimize external dependencies
- Optimize images and media
- Use efficient jsPsych plugins
- Avoid complex animations

### Code Organization

#### 1. Modular Structure
```javascript
// Separate concerns
const stimuli = {
    welcome: 'Welcome to the experiment',
    instruction: 'Press the button when you see the target'
};

const config = {
    trials: 20,
    timeout: 5000
};

const trials = createTrials(stimuli, config);
```

#### 2. Documentation
```javascript
/**
 * Stroop Task Trial
 * Presents color words in conflicting colors
 * Measures reaction time and accuracy
 */
const stroopTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        // Generate stimulus
    }
};
```

#### 3. Error Handling
```javascript
const safeTrial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: 'Press a button',
    on_finish: function(data) {
        try {
            // Process data
            processData(data);
        } catch (error) {
            console.error('Error processing data:', error);
            // Handle error gracefully
        }
    }
};
```

### Data Management

#### 1. Data Validation
```javascript
const validateData = function(data) {
    if (!data.rt || data.rt < 100) {
        console.warn('Suspicious reaction time:', data.rt);
    }
    if (!data.response) {
        console.warn('Missing response data');
    }
};
```

#### 2. Backup Strategies
```javascript
// Save data periodically
const saveData = {
    type: jsPsychCallFunction,
    func: function() {
        // Save to local storage
        localStorage.setItem('experiment_data', 
            JSON.stringify(jsPsych.data.get().values())
        );
        
        // Also save to file
        jsPsych.data.get().localSave('json', 'backup_data.json');
    }
};
```

#### 3. Privacy Considerations
- Remove identifying information
- Implement consent procedures
- Secure data transmission
- Follow institutional guidelines

### Testing Strategies

#### 1. Progressive Testing
1. **Browser testing** - Test in Chrome/Safari first
2. **Emulator testing** - Use Android/iOS emulators
3. **Device testing** - Test on actual devices
4. **User testing** - Have others test your app

#### 2. Edge Case Testing
- Test with slow internet
- Test with device rotation
- Test with interrupted sessions
- Test with low battery

#### 3. Data Validation
- Verify all data is collected
- Check data formats
- Test export functionality
- Validate statistical measures

## Additional Resources

### Documentation
- [jsPsych Documentation](https://www.jspsych.org/7.3/)
- [Apache Cordova Documentation](https://cordova.apache.org/docs/en/latest/)
- [DataPipe Documentation](https://pipe.jspsych.org/docs/)

### Tutorials and Examples
- [jsPsych Tutorial](https://www.jspsych.org/7.3/tutorials/)
- [Psychology Experiment Examples](https://github.com/jspsych/jspsych-contrib)
- [Mobile Development Best Practices](https://cordova.apache.org/docs/en/latest/guide/next/)

### Community and Support
- [jsPsych Discussion Forum](https://github.com/jspsych/jsPsych/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/jspsych)
- [Apache Cordova Community](https://cordova.apache.org/community/)

### Tools and Utilities
- [jsPsych Builder](https://www.jspsychbuilder.com/) - Visual experiment builder
- [jsPsych Contrib](https://github.com/jspsych/jspsych-contrib) - Community plugins
- [Cordova Plugin Registry](https://cordova.apache.org/plugins/)

### Research and Publishing
- [Best Practices for Online Experiments](https://psyarxiv.com/6c7s2/)
- [Mobile Psychology Research Guidelines](https://www.apa.org/science/leadership/bsa/science-briefs/mobile-technology)
- [Data Privacy in Research](https://www.apa.org/science/leadership/bsa/science-briefs/privacy-research)

## Next Steps

After completing this tutorial, you should be able to:

1. **Create basic experiments** using jsPsych and jspsych-app
2. **Test your experiments** on mobile devices
3. **Collect and analyze data** from your experiments
4. **Troubleshoot common issues** you encounter
5. **Follow best practices** for mobile experiment development

### Suggested Learning Path

1. **Start simple** - Create a basic reaction time or survey experiment
2. **Add complexity** - Incorporate randomization, counterbalancing
3. **Explore plugins** - Try different jsPsych plugins
4. **Collect real data** - Run a pilot study with actual participants
5. **Analyze results** - Export and analyze your data
6. **Refine and iterate** - Improve your experiment based on results

### Getting Help

If you encounter issues not covered in this tutorial:

1. **Check the troubleshooting section** above
2. **Search existing documentation** and forums
3. **Create minimal examples** to isolate problems
4. **Ask specific questions** in community forums
5. **Provide error messages** and code samples when asking for help

Remember: Building mobile experiments is an iterative process. Start simple, test often, and gradually add complexity as you become more comfortable with the tools and techniques.

Good luck with your mobile psychology experiments!