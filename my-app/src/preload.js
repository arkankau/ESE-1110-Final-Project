// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts


// preload.js
window.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('webcam');
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
      })
      .catch(err => {
        console.error('Error accessing webcam: ', err);
      });
  });