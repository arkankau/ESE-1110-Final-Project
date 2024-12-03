// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  convertDwg: (inputDwgPath) => ipcRenderer.invoke('convert-dwg', inputDwgPath),
  saveImage: (dataURL) => ipcRenderer.invoke('save-image', dataURL),
  getPhotos: () => ipcRenderer.invoke('get-photos'),
  onPhotosUpdated: (callback) => ipcRenderer.on('photos-updated', (event, photos) => callback(photos)),
  clearAllPhotos: () => ipcRenderer.invoke('clear-all-photos'),
  getImageData: (filename) => ipcRenderer.invoke('get-image-data', filename),
  isolatePaper: (filename) => ipcRenderer.invoke('isolate-paper', filename),
  scanImageForQRCode: (filename) => ipcRenderer.invoke('scan-image-for-qr-code', filename),
});