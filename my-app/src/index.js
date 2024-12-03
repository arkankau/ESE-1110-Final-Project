const { app, BrowserWindow, ipcMain } = require('electron');
const { createWindow } = require('./main/window');
const { setupHandlers } = require('./main/handlers');
const { execFile } = require('child_process');
const path = require('path');

app.whenReady().then(() => {
  createWindow();
  setupHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('convert-dwg', async (event, inputDwgPath) => {
  const outputPngPath = path.join(__dirname, 'converted_image.png');
  const scriptPath = path.join(__dirname, 'convert_dwg.py');

  return new Promise((resolve, reject) => {
    execFile('python3', [scriptPath, inputDwgPath, outputPngPath], (error, stdout, stderr) => {
      if (error) {
        console.error('Error converting DWG file:', error);
        reject(error);
      } else {
        console.log('DWG file converted successfully:', outputPngPath);
        resolve(outputPngPath);
      }
    });
  });
});