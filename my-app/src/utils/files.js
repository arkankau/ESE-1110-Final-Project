// src/utils/files.js
const { app } = require('electron');
const fs = require('fs').promises;
const path = require('path');

async function getPhotosList() {
  const userDataPath = app.getPath('userData');
  const files = await fs.readdir(userDataPath);
  return files.filter((file) => file.endsWith('.png'));
}

async function saveBase64Image(dataURL) {
  const userDataPath = app.getPath('userData');
  const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
  const fileName = `photo-${Date.now()}.png`;
  const filePath = path.join(userDataPath, fileName);

  try {
    await fs.writeFile(filePath, base64Data, 'base64');
    console.log(`Image saved at: ${filePath}`); // Debug log
    return filePath;
  } catch (error) {
    console.error(`Failed to save image at ${filePath}:`, error.message);
    throw error;
  }
}



async function clearAllPhotos() {
  const userDataPath = app.getPath('userData');
  const files = await fs.readdir(userDataPath);
  const deletePromises = files
    .filter(file => file.endsWith('.png'))
    .map(file => fs.unlink(path.join(userDataPath, file)));
  await Promise.all(deletePromises);
  return true;
}

async function getImageData(filename) {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, filename);
    const imageBuffer = await fs.readFile(filePath);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error reading image:', error);
    return null;
  }
}

module.exports = { 
  getPhotosList, 
  saveBase64Image, 
  clearAllPhotos,
  getImageData 
};