// src/main/handlers.js
const { app, ipcMain } = require('electron');
const path = require('path');
const { 
  getPhotosList, 
  saveBase64Image, 
  clearAllPhotos, 
  getImageData 
} = require('../utils/files');
const { cropImage } = require('../utils/image');
const { processImage } = require('./detection');

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

  // Isolate paper from image
  //Returns false if no paper is detected or if the paper is not a rectangle
  //Returns true, number of corners and the filename of the cropped image if successful
// src/main/handlers.js
ipcMain.handle('isolate-paper', async (event, filename) => {
  try {
    const userDataPath = app.getPath('userData');
    const imagePath = path.join(userDataPath, filename);

    const prediction = await processImage(imagePath);

    if (!prediction || !prediction.corners) {
      return {
        success: false,
        corners: 0,
        croppedFilename: null
      };
    }

    const { corners } = prediction;

    if (corners.length !== 4) {
      return {
        success: false,
        corners: corners.length,
        croppedFilename: null
      };
    }

    // Flatten corners array into [x1,y1,x2,y2,x3,y3,x4,y4] format
    const flattenedCorners = corners.reduce((acc, corner) => [...acc, ...corner], []);

    // Proceed to crop the image
    const croppedImagePath = await cropImage(imagePath, flattenedCorners);

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
}

module.exports = { setupHandlers };