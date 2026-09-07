import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

/**
 * Storage Service for FleetPro
 * Handles data persistence between LocalStorage (Web) and FileSystem (Mobile/Capacitor)
 */

export const STORAGE_FILE_NAME = 'transport_manager_data.json';
export const STORAGE_DIRECTORY = 'Professional Transport Manager'; // Directory name inside Documents

export const storageService = {
  // Check if running in a native mobile environment (Capacitor/Cordova)
  isNative: () => {
    return Capacitor.isNativePlatform();
  },

  // Request permissions if needed
  requestPermissionsIfNeeded: async () => {
    if (storageService.isNative()) {
      try {
        const permStatus = await Filesystem.checkPermissions();
        console.log('Current Storage Permissions:', permStatus);
        
        if (permStatus.publicStorage !== 'granted') {
          console.log('Requesting Storage Permissions...');
          const request = await Filesystem.requestPermissions();
          console.log('Storage Permission Request Result:', request);
          return request.publicStorage === 'granted';
        }
        return true;
      } catch (e) {
        console.warn('Permission check/request failed', e);
        return false;
      }
    }
    return true;
  },

  // Save data to the best available storage
  saveData: async (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    
    // On Web (non-native), we still use LocalStorage for the full backup as a safety net
    // but we wrap it in a try-catch to prevent QuotaExceededError from crashing the app.
    if (!storageService.isNative()) {
      try {
        localStorage.setItem('transport_manager_full_backup', jsonString);
      } catch (e) {
        console.warn('LocalStorage quota exceeded for full backup. Relying on individual keys.');
      }
    }

    // If on Mobile, save to real File System (No 5MB limit here)
    if (storageService.isNative()) {
      try {
        await storageService.requestPermissionsIfNeeded();

        // 1. Try to save to the root of Documents (survives uninstall on Android 11+)
        let savedToPublic = false;
        try {
          await Filesystem.writeFile({
            path: `Professional_Transport_Manager_Backup.json`,
            data: jsonString,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });
          savedToPublic = true;
          console.log('Data saved to root of Documents');
        } catch (e) {
          console.warn('Could not save to root of Documents', e);
        }

        // 2. Try legacy subdirectory approach
        let targetDirectory = Directory.Documents;
        try {
          await Filesystem.mkdir({
            path: STORAGE_DIRECTORY,
            directory: targetDirectory,
            recursive: true
          });
          await Filesystem.writeFile({
            path: `${STORAGE_DIRECTORY}/${STORAGE_FILE_NAME}`,
            data: jsonString,
            directory: targetDirectory,
            encoding: Encoding.UTF8,
          });
          savedToPublic = true;
        } catch (e) {
          // If Documents fails, try Data directory (app-specific, wiped on uninstall)
          try {
            targetDirectory = Directory.Data;
            await Filesystem.mkdir({
              path: STORAGE_DIRECTORY,
              directory: targetDirectory,
              recursive: true
            });
            await Filesystem.writeFile({
              path: `${STORAGE_DIRECTORY}/${STORAGE_FILE_NAME}`,
              data: jsonString,
              directory: targetDirectory,
              encoding: Encoding.UTF8,
            });
          } catch (err) {
            console.warn('Could not save to Data directory', err);
          }
        }
        
        console.log('Data saved to Mobile File System');
      } catch (error) {
        console.error('Error saving to Mobile File System:', error);
      }
    }
  },

  // Scan and Load data from storage
  loadData: async () => {
    // 1. Try to load from Mobile File System first
    if (storageService.isNative()) {
      try {
        await storageService.requestPermissionsIfNeeded();

        let contents;
        
        // 1. Try root of Documents first (survives uninstall)
        try {
          console.log('Attempting to read from root of Documents...');
          contents = await Filesystem.readFile({
            path: `Professional_Transport_Manager_Backup.json`,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });
          console.log('Successfully read from root of Documents');
        } catch (e) {
          console.warn('Failed to read from root of Documents. This is normal on Android 11+ reinstalls due to Scoped Storage. Error:', e);
          // 2. Try legacy subdirectory in Documents
          try {
            console.log('Attempting to read from legacy subdirectory...');
            contents = await Filesystem.readFile({
              path: `${STORAGE_DIRECTORY}/${STORAGE_FILE_NAME}`,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
            });
            console.log('Successfully read from legacy subdirectory');
          } catch (err) {
            console.warn('Failed to read from legacy subdirectory. Error:', err);
            // 3. Try Data directory
            try {
              console.log('Attempting to read from Data directory...');
              contents = await Filesystem.readFile({
                path: `${STORAGE_DIRECTORY}/${STORAGE_FILE_NAME}`,
                directory: Directory.Data,
                encoding: Encoding.UTF8,
              });
              console.log('Successfully read from Data directory');
            } catch (err2) {
              console.warn('Failed to read from Data directory. Error:', err2);
              // 4. Fallback to old directory name
              try {
                console.log('Attempting to read from old FleetPro directory...');
                contents = await Filesystem.readFile({
                  path: `FleetPro/fleetpro_data_backup.json`,
                  directory: Directory.Documents,
                  encoding: Encoding.UTF8,
                });
                console.log('Successfully read from old FleetPro directory');
              } catch (err3) {
                console.warn('Failed to read from old FleetPro directory. Error:', err3);
              }
            }
          }
        }
        
        // Capacitor 5+ returns a string in .data, but sometimes it needs to be cast
        const data = typeof contents.data === 'string' ? contents.data : JSON.stringify(contents.data);

        if (data) {
          console.log('Data loaded from Mobile File System');
          return JSON.parse(data);
        }
      } catch (error) {
        console.warn('No backup file found in Mobile File System or error reading it.');
      }
    }

    // 2. Fallback to LocalStorage
    const localData = localStorage.getItem('transport_manager_full_backup') || localStorage.getItem('fleetpro_full_backup');
    if (localData) {
      console.log('Data loaded from LocalStorage cache');
      return JSON.parse(localData);
    }

    return null;
  }
};
