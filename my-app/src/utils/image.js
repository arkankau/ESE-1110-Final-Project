// src/utils/image.js
const sharp = require('sharp');
const path = require('path');

async function resizeImage(imagePath, width, height) {
  try {
    const resizedImageBuffer = await sharp(imagePath)
      .resize(width, height, { fit: 'inside' })
      .toBuffer();
    return resizedImageBuffer;
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
}

// src/utils/image.js
async function cropImage(imagePath, coordinates) {
  // coordinates should be [x1,y1,x2,y2,x3,y3,x4,y4]
  const [x1, y1, x2, y2, x3, y3, x4, y4] = coordinates;

  // Calculate bounding box
  const minX = Math.min(x1, x2, x3, x4);
  const minY = Math.min(y1, y2, y3, y4);
  const maxX = Math.max(x1, x2, x3, x4);
  const maxY = Math.max(y1, y2, y3, y4);
  const width = maxX - minX;
  const height = maxY - minY;

  try {
    const outputPath = path.join(
      path.dirname(imagePath),
      'cropped-' + path.basename(imagePath)
    );
    await sharp(imagePath)
      .extract({ 
        left: Math.round(minX), 
        top: Math.round(minY), 
        width: Math.round(width), 
        height: Math.round(height) 
      })
      .toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error cropping image:', error);
    throw error;
  }
}

async function calculatePixelToCmRatio(imagePath, height) {
  try {
    const metadata = await sharp(imagePath).metadata();
    // Assuming A4 paper height (297mm = 29.7cm)
    const pixelToCmRatio = 29.7 / metadata.height;
    return pixelToCmRatio;
  } catch (error) {
    console.error('Error calculating ratio:', error);
    throw error;
  }
}

async function imageToBase64(imagePath) {
  try {
    const imageBuffer = await sharp(imagePath).toBuffer();
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

module.exports = {
  resizeImage,
  cropImage,
  calculatePixelToCmRatio,
  imageToBase64
};