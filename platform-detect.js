const fs = require('fs');
const path = require('path');
const os = require('os');

// Define paths to the platform-specific binaries folder
const binaryDirs = {
  win32: path.join(__dirname, 'src-tauri', 'binaries', 'win'),
  linux: path.join(__dirname, 'src-tauri', 'binaries', 'linux'),
  darwin: path.join(__dirname, 'src-tauri', 'binaries', 'mac'),
};

// Get the current platform
const platform = os.platform();
const binaryDir = binaryDirs[platform];

if (!binaryDir) {
  throw new Error(`No binaries available for platform: ${platform}`);
}

// Define the destination directory where binaries will be copied
const destDir = path.join(__dirname, 'src-tauri', 'bin');

// Helper function to clean a directory
function cleanDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        cleanDirectory(filePath); // Recursively clean subdirectories
        fs.rmdirSync(filePath); // Remove the directory
      } else {
        fs.unlinkSync(filePath); // Remove the file
      }
    });
  }
}

// Helper function to copy a directory
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  fs.readdirSync(src).forEach((file) => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);

    if (fs.lstatSync(srcFile).isDirectory()) {
      copyDirectory(srcFile, destFile); // Recursively copy subdirectories
    } else {
      fs.copyFileSync(srcFile, destFile); // Copy files
    }
  });
}

// Step 1: Clean the destination directory
cleanDirectory(destDir);
console.log(`Cleaned ${destDir}`);

// Step 2: Copy platform-specific binaries to the destination directory
copyDirectory(binaryDir, destDir);
(`Copied binaries from ${binaryDir} to ${destDir}`);
