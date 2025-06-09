const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const createApp = require('../lib/create-app');

// Mock the dependencies
jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('chalk', () => ({
  blue: jest.fn(text => text),
  green: jest.fn(text => text),
  yellow: jest.fn(text => text),
  red: jest.fn(text => text),
  cyan: jest.fn(text => text)
}));

describe('createApp', () => {
  const testProjectName = 'test-app';
  const targetDir = path.join(process.cwd(), testProjectName);
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.mkdirp.mockImplementation(() => {});
    fs.copy.mockImplementation(() => Promise.resolve());
    fs.readJson.mockImplementation(() => Promise.resolve({
      name: 'test-package',
      scripts: {}
    }));
    fs.writeJson.mockImplementation(() => Promise.resolve());
    fs.writeFileSync.mockImplementation(() => {});
    execSync.mockImplementation(() => {});
    
    // Mock process methods
    process.chdir = jest.fn();
    process.exit = jest.fn();
    
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  test('should fail if directory already exists', async () => {
    fs.existsSync.mockReturnValue(true);
    
    await createApp(testProjectName, {});
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(`Directory ${testProjectName} already exists!`)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should create project directory structure', async () => {
    await createApp(testProjectName, {});
    
    expect(fs.mkdirSync).toHaveBeenCalledWith(targetDir);
    expect(process.chdir).toHaveBeenCalledWith(targetDir);
    expect(fs.mkdirSync).toHaveBeenCalledWith('www');
    expect(fs.mkdirSync).toHaveBeenCalledWith('platforms');
    expect(fs.mkdirSync).toHaveBeenCalledWith('plugins');
  });

  test('should initialize npm project', async () => {
    await createApp(testProjectName, {});
    
    expect(execSync).toHaveBeenCalledWith('npm init -y', { stdio: 'inherit' });
  });

  test('should install Cordova locally', async () => {
    await createApp(testProjectName, {});
    
    expect(execSync).toHaveBeenCalledWith(
      'npm install cordova --save-dev',
      { stdio: 'inherit' }
    );
  });

  test('should create experiments directory structure', async () => {
    await createApp(testProjectName, {});
    
    const experimentsDir = path.join(targetDir, 'www/js/experiments');
    expect(fs.mkdirSync).toHaveBeenCalledWith(experimentsDir, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(experimentsDir, 'profile'));
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(experimentsDir, 'sample-experiment'));
  });

  test('should copy template files when they exist', async () => {
    fs.existsSync.mockImplementation((path) => {
      if (path === targetDir) return false;
      return path.includes('templates/app/www');
    });
    
    await createApp(testProjectName, {});
    
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('templates/app/www'),
      expect.stringContaining('www'),
      { overwrite: true }
    );
  });

  test('should create default config.xml when template does not exist', async () => {
    fs.existsSync.mockImplementation((path) => {
      if (path === targetDir) return false;
      return !path.includes('config.xml');
    });
    
    await createApp(testProjectName, {});
    
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'config.xml',
      expect.stringContaining('<?xml version=\'1.0\' encoding=\'utf-8\'?>')
    );
  });

  test('should update package.json with Cordova scripts', async () => {
    const mockPackageJson = {
      name: 'test-package',
      scripts: {}
    };
    
    fs.readJson.mockResolvedValue(mockPackageJson);
    
    await createApp(testProjectName, {});
    
    expect(fs.writeJson).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
      expect.objectContaining({
        scripts: expect.objectContaining({
          cordova: 'cordova',
          serve: 'cordova serve',
          android: 'cordova run android',
          ios: 'cordova run ios'
        })
      }),
      { spaces: 2 }
    );
  });

  test('should add required Cordova plugins', async () => {
    await createApp(testProjectName, {});
    
    const expectedPlugins = [
      'cordova-plugin-file',
      'cordova-plugin-badge',
      'cordova-plugin-local-notification',
      'cordova-plugin-wkwebview-file-xhr',
      'cordova-plugin-whitelist'
    ];
    
    expectedPlugins.forEach(plugin => {
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(`cordova plugin add ${plugin}`),
        expect.any(Object)
      );
    });
  });

  test('should handle plugin installation failures gracefully', async () => {
    execSync.mockImplementation((cmd) => {
      if (cmd.includes('plugin add')) {
        throw new Error('Plugin installation failed');
      }
    });
    
    await createApp(testProjectName, {});
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Could not add')
    );
    // Should not exit on plugin failure
    expect(process.exit).not.toHaveBeenCalled();
  });

  test('should clean up on error', async () => {
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {
      throw new Error('Failed to create directory');
    });
    fs.removeSync.mockImplementation(() => {});
    
    await createApp(testProjectName, {});
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error creating app:'),
      'Failed to create directory'
    );
    expect(fs.removeSync).toHaveBeenCalledWith(targetDir);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});