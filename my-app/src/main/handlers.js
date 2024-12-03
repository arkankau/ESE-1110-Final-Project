// src/main/handlers.js
const { app, ipcMain } = require('electron');
const path = require('path');
const { 
  getPhotosList, 
  saveBase64Image, 
  clearAllPhotos, 
  getImageData 
} = require('../utils/files');
const { cropImage, scanImageForQRCode } = require('../utils/image');
const { processImage } = require('./detection');
const { getNextValidQRCode, saveImageWithQRCode, getPaperFileByQRCode } = require('../utils/database');

function setupHandlers() {

  // Get list of photos
  ipcMain.handle('get-photos', async () => {
    try {
      return await getPhotosList();
    } catch (error) {
      console.error('Error getting photos:', error);
      return [];
    }
  });

  // Save captured image
  ipcMain.handle('save-image', async (event, dataURL) => {
    try {
      const filePath = await saveBase64Image(dataURL);
      const photos = await getPhotosList();
      event.sender.send('photos-updated', photos);
      return { success: true, filePath };
    } catch (error) {
      console.error('Error saving image:', error);
      return { success: false, error: error.message };
    }
  });

  // Clear all photos
  ipcMain.handle('clear-all-photos', async () => {
    try {
      return await clearAllPhotos();
    } catch (error) {
      console.error('Error clearing photos:', error);
      return false;
    }
  });

  // Get image data
  ipcMain.handle('get-image-data', async (event, filename) => {
    try {
      return await getImageData(filename);
    } catch (error) {
      console.error('Error getting image data:', error);
      return null;
    }
  });

  // Isolate paper
  ipcMain.handle('isolate-paper', async (event, imagePath, qrCode) => {
    try {
      // Fetch the paper TXT file from the database using the QR code
      const paperFile = await getPaperFileByQRCode(qrCode);

      if (!paperFile) {
        throw new Error('Paper file not found in the database');
      }

      // Convert the paper file content to a matrix
      const bigMatrix = paperFile.split('\n').map(line => line.trim().split(''));

      // Proceed to crop the image
      const prediction = await processImage(imagePath);

      if (!prediction || !prediction.corners) {
        return {
          success: false,
          corners: 0,
          croppedFilename: null
        };
      }

      const { corners, isolatedImagePath } = prediction;

      if (corners.length !== 4) {
        return {
          success: false,
          corners: corners.length,
          croppedFilename: null
        };
      }

      // Flatten the corners array
      const flattenedCorners = corners.flat();

      // Proceed to crop the image
      const { outputPath: croppedImagePath } = await cropImage(imagePath, flattenedCorners);

      // Debugging log to check the croppedImagePath
      console.log('Cropped Image Path:', croppedImagePath);

      if (!croppedImagePath) {
        throw new Error('Cropped image path is undefined');
      }

      return {
        success: true,
        corners: 4,
        croppedFilename: path.basename(croppedImagePath),
        className: prediction.class,
        confidence: prediction.confidence
      };

    } catch (error) {
      console.error('Error in isolate-paper:', error);
      return {
        success: false,
        corners: 0,
        croppedFilename: null,
        error: error.message
      };
    }
  });

  // Scan image for QR code
  ipcMain.handle('scan-image-for-qr-code', async (event, filename) => {
    try {
      const userDataPath = app.getPath('userData');
      const imagePath = path.join(userDataPath, filename);
      const isolatedImagePath = path.join(userDataPath, 'isolated-' + filename);
      const result = await scanImageForQRCode(imagePath, isolatedImagePath);

      if (result.new) {
        return { qrCode: result.qrCode, new: true };
      }

      return result;
    } catch (error) {
      console.error('Error scanning image for QR code:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupHandlers };