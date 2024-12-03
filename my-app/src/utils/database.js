// src/utils/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs'); // Add this line

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
      console.error('Error opening database:', err.message);
  } else {
      console.log('Connected to the SQLite database.');
  }
});

// Initialize the database schema
db.serialize(() => {
  // Create the `images` table if it doesn't exist
  // Create a new `images` table
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,      -- Name of the file (e.g., .png, .jpg, etc.)
      image BLOB,                  -- Binary data of the image (e.g., PNG/JPG content)
      text_file_blob BLOB          -- Binary data of the associated text file
    )
  `, (err) => {
    if (err) {
      console.error("Error creating images table:", err.message);
    } else {
      console.log("Images table created successfully.");
    }
  });
});



// Define the checkFileExists function
async function checkFileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}



// Save image with its QR code and text file
async function saveImageWithQRCode(filename, imageBuffer, textFileBuffer) {
  try {
    // Save binary data in the database
    const query = `
      INSERT INTO images (filename, image, text_file_blob)
      VALUES (?, ?, ?)
    `;
    const params = [filename, imageBuffer, textFileBuffer];
    const id = await new Promise((resolve, reject) => {
      db.run(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });

    console.log(`Saved image and QR code to database: ${id}`);
    return id;
  } catch (error) {
    console.error('Error saving image and QR code:', error);
    throw error;
  }
}




// Get image by QR code
function getImageByQRCode(qrCode) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM images WHERE id = ?', [qrCode], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}


// Get next QR code
async function getNextValidQRCode() {
  try {
    const latestImage = await getLatestImageFromDatabase(); // Fetch the latest record
    const latestQRCode = parseInt(latestImage?.id || '0', 10); // Extract QR code, default to 0 if none exist
    return (latestQRCode + 1).toString(); // Increment and return the next valid QR code
  } catch (error) {
    console.error("Error in getNextValidQRCode:", error.message);
    throw error;
  }
}
function getPaperFileByQRCode(qrCode) {
  return new Promise((resolve, reject) => {
      const query = `SELECT paper_file FROM images WHERE qr_code = ?`;
      db.get(query, [qrCode], (err, row) => {
          if (err) {
              reject(err);
          } else {
              resolve(row ? row.paper_file : null);
          }
      });
  });
}

// Get the latest image from the database
function getLatestImageFromDatabase() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM images ORDER BY id DESC LIMIT 1`,
      (err, row) => {
        if (err) {
          console.error("Error fetching latest image:", err.message);
          return reject(err);
        }
        resolve(row); // Returns the latest row or null if no rows exist
      }
    );
  });
}

module.exports = {
  saveImageWithQRCode,
  getImageByQRCode,
  getNextValidQRCode,
  getLatestImageFromDatabase,
  getPaperFileByQRCode,
  db,
};