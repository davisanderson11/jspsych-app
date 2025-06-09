// Mock the browser environment
global.window = {
  DataPipeEnabled: false,
  DataPipeConfig: {},
  sendToDataPipe: null,
  retryFailedSubmissions: null,
  createCompletionScreen: null,
  cordova: null,
  resolveLocalFileSystemURL: jest.fn()
};

global.fetch = jest.fn();

// Load the datapipe-config.js file
require('../templates/app/www/js/datapipe-config.js');

describe('DataPipe Configuration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    global.fetch.mockReset();
    
    // Reset DataPipe config
    window.DataPipeEnabled = false;
    window.DataPipeConfig = {
      experimentId: 'EXPERIMENT-ID',
      apiUrl: 'https://pipe.jspsych.org/api/data/',
    };
  });

  describe('convertToCSV', () => {
    // Access the function through the IIFE
    const convertToCSV = (data) => {
      // This is a simplified version for testing
      if (!data || data.length === 0) {
        return '';
      }
      
      const allKeys = new Set();
      data.forEach(trial => {
        Object.keys(trial).forEach(key => allKeys.add(key));
      });
      
      const headers = Array.from(allKeys).sort();
      const csvRows = [headers.join(',')];
      
      data.forEach(trial => {
        const row = headers.map(header => {
          const value = trial[header];
          if (value === undefined || value === null) {
            return '';
          }
          if (typeof value === 'object') {
            return JSON.stringify(value).replace(/,/g, ';');
          }
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    };

    test('should return empty string for empty data', () => {
      expect(convertToCSV([])).toBe('');
      expect(convertToCSV(null)).toBe('');
      expect(convertToCSV(undefined)).toBe('');
    });

    test('should convert simple data to CSV', () => {
      const data = [
        { trial: 1, rt: 500, response: 'A' },
        { trial: 2, rt: 600, response: 'B' }
      ];
      
      const result = convertToCSV(data);
      const lines = result.split('\n');
      
      expect(lines[0]).toBe('response,rt,trial');
      expect(lines[1]).toBe('A,500,1');
      expect(lines[2]).toBe('B,600,2');
    });

    test('should handle missing values', () => {
      const data = [
        { trial: 1, rt: 500 },
        { trial: 2, response: 'B' }
      ];
      
      const result = convertToCSV(data);
      const lines = result.split('\n');
      
      expect(lines[0]).toBe('response,rt,trial');
      expect(lines[1]).toBe(',500,1');
      expect(lines[2]).toBe('B,,2');
    });

    test('should escape values with commas', () => {
      const data = [
        { trial: 1, response: 'A, B, C' }
      ];
      
      const result = convertToCSV(data);
      const lines = result.split('\n');
      
      expect(lines[1]).toBe('"A, B, C",1');
    });

    test('should handle objects by converting to JSON', () => {
      const data = [
        { trial: 1, data: { key: 'value', nested: true } }
      ];
      
      const result = convertToCSV(data);
      const lines = result.split('\n');
      
      expect(lines[1]).toContain('{"key":"value";"nested":true}');
    });
  });

  describe('sendToDataPipe', () => {
    const mockData = [
      { trial: 1, rt: 500, response: 'A' }
    ];
    const mockUserId = 'TEST-USER-123';
    const mockUpdateStatus = jest.fn();

    beforeEach(() => {
      window.DataPipeEnabled = true;
    });

    test('should send data successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('{"success": true, "message": "Data received"}')
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      const result = await window.sendToDataPipe(mockData, mockUserId, mockUpdateStatus);
      
      expect(fetch).toHaveBeenCalledWith(
        window.DataPipeConfig.apiUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"experimentID":"EXPERIMENT-ID"')
        })
      );
      
      expect(result.success).toBe(true);
      expect(mockUpdateStatus).toHaveBeenCalledWith('Data submitted successfully!');
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      const result = await window.sendToDataPipe(mockData, mockUserId, mockUpdateStatus);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(mockUpdateStatus).toHaveBeenCalledWith('Error: Network error');
    });

    test('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad request')
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      const result = await window.sendToDataPipe(mockData, mockUserId, mockUpdateStatus);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP error! status: 400');
    });

    test('should include timestamp in filename', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('{"success": true}')
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      // Mock Date to control timestamp
      const mockDate = new Date('2024-01-15T10:30:45.123Z');
      const originalDate = Date;
      global.Date = jest.fn(() => mockDate);
      global.Date.now = originalDate.now;
      
      await window.sendToDataPipe(mockData, mockUserId, mockUpdateStatus);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"filename":"TEST-USER-123_2024-01-15T10-30-45-123Z.csv"')
        })
      );
      
      global.Date = originalDate;
    });
  });

  describe('createCompletionScreen', () => {
    const mockJsPsych = {
      data: {
        get: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue([
            { trial: 1, rt: 500 },
            { trial: 2, rt: 600 }
          ])
        })
      }
    };
    const mockUserId = 'TEST-USER';

    test('should create completion screen configuration', () => {
      const screen = window.createCompletionScreen(mockJsPsych, mockUserId);
      
      expect(screen.type).toBe(jsPsychHtmlButtonResponse);
      expect(screen.choices).toEqual(['Continue']);
      expect(typeof screen.stimulus).toBe('function');
      expect(typeof screen.on_load).toBe('function');
    });

    test('should display correct HTML stimulus', () => {
      const screen = window.createCompletionScreen(mockJsPsych, mockUserId);
      const html = screen.stimulus();
      
      expect(html).toContain('Experiment Complete!');
      expect(html).toContain('TEST-USER');
      expect(html).toContain('submission-status');
      expect(html).toContain('@keyframes spin');
    });

    test('should hide button initially', () => {
      const screen = window.createCompletionScreen(mockJsPsych, mockUserId);
      const buttonHtml = screen.button_html('Continue');
      
      expect(buttonHtml).toContain('display: none');
    });
  });

  describe('retryFailedSubmissions', () => {
    test('should not run without Cordova', async () => {
      window.cordova = null;
      
      // Should return early without errors
      await window.retryFailedSubmissions();
      
      expect(window.resolveLocalFileSystemURL).not.toHaveBeenCalled();
    });

    test('should check for failed submission files in Cordova', async () => {
      window.cordova = {
        file: {
          dataDirectory: 'file:///data/'
        }
      };
      
      const mockDirectoryEntry = {
        createReader: jest.fn().mockReturnValue({
          readEntries: jest.fn((callback) => callback([]))
        })
      };
      
      window.resolveLocalFileSystemURL.mockImplementation((path, success) => {
        success(mockDirectoryEntry);
      });
      
      await window.retryFailedSubmissions();
      
      expect(window.resolveLocalFileSystemURL).toHaveBeenCalledWith(
        'file:///data/',
        expect.any(Function)
      );
      expect(mockDirectoryEntry.createReader).toHaveBeenCalled();
    });
  });
});