// Mock the browser/Cordova environment
global.window = {
  cordova: {
    plugins: {
      notification: {
        local: {
          hasPermission: jest.fn(),
          requestPermission: jest.fn(),
          schedule: jest.fn(),
          cancel: jest.fn(),
          cancelAll: jest.fn(),
          getScheduled: jest.fn(),
          on: jest.fn()
        }
      }
    }
  },
  location: {
    hash: ''
  }
};

global.document = {
  addEventListener: jest.fn()
};

global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

global.Date = Date;

// Load the notification manager
require('../templates/app/www/js/notification-manager.js');

describe('NotificationManager', () => {
  let notificationManager;
  let deviceReadyCallback;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Capture the deviceready callback
    document.addEventListener.mockImplementation((event, callback) => {
      if (event === 'deviceready') {
        deviceReadyCallback = callback;
      }
    });
    
    // Reset the notification manager
    notificationManager = window.notificationManager;
    notificationManager.isReady = false;
    notificationManager.notifications = [];
    
    // Default mock implementations
    window.cordova.plugins.notification.local.hasPermission.mockImplementation((callback) => {
      callback(true);
    });
    window.cordova.plugins.notification.local.requestPermission.mockImplementation((callback) => {
      callback(true);
    });
    localStorage.getItem.mockReturnValue(null);
  });

  describe('initialization', () => {
    test('should set up event listener on creation', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('deviceready', expect.any(Function), false);
    });

    test('should initialize as not ready', () => {
      expect(notificationManager.isReady).toBe(false);
      expect(notificationManager.notifications).toEqual([]);
    });
  });

  describe('setupNotifications', () => {
    beforeEach(() => {
      // Trigger deviceready
      notificationManager.isReady = true;
    });

    test('should request permission if not granted', () => {
      window.cordova.plugins.notification.local.hasPermission.mockImplementation((callback) => {
        callback(false);
      });

      notificationManager.setupNotifications();

      expect(window.cordova.plugins.notification.local.requestPermission).toHaveBeenCalled();
    });

    test('should not request permission if already granted', () => {
      window.cordova.plugins.notification.local.hasPermission.mockImplementation((callback) => {
        callback(true);
      });

      notificationManager.setupNotifications();

      expect(window.cordova.plugins.notification.local.requestPermission).not.toHaveBeenCalled();
    });

    test('should set up click handler', () => {
      notificationManager.setupNotifications();

      expect(window.cordova.plugins.notification.local.on).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should handle missing notification plugin', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      window.cordova = null;

      notificationManager.setupNotifications();

      expect(consoleSpy).toHaveBeenCalledWith('Local notifications plugin not available');
      consoleSpy.mockRestore();
    });
  });

  describe('scheduleNotification', () => {
    beforeEach(() => {
      notificationManager.isReady = true;
    });

    test('should schedule a notification with default values', () => {
      const options = {
        text: 'Test notification'
      };

      notificationManager.scheduleNotification(options);

      expect(window.cordova.plugins.notification.local.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(Number),
          title: 'jsPsych Experiment Reminder',
          text: 'Test notification',
          icon: 'res://icon',
          smallIcon: 'res://icon'
        })
      );
    });

    test('should use provided options', () => {
      const options = {
        id: 12345,
        title: 'Custom Title',
        text: 'Custom Text',
        trigger: { at: new Date() }
      };

      notificationManager.scheduleNotification(options);

      expect(window.cordova.plugins.notification.local.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 12345,
          title: 'Custom Title',
          text: 'Custom Text',
          trigger: { at: expect.any(Date) }
        })
      );
    });

    test('should add notification to internal list', () => {
      notificationManager.scheduleNotification({ text: 'Test' });

      expect(notificationManager.notifications).toHaveLength(1);
      expect(notificationManager.notifications[0]).toHaveProperty('text', 'Test');
    });

    test('should not schedule if not ready', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      notificationManager.isReady = false;

      notificationManager.scheduleNotification({ text: 'Test' });

      expect(consoleSpy).toHaveBeenCalledWith('Notifications not ready');
      expect(window.cordova.plugins.notification.local.schedule).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('scheduleRecurringNotifications', () => {
    beforeEach(() => {
      notificationManager.isReady = true;
      localStorage.getItem.mockReturnValue('TEST-USER');
    });

    test('should schedule daily notification', () => {
      const startTime = new Date();
      startTime.setHours(10, 30, 0, 0);

      notificationManager.scheduleRecurringNotifications({
        title: 'Daily Reminder',
        text: 'Complete your task',
        interval: 'daily',
        startTime: startTime
      });

      expect(window.cordova.plugins.notification.local.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Daily Reminder',
          text: 'Complete your task',
          trigger: {
            every: {
              hour: 10,
              minute: 30
            }
          }
        })
      );
    });

    test('should schedule weekly notification', () => {
      const startTime = new Date();
      startTime.setHours(14, 0, 0, 0);

      notificationManager.scheduleRecurringNotifications({
        interval: 'weekly',
        startTime: startTime
      });

      expect(window.cordova.plugins.notification.local.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: {
            every: {
              weekday: startTime.getDay(),
              hour: 14,
              minute: 0
            }
          }
        })
      );
    });

    test('should schedule with minute interval', () => {
      notificationManager.scheduleRecurringNotifications({
        interval: 5 // 5 minutes
      });

      expect(window.cordova.plugins.notification.local.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: {
            every: {
              minute: 5
            }
          }
        })
      );
    });

    test('should include user ID in data', () => {
      notificationManager.scheduleRecurringNotifications({});

      expect(window.cordova.plugins.notification.local.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'TEST-USER'
          })
        })
      );
    });

    test('should return notification ID', () => {
      const id = notificationManager.scheduleRecurringNotifications({});

      expect(typeof id).toBe('number');
    });
  });

  describe('scheduleMultipleNotifications', () => {
    beforeEach(() => {
      notificationManager.isReady = true;
    });

    test('should schedule multiple notifications', () => {
      const schedules = [
        { time: '2024-01-01T10:00:00', title: 'Morning', text: 'Morning task' },
        { time: '2024-01-01T14:00:00', title: 'Afternoon', text: 'Afternoon task' },
        { time: '2024-01-01T18:00:00', title: 'Evening', text: 'Evening task' }
      ];

      notificationManager.scheduleMultipleNotifications(schedules);

      expect(window.cordova.plugins.notification.local.schedule).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Morning',
            text: 'Morning task',
            trigger: { at: new Date('2024-01-01T10:00:00') }
          }),
          expect.objectContaining({
            title: 'Afternoon',
            text: 'Afternoon task',
            trigger: { at: new Date('2024-01-01T14:00:00') }
          }),
          expect.objectContaining({
            title: 'Evening',
            text: 'Evening task',
            trigger: { at: new Date('2024-01-01T18:00:00') }
          })
        ])
      );
    });

    test('should add all notifications to internal list', () => {
      const schedules = [
        { time: '2024-01-01T10:00:00' },
        { time: '2024-01-01T14:00:00' }
      ];

      notificationManager.scheduleMultipleNotifications(schedules);

      expect(notificationManager.notifications).toHaveLength(2);
    });

    test('should include experiment ID if provided', () => {
      const schedules = [
        { time: '2024-01-01T10:00:00', experimentId: 'exp1' }
      ];

      notificationManager.scheduleMultipleNotifications(schedules);

      expect(window.cordova.plugins.notification.local.schedule).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              experimentId: 'exp1'
            })
          })
        ])
      );
    });
  });

  describe('cancelNotification', () => {
    beforeEach(() => {
      notificationManager.isReady = true;
      notificationManager.notifications = [
        { id: 1, text: 'Test 1' },
        { id: 2, text: 'Test 2' },
        { id: 3, text: 'Test 3' }
      ];
    });

    test('should cancel specific notification', () => {
      notificationManager.cancelNotification(2);

      expect(window.cordova.plugins.notification.local.cancel).toHaveBeenCalledWith(2);
      expect(notificationManager.notifications).toHaveLength(2);
      expect(notificationManager.notifications.find(n => n.id === 2)).toBeUndefined();
    });

    test('should handle canceling non-existent notification', () => {
      notificationManager.cancelNotification(999);

      expect(window.cordova.plugins.notification.local.cancel).toHaveBeenCalledWith(999);
      expect(notificationManager.notifications).toHaveLength(3);
    });
  });

  describe('cancelAllNotifications', () => {
    beforeEach(() => {
      notificationManager.isReady = true;
      notificationManager.notifications = [
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ];
    });

    test('should cancel all notifications', () => {
      notificationManager.cancelAllNotifications();

      expect(window.cordova.plugins.notification.local.cancelAll).toHaveBeenCalled();
      expect(notificationManager.notifications).toEqual([]);
    });
  });

  describe('getScheduledNotifications', () => {
    beforeEach(() => {
      notificationManager.isReady = true;
    });

    test('should return scheduled notifications', async () => {
      const mockNotifications = [
        { id: 1, title: 'Test 1' },
        { id: 2, title: 'Test 2' }
      ];

      window.cordova.plugins.notification.local.getScheduled.mockImplementation((callback) => {
        callback(mockNotifications);
      });

      const result = await notificationManager.getScheduledNotifications();

      expect(result).toEqual(mockNotifications);
    });

    test('should return empty array if not ready', async () => {
      notificationManager.isReady = false;

      const result = await notificationManager.getScheduledNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('handleNotificationClick', () => {
    test('should log notification click', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const notification = { id: 1, title: 'Test' };

      notificationManager.handleNotificationClick(notification);

      expect(consoleSpy).toHaveBeenCalledWith('Handling notification click:', notification);
      consoleSpy.mockRestore();
    });

    test('should navigate to experiment if experiment ID provided', () => {
      const notification = {
        id: 1,
        data: { experimentId: 'test-experiment' }
      };

      notificationManager.handleNotificationClick(notification);

      expect(window.location.hash).toBe('#experiment/test-experiment');
    });

    test('should not navigate if no experiment ID', () => {
      window.location.hash = '';
      const notification = { id: 1, data: {} };

      notificationManager.handleNotificationClick(notification);

      expect(window.location.hash).toBe('');
    });
  });

  describe('setupDailyReminders', () => {
    beforeEach(() => {
      notificationManager.isReady = true;
      // Mock current date to control test
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T08:00:00').getTime());
    });

    afterEach(() => {
      jest.spyOn(Date, 'now');
    });

    test('should schedule reminders at specified times', () => {
      notificationManager.setupDailyReminders(['09:00', '15:00']);

      expect(window.cordova.plugins.notification.local.schedule).toHaveBeenCalledTimes(2);
    });

    test('should schedule for next day if time has passed', () => {
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T20:00:00').getTime());

      notificationManager.setupDailyReminders(['19:00']);

      const callArgs = window.cordova.plugins.notification.local.schedule.mock.calls[0][0];
      const scheduledTime = callArgs.trigger.every;
      
      expect(scheduledTime.hour).toBe(19);
      expect(scheduledTime.minute).toBe(0);
    });

    test('should use correct time of day in message', () => {
      notificationManager.setupDailyReminders(['08:00', '13:00', '19:00']);

      const calls = window.cordova.plugins.notification.local.schedule.mock.calls;
      
      expect(calls[0][0].text).toContain('morning');
      expect(calls[1][0].text).toContain('afternoon');
      expect(calls[2][0].text).toContain('evening');
    });
  });

  describe('getUserId', () => {
    test('should return user ID from localStorage', () => {
      localStorage.getItem.mockReturnValue('USER-123');

      expect(notificationManager.getUserId()).toBe('USER-123');
    });

    test('should return unknown if no user ID', () => {
      localStorage.getItem.mockReturnValue(null);

      expect(notificationManager.getUserId()).toBe('unknown');
    });

    test('should handle localStorage errors', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(notificationManager.getUserId()).toBe('unknown');
    });
  });
});