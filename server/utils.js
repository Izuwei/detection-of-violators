/**
 * @author Jakub Sadilek
 *
 * Faculty of Information Technology
 * Brno University of Technology
 * 2022
 */

const fs = require("fs");
const path = require("path");

/**
 * Function converts the configuration received
 * from the user to the program parameters.
 *
 * @param {Object} data Configuration from the user.
 * @returns {List} List with program parameters.
 */
const parseArgsCLI = (data) => {
  var args = [];

  // Model
  if (data.model === "high") {
    args.push("--model", "yolo608");
  } else {
    // Medium
    args.push("--model", "yolo320");
  }

  // Car detection
  if (data.cars === true) {
    args.push("--cars");
  }

  // Detection area
  if (data.area.length !== 0) {
    args.push(
      "--area",
      data.area[0].x,
      data.area[0].y,
      data.area[0].width,
      data.area[0].height
    );

    // Render area
    if (data.frame === true) {
      args.push("--frame");
    }
  }

  // Face recognition
  if (data.recognition === true) {
    args.push("--recognition");
  }

  // Tracking
  if (data.tracking === true) {
    args.push("--tracking");

    // Tracks
    if (data.tracks === true) {
      args.push("--paths");

      // Track lenght
      args.push("--traillen", data.trackLen);
    }

    // Counters
    if (data.counters === true) {
      args.push("--counter");
    }
  }

  // Time stamp
  if (data.timestamp === true) {
    args.push("--timestamp");
  }

  // Custom weights
  if (data.weights !== undefined) {
    args.push("--weights", data.weights);
  }

  return args;
};

/**
 * The function deletes files in the specified directory that are older than the specified interval since its creation.
 *
 * @param {string} dir Absolute path to directory where old files will be deleted.
 * @param {int} age Age of file to be deteled in miliseconds.
 */
const deleteFiles = (dir, age) => {
  fs.readdir(dir, (err, files) => {
    files.forEach((file, index) => {
      var filePath = path.join(dir, file);
      fs.stat(filePath, (err, stat) => {
        if (err) {
          console.log("Failed to remove file: " + filePath);
          return;
        }

        var currentTime = new Date().getTime();
        var endTime = new Date(stat.ctime).getTime() + age;

        if (currentTime > endTime) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log("Failed to remove file: " + filePath);
            } else {
              console.log("File deleted: " + filePath);
            }
          });
        }
      });
    });
  });
};

/**
 * Function deletes the specified directory if exists.
 *
 * @param {String} dir Path to the directory.
 */
const rmDirRecursive = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
};

module.exports = { parseArgsCLI, deleteFiles, rmDirRecursive };
