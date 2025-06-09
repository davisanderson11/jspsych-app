const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

async function createApp(projectName, options) {
  const targetDir = path.join(process.cwd(), projectName);
  
  // Check if directory exists
  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Directory ${projectName} already exists!`));
    process.exit(1);
  }

  console.log(chalk.blue(`Creating a new jsPsych Cordova app in ${targetDir}`));

  try {
    // Create the project directory
    fs.mkdirSync(targetDir);
    process.chdir(targetDir);
    
    // Initialize npm project
    console.log(chalk.blue('Initializing npm project...'));
    execSync('npm init -y', { stdio: 'inherit' });
    
    // Install Cordova as a local dependency
    console.log(chalk.blue('Installing Cordova locally...'));
    execSync('npm install cordova --save-dev', { stdio: 'inherit' });
    
    // Create a basic Cordova project structure
    console.log(chalk.blue('Creating Cordova project structure...'));
    
    // Instead of using 'cordova create', we'll set up the structure manually
    // This avoids the issue of Cordova overwriting our files
    
    // Create necessary directories
    fs.mkdirSync('www');
    fs.mkdirSync('platforms');
    fs.mkdirSync('plugins');
    
    // Copy template files
    console.log(chalk.blue('Applying jsPsych template...'));
    const templateDir = path.join(__dirname, '../templates/app');
    
    // Copy www folder contents
    const templateWww = path.join(templateDir, 'www');
    if (fs.existsSync(templateWww)) {
      await fs.copy(templateWww, path.join(targetDir, 'www'), { overwrite: true });
    }
    
    // Create experiments folder structure in www/js
    const experimentsDir = path.join(targetDir, 'www/js/experiments');
    fs.mkdirSync(experimentsDir, { recursive: true });
    
    // Create profile experiment
    const profileExperimentDir = path.join(experimentsDir, 'profile');
    fs.mkdirSync(profileExperimentDir);
    
    // Copy or create profile experiment
    const profileExperimentTemplate = path.join(templateDir, 'www/js/experiments/profile/index.js');
    if (fs.existsSync(profileExperimentTemplate)) {
      await fs.copy(profileExperimentTemplate, path.join(profileExperimentDir, 'index.js'));
    } else {
      // Create profile experiment inline if template doesn't exist
      const profileExperimentContent = `// Profile experiment - self-registering version
(function() {
   
    // Define the experiment
    function run(jsPsych) {
        // Generate a random UUID in XXXX-XXXX-XXXX-XXXX format
        function generateUUID() {
            const chars = '0123456789ABCDEF';
            let uuid = '';
            for (let i = 0; i < 4; i++) {
                if (i > 0) uuid += '-';
                for (let j = 0; j < 4; j++) {
                    uuid += chars[Math.floor(Math.random() * 16)];
                }
            }
            return uuid;
        }

        const timeline = [];

        // Custom HTML form for profile input
        const profileForm = {
            type: jsPsychSurveyHtmlForm,
            preamble: \`
                <h2>Welcome!</h2>
                <p>Please enter your User ID or leave blank to generate one automatically.</p>
            \`,
            html: \`
                <div style="margin: 20px 0;">
                    <label for="userId" style="display: block; margin-bottom: 10px; font-weight: bold;">
                        User ID:
                    </label>
                    <input
                        type="text"
                        id="userId"
                        name="userId"
                        placeholder="Enter ID or leave blank"
                        style="width: 100%; padding: 10px; font-size: 16px; border: 2px solid #ccc; border-radius: 4px;"
                        pattern="[A-Za-z0-9-]+"
                        title="Please use only letters, numbers, and hyphens"
                    >
                    <p style="font-size: 14px; color: #666; margin-top: 5px;">
                        Format: XXXX-XXXX-XXXX-XXXX (will be generated if left blank)
                    </p>
                </div>
            \`,
            button_label: 'Continue',
            on_finish: function(data) {
                let userId = data.response.userId.trim();
                if (!userId) {
                    userId = generateUUID();
                    console.log('Generated new User ID:', userId);
                } else {
                    console.log('User entered ID:', userId);
                }
               
                jsPsych.data.addProperties({
                    userId: userId,
                    profileCompleted: true
                });
               
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('jspsych_userId', userId);
                }
            }
        };

        const welcomeMessage = {
            type: jsPsychHtmlButtonResponse,
            stimulus: function() {
                const userId = jsPsych.data.get().filter({profileCompleted: true}).values()[0].userId;
                return \`
                    <h2>Profile Created!</h2>
                    <p>Your User ID is:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #007bff; font-family: monospace;">
                        \${userId}
                    </p>
                    <p>This ID has been saved to your device.</p>
                    <p>Press the button below to continue to the experiment.</p>
                \`;
            },
            choices: ['Continue']
        };

        timeline.push(profileForm);
        timeline.push(welcomeMessage);

        return timeline;
    }
   
    // Check if user has an ID
    function checkUserId() {
        return new Promise((resolve) => {
            if (typeof localStorage !== 'undefined') {
                const userId = localStorage.getItem('jspsych_userId');
                resolve(userId);
            } else {
                resolve(null);
            }
        });
    }
   
    // Register this experiment
    if (window.ExperimentLoader) {
        window.ExperimentLoader.register('profile', {
            run: run,
            checkUserId: checkUserId
        });
    }
   
})();`;
      fs.writeFileSync(path.join(profileExperimentDir, 'index.js'), profileExperimentContent);
    }
    
    // Create a sample experiment
    const sampleExperimentDir = path.join(experimentsDir, 'sample-experiment');
    fs.mkdirSync(sampleExperimentDir);
    
    // Create sample experiment file
    const sampleExperimentContent = `// Sample experiment - self-registering version
(function() {
   
    function run(jsPsych) {
        const timeline = [];
       
        const welcome = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<h2>Sample Experiment</h2><p>Click the button to continue.</p>',
            choices: ['Continue']
        };
        timeline.push(welcome);
       
        const trial = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>This is a sample trial. Click the button to end.</p>',
            choices: ['Next']
        };
        timeline.push(trial);
       
        return timeline;
    }
   
    // Register this experiment
    if (window.ExperimentLoader) {
        window.ExperimentLoader.register('sample-experiment', {
            run: run
        });
    }
   
})();`;
    
    fs.writeFileSync(path.join(sampleExperimentDir, 'index.js'), sampleExperimentContent);
    
    // Copy config.xml
    const templateConfig = path.join(templateDir, 'config.xml');
    if (fs.existsSync(templateConfig)) {
      await fs.copy(templateConfig, path.join(targetDir, 'config.xml'));
    } else {
      // Create a default config.xml if template doesn't exist
      const defaultConfig = `<?xml version='1.0' encoding='utf-8'?>
<widget id="com.example.${projectName.replace(/[^a-zA-Z0-9]/g, '')}" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>${projectName}</name>
    <description>A jsPsych experiment app</description>
    <author email="dev@example.com" href="http://example.com">
        jsPsych Developer
    </author>
    <content src="index.html" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <preference name="DisallowOverscroll" value="true" />
    <preference name="android-minSdkVersion" value="22" />
    <platform name="android">
        <preference name="android-compileSdkVersion" value="35" />
        <preference name="android-targetSdkVersion" value="34" />
    </platform>
</widget>`;
      fs.writeFileSync('config.xml', defaultConfig);
    }
    
    // Update package.json with scripts and dependencies
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    
    packageJson.name = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    packageJson.displayName = projectName;
    packageJson.description = 'A jsPsych experiment app built with Cordova';
    
    // Add Cordova-specific scripts using npx
    packageJson.scripts = {
      ...packageJson.scripts,
      'cordova': 'cordova',
      'serve': 'cordova serve',
      'android': 'cordova run android',
      'ios': 'cordova run ios',
      'build-android': 'cordova build android',
      'build-ios': 'cordova build ios',
      'platform-add-android': 'cordova platform add android',
      'platform-add-ios': 'cordova platform add ios',
      'requirements': 'cordova requirements'
    };
    
    // Add cordova to devDependencies if not already there
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies.cordova = packageJson.devDependencies.cordova || '^12.0.0';
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    
    // Add platforms
    console.log(chalk.blue('\nAdding platforms...'));
    console.log(chalk.yellow('Note: Platform requirements must be met for each platform'));
    
    // Add required plugins
    console.log(chalk.blue('Adding required plugins...'));
    try {
      execSync('npx cordova plugin add cordova-plugin-file', { stdio: 'inherit' });
      console.log(chalk.green('✓ File plugin added'));
    } catch (error) {
      console.log(chalk.yellow('⚠ Could not add file plugin. You can add it later with: cordova plugin add cordova-plugin-file'));
    }
    try {
      execSync('npx cordova plugin add cordova-plugin-badge', { stdio: 'inherit' });
      console.log(chalk.green('✓ Badge plugin added'));
    } catch (error) {
      console.log(chalk.yellow('⚠ Could not add badge plugin. You can add it later with: cordova plugin add cordova-plugin-badge'));
    }
    try {
      execSync('npx cordova plugin add cordova-plugin-local-notification --variable ANDROID_SUPPORT_V4_VERSION=26.+', { stdio: 'inherit' });
      console.log(chalk.green('✓ Local notification plugin added'));
    } catch (error) {
      console.log(chalk.yellow('⚠ Could not add local notification plugin. You can add it later with: cordova plugin add cordova-plugin-local-notification'));
    }
    try {
      execSync('npx cordova plugin add cordova-plugin-wkwebview-file-xhr');
      console.log(chalk.green('✓ Webview plugin added'));
    } catch (error) {
      console.log(chalk.yellow('⚠ Could not add webview plugin. You can add it later with: cordova plugin add cordova-plugin-wkwebview-file-xhr'));
    }
    try {
      execSync('npx cordova plugin add cordova-plugin-whitelist', { stdio: 'inherit' });
      console.log(chalk.green('✓ Whitelist plugin added'));
    } catch (error) {
      console.log(chalk.yellow('⚠ Could not add whitelist plugin. You can add it later with: cordova plugin add cordova-plugin-whitelist'));
    }
    
    // Try to add Android
    try {
      console.log(chalk.blue('Adding Android platform...'));
      execSync('npx cordova platform add android', { stdio: 'inherit' });
      console.log(chalk.green('✓ Android platform added'));
    } catch (error) {
      console.log(chalk.yellow('⚠ Could not add Android platform.'));
      console.log(chalk.yellow('  You can add it later with: npm run platform-add-android'));
    }
    
    // Try to add iOS (only on macOS)
    if (process.platform === 'darwin') {
      try {
        console.log(chalk.blue('Adding iOS platform...'));
        execSync('npx cordova platform add ios', { stdio: 'inherit' });
        console.log(chalk.green('✓ iOS platform added'));
      } catch (error) {
        console.log(chalk.yellow('⚠ Could not add iOS platform.'));
        console.log(chalk.yellow('  You can add it later with: npm run platform-add-ios'));
      }
    }
    
    console.log(chalk.green('\nSuccess! Created ' + projectName));
    console.log('\nYour app structure:');
    console.log('  www/js/experiments/ - Place your experiment folders here');
    console.log('  www/js/index.js - Main file that stitches experiments together');
    
    console.log('\nTo add a new experiment:');
    console.log('  1. Create a folder in www/js/experiments/');
    console.log('  2. Add an index.js that exports a run(jsPsych) function');
    console.log('  3. Import and add it to www/js/index.js');
    
    console.log('\nAvailable commands:');
    console.log(chalk.cyan('  npm run android'));
    console.log('    Runs the app on Android (requires Android SDK)');
    if (process.platform === 'darwin') {
      console.log(chalk.cyan('  npm run ios'));
      console.log('    Runs the app on iOS (requires Xcode)');
    }
    console.log(chalk.cyan('  npm run requirements'));
    console.log('    Check if your system meets platform requirements');
    
    // Platform setup instructions
    console.log(chalk.yellow('\nPlatform Setup:'));
    console.log('If platforms were not added automatically, you can add them with:');
    console.log(chalk.cyan('  npm run platform-add-android'));
    if (process.platform === 'darwin') {
      console.log(chalk.cyan('  npm run platform-add-ios'));
    }
    
    console.log('\nFor Android development, you need:');
    console.log('  - Android Studio with Android SDK');
    console.log('  - Java JDK 11 or higher');
    console.log('  - Set ANDROID_HOME environment variable');
    
    if (process.platform === 'darwin') {
      console.log('\nFor iOS development, you need:');
      console.log('  - Xcode (from Mac App Store)');
      console.log('  - Xcode Command Line Tools');
    }
    
  } catch (error) {
    console.error(chalk.red('\n⚠ Error creating app:'), error.message);
    
    // Clean up if we created the directory
    if (fs.existsSync(targetDir)) {
      console.log(chalk.yellow('\nCleaning up...'));
      process.chdir('..');
      fs.removeSync(targetDir);
    }
    
    process.exit(1);
  }
}

module.exports = createApp;