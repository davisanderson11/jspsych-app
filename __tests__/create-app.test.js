const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const createApp = require('../lib/create-app');

// Mock all dependencies
jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('chalk', () => ({
  red: jest.fn(str => str),
  blue: jest.fn(str => str),
  green: jest.fn(str => str),
  yellow: jest.fn(str => str),
  cyan: jest.fn(str => str)
}));

describe('createApp', () => {
  const originalCwd = process.cwd();
  const originalPlatform = process.platform;
  const mockCwd = '/test/dir';
  const projectName = 'test-app';
  const targetDir = path.join(mockCwd, projectName);
  
  // Mock console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const mockConsoleLog = jest.fn();
  const mockConsoleError = jest.fn();
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup console mocks
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    
    // Mock process methods
    process.cwd = jest.fn(() => mockCwd);
    process.chdir = jest.fn();
    process.exit = jest.fn();
    
    // Default fs mocks
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.readJson.mockResolvedValue({
      name: 'old-name',
      scripts: {}
    });
    fs.writeJson.mockResolvedValue();
    fs.copy.mockResolvedValue();
    fs.removeSync.mockImplementation(() => {});
    
    // Default execSync behavior (success)
    execSync.mockImplementation(() => {});
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  test('should fail if directory already exists', async () => {
    fs.existsSync.mockReturnValue(true);
    
    await createApp(projectName, {});
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(`Directory ${projectName} already exists!`)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should create project directory structure', async () => {
    await createApp(projectName, {});
    
    expect(fs.mkdirSync).toHaveBeenCalledWith(targetDir);
    expect(process.chdir).toHaveBeenCalledWith(targetDir);
    expect(fs.mkdirSync).toHaveBeenCalledWith('www');
    expect(fs.mkdirSync).toHaveBeenCalledWith('platforms');
    expect(fs.mkdirSync).toHaveBeenCalledWith('plugins');
  });

  test('should initialize npm project', async () => {
    await createApp(projectName, {});
    
    expect(execSync).toHaveBeenCalledWith('npm init -y', { stdio: 'inherit' });
  });

  test('should install Cordova locally', async () => {
    await createApp(projectName, {});
    
    expect(execSync).toHaveBeenCalledWith(
      'npm install cordova --save-dev',
      { stdio: 'inherit' }
    );
  });

  test('should create experiments directory structure', async () => {
    await createApp(projectName, {});
    
    const experimentsDir = path.join(targetDir, 'www/js/experiments');
    expect(fs.mkdirSync).toHaveBeenCalledWith(experimentsDir, { recursive: true });
  });

  test('should copy template files when they exist', async () => {
    // Mock template files exist
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath === targetDir) return false; // target doesn't exist yet
      if (filePath.includes('templates/app/www')) return true;
      if (filePath.includes('templates/app/config.xml')) return true;
      if (filePath.includes('templates/app/www/js/experiments/profile/index.js')) return true;
      return false;
    });

    await createApp(projectName, {});

    // Based on __dirname in create-app.js, templateDir would be ../templates/app relative to lib/
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining(path.join('templates', 'app', 'www')),
      path.join(targetDir, 'www'),
      { overwrite: true }
    );
  });

  test('should create default config.xml when template does not exist', async () => {
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath === targetDir) return false;
      // Return false for all template files
      return false;
    });

    await createApp(projectName, {});

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'config.xml',
      expect.stringContaining('<?xml version=\'1.0\' encoding=\'utf-8\'?>')
    );
  });

  test('should update package.json with Cordova scripts', async () => {
    const mockPackageJson = {
      name: 'old-name',
      scripts: { test: 'jest' }
    };
    fs.readJson.mockResolvedValue(mockPackageJson);

    await createApp(projectName, {});

    expect(fs.writeJson).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
      expect.objectContaining({
        scripts: expect.objectContaining({
          'cordova': 'cordova',
          'serve': 'cordova serve',
          'android': 'cordova run android',
          'ios': 'cordova run ios'
        })
      }),
      { spaces: 2 }
    );
  });

  test('should add required Cordova plugins', async () => {
    await createApp(projectName, {});

    // Check each plugin is installed with correct command
    expect(execSync).toHaveBeenCalledWith(
      'npx cordova plugin add cordova-plugin-file',
      { stdio: 'inherit' }
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx cordova plugin add cordova-plugin-badge',
      { stdio: 'inherit' }
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx cordova plugin add cordova-plugin-local-notification --variable ANDROID_SUPPORT_V4_VERSION=26.+',
      { stdio: 'inherit' }
    );
    // Note: wkwebview plugin doesn't use stdio option
    expect(execSync).toHaveBeenCalledWith(
      'npx cordova plugin add cordova-plugin-wkwebview-file-xhr'
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx cordova plugin add cordova-plugin-whitelist',
      { stdio: 'inherit' }
    );
  });

  test('should handle plugin installation failures gracefully', async () => {
    execSync.mockImplementation((command) => {
      if (command.includes('plugin add')) {
        throw new Error('Plugin installation failed');
      }
    });

    await createApp(projectName, {});

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Could not add')
    );
    expect(process.exit).not.toHaveBeenCalled();
  });

  test('should clean up on error', async () => {
    // Mock that mkdirSync fails after creating target directory
    let mkdirCount = 0;
    fs.mkdirSync.mockImplementation((dir) => {
      mkdirCount++;
      if (mkdirCount === 2) { // Fail on second call (www directory)
        throw new Error('Failed to create directory');
      }
    });
    
    // Directory exists for cleanup
    fs.existsSync.mockReturnValue(true);
    fs.removeSync.mockImplementation(() => {});

    await createApp(projectName, {});

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error creating app:'),
      'Failed to create directory'
    );
    expect(fs.removeSync).toHaveBeenCalledWith(targetDir);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should add Android platform', async () => {
    await createApp(projectName, {});

    expect(execSync).toHaveBeenCalledWith(
      'npx cordova platform add android',
      { stdio: 'inherit' }
    );
  });

  test('should add iOS platform on macOS', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true
    });

    await createApp(projectName, {});

    expect(execSync).toHaveBeenCalledWith(
      'npx cordova platform add ios',
      { stdio: 'inherit' }
    );
  });

  test('should not add iOS platform on non-macOS', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    });

    await createApp(projectName, {});

    expect(execSync).not.toHaveBeenCalledWith(
      'npx cordova platform add ios',
      expect.any(Object)
    );
  });

  test('should display success messages', async () => {
    await createApp(projectName, {});

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(`Success! Created ${projectName}`)
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Your app structure:')
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Available commands:')
    );
  });

  test('should handle special characters in project name', async () => {
    await createApp('My@Special#App!', {});

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'config.xml',
      expect.stringContaining('id="com.example.MySpecialApp"')
    );
  });

  test('should create profile and sample experiments when templates do not exist', async () => {
    fs.existsSync.mockReturnValue(false);

    await createApp(projectName, {});

    // Check profile experiment creation
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('profile/index.js'),
      expect.stringContaining('Profile experiment - self-registering version')
    );

    // Check sample experiment creation  
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('sample-experiment/index.js'),
      expect.stringContaining('Sample experiment - self-registering version')
    );
  });

  test('should handle platform addition failures', async () => {
    execSync.mockImplementation((command) => {
      if (command.includes('platform add')) {
        throw new Error('Platform addition failed');
      }
    });

    await createApp(projectName, {});

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Could not add Android platform')
    );
  });

  test('should create all required directories', async () => {
    await createApp(projectName, {});

    // Check all directory creations
    const profileDir = path.join(targetDir, 'www/js/experiments/profile');
    const sampleDir = path.join(targetDir, 'www/js/experiments/sample-experiment');
    
    expect(fs.mkdirSync).toHaveBeenCalledWith(profileDir);
    expect(fs.mkdirSync).toHaveBeenCalledWith(sampleDir);
  });

  test('should handle iOS instructions on macOS', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true
    });

    await createApp(projectName, {});

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('npm run ios')
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('For iOS development, you need:')
    );
  });

  test('should copy profile experiment template when it exists', async () => {
    const templateDir = path.join(__dirname, '../lib/../templates/app');
    const profileTemplate = path.join(templateDir, 'www/js/experiments/profile/index.js');
    
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath === targetDir) return false;
      if (filePath === profileTemplate) return true;
      return false;
    });

    await createApp(projectName, {});

    expect(fs.copy).toHaveBeenCalledWith(
      profileTemplate,
      expect.stringContaining('profile/index.js')
    );
  });

  test('should update package.json with devDependencies', async () => {
    const mockPackageJson = {
      name: 'old-name',
      scripts: {}
      // No devDependencies
    };
    fs.readJson.mockResolvedValue(mockPackageJson);

    await createApp(projectName, {});

    expect(fs.writeJson).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        devDependencies: expect.objectContaining({
          cordova: '^12.0.0'
        })
      }),
      { spaces: 2 }
    );
  });
});