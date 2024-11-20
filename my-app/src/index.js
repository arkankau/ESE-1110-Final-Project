// src/index.js
const { app } = require('electron');
const { createWindow } = require('./main/window');
const { setupHandlers } = require('./main/handlers');

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