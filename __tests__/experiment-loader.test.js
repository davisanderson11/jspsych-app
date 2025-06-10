// Mock the browser environment
global.window = {};
global.document = {
  head: {
    appendChild: jest.fn()
  },
  createElement: jest.fn((tag) => {
    if (tag === 'script') {
      return {
        onload: null,
        onerror: null,
        src: ''
      };
    }
  })
};

// Load the experiment loader
require('../templates/app/www/js/experiment-loader.js');

describe('ExperimentLoader', () => {
  let mockScript;

  beforeEach(() => {
    // Clear experiments registry
    const experiments = window.ExperimentLoader.getAll();
    Object.keys(experiments).forEach(key => delete experiments[key]);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a fresh mock script element for each test
    mockScript = {
      onload: null,
      onerror: null,
      src: ''
    };
    document.createElement.mockReturnValue(mockScript);
  });

  describe('register', () => {
    test('should register an experiment', () => {
      const experimentModule = {
        run: jest.fn(),
        checkUserId: jest.fn()
      };
      
      window.ExperimentLoader.register('test-experiment', experimentModule);
      
      const registered = window.ExperimentLoader.get('test-experiment');
      expect(registered).toBe(experimentModule);
    });

    test('should log registration', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      window.ExperimentLoader.register('test-experiment', {});
      
      expect(consoleSpy).toHaveBeenCalledWith('Registering experiment:', 'test-experiment');
      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    test('should return registered experiment', () => {
      const experimentModule = { run: jest.fn() };
      window.ExperimentLoader.register('test-experiment', experimentModule);
      
      const result = window.ExperimentLoader.get('test-experiment');
      expect(result).toBe(experimentModule);
    });

    test('should return undefined for non-existent experiment', () => {
      const result = window.ExperimentLoader.get('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    test('should return all registered experiments', () => {
      const exp1 = { run: jest.fn() };
      const exp2 = { run: jest.fn() };
      
      window.ExperimentLoader.register('exp1', exp1);
      window.ExperimentLoader.register('exp2', exp2);
      
      const all = window.ExperimentLoader.getAll();
      expect(all).toEqual({
        exp1: exp1,
        exp2: exp2
      });
    });

    test('should return empty object when no experiments registered', () => {
      const all = window.ExperimentLoader.getAll();
      expect(all).toEqual({});
    });
  });

  describe('loadScript', () => {
    test('should create and append script element', async () => {
      const loadPromise = window.ExperimentLoader.loadScript('test.js');
      
      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(mockScript.src).toBe('test.js');
      expect(document.head.appendChild).toHaveBeenCalledWith(mockScript);
      
      // Trigger onload
      mockScript.onload();
      
      await expect(loadPromise).resolves.toBeUndefined();
    });

    test('should reject on script error', async () => {
      const loadPromise = window.ExperimentLoader.loadScript('error.js');
      
      // Trigger onerror
      mockScript.onerror();
      
      await expect(loadPromise).rejects.toBeUndefined();
    });

    test('should set correct script properties', () => {
      window.ExperimentLoader.loadScript('path/to/script.js');
      
      expect(mockScript.src).toBe('path/to/script.js');
      expect(typeof mockScript.onload).toBe('function');
      expect(typeof mockScript.onerror).toBe('function');
    });
  });

  describe('loadExperiments', () => {
    test('should load multiple experiment scripts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const experimentList = ['exp1', 'exp2', 'exp3'];
      
      // Mock successful script loading
      document.createElement.mockImplementation(() => {
        const script = {
          onload: null,
          onerror: null,
          src: ''
        };
        // Auto-trigger onload after a tick
        setTimeout(() => script.onload && script.onload(), 0);
        return script;
      });
      
      const result = await window.ExperimentLoader.loadExperiments(experimentList);
      
      expect(consoleSpy).toHaveBeenCalledWith('Loading experiments:', experimentList);
      expect(consoleSpy).toHaveBeenCalledWith('Loaded experiment: exp1');
      expect(consoleSpy).toHaveBeenCalledWith('Loaded experiment: exp2');
      expect(consoleSpy).toHaveBeenCalledWith('Loaded experiment: exp3');
      
      expect(document.createElement).toHaveBeenCalledTimes(3);
      
      consoleSpy.mockRestore();
    });

    test('should handle script loading failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const experimentList = ['failing-exp'];
      
      // Mock script loading failure
      document.createElement.mockImplementation(() => {
        const script = {
          onload: null,
          onerror: null,
          src: ''
        };
        // Auto-trigger onerror
        setTimeout(() => script.onerror && script.onerror(new Error('Failed to load')), 0);
        return script;
      });
      
      await window.ExperimentLoader.loadExperiments(experimentList);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load experiment failing-exp:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('should construct correct script paths', async () => {
      const scripts = [];
      document.createElement.mockImplementation(() => {
        const script = {
          onload: null,
          onerror: null,
          src: ''
        };
        scripts.push(script);
        setTimeout(() => script.onload && script.onload(), 0);
        return script;
      });
      
      await window.ExperimentLoader.loadExperiments(['profile', 'sample']);
      
      expect(scripts[0].src).toBe('js/experiments/profile/index.js');
      expect(scripts[1].src).toBe('js/experiments/sample/index.js');
    });

    test('should return experiments object after loading', async () => {
      // Mock successful loading
      document.createElement.mockImplementation(() => {
        const script = {
          onload: null,
          onerror: null,
          src: ''
        };
        setTimeout(() => script.onload && script.onload(), 0);
        return script;
      });
      
      // Pre-register some experiments
      window.ExperimentLoader.register('exp1', { run: jest.fn() });
      
      const result = await window.ExperimentLoader.loadExperiments(['exp1']);
      
      expect(result).toEqual(window.ExperimentLoader.getAll());
    });
  });

  describe('integration', () => {
    test('should handle complete experiment loading workflow', async () => {
      const experimentModule = {
        run: jest.fn(),
        checkUserId: jest.fn()
      };
      
      // Simulate script loading that registers an experiment
      document.createElement.mockImplementation(() => {
        const script = {
          onload: null,
          onerror: null,
          src: ''
        };
        setTimeout(() => {
          // Simulate the loaded script registering itself
          window.ExperimentLoader.register('integration-test', experimentModule);
          script.onload && script.onload();
        }, 0);
        return script;
      });
      
      await window.ExperimentLoader.loadExperiments(['integration-test']);
      
      const loaded = window.ExperimentLoader.get('integration-test');
      expect(loaded).toBe(experimentModule);
      expect(loaded.run).toBeDefined();
      expect(loaded.checkUserId).toBeDefined();
    });
  });
});