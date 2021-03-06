/**
 * @author Jakub Sadilek
 *
 * Faculty of Information Technology
 * Brno University of Technology
 * 2022
 */

import React, { createContext, memo, useCallback, useState } from "react";

export const DataContext = createContext();

/**
 * Data provider that is used across application to store data provided by the user,
 * which is sent to the server then.
 */
export const DataProvider = memo(({ children }) => {
  const [video, setVideo] = useState({
    data: undefined,
    url: undefined,
    width: undefined,
    height: undefined,
    duration: undefined,
    aspectRatio: undefined,
  });
  const [procConfig, setProcConfig] = useState({
    cars: false,
    model: "medium",
    recognition: false,
    tracking: false,
    tracks: false,
    trackLen: 1.5,
    counters: false,
    timestamp: false,
    frame: true,
  });
  const [processedVideo, setProcessedVideo] = useState(undefined);
  const [videoThumbnail, setVideoThumbnail] = useState(undefined);
  const [detectionArea, setDetectionArea] = useState([]);
  const [recognitionDatabase, setRecognitionDatabase] = useState([]);
  const [weights, setWeights] = useState(undefined);

  /**
   * Function setups area of interest in video frame, checks its boundaries
   * and saves it in format [x, y, w, h].
   *
   * @param {List} boxes List containing one rectangle.
   */
  const setupAreaOfInterest = useCallback(
    (boxes) => {
      if (boxes.length === 0) {
        setDetectionArea([]);
      } else {
        var sx = parseInt(Math.min(boxes[0].sx, boxes[0].ex)); // Starting point x
        var sy = parseInt(Math.min(boxes[0].sy, boxes[0].ey)); // Starting point y
        sx = sx < 0 ? 0 : sx;
        sy = sy < 0 ? 0 : sy;

        var ex = parseInt(Math.max(boxes[0].sx, boxes[0].ex)); // End point x
        var ey = parseInt(Math.max(boxes[0].sy, boxes[0].ey)); // End point y
        ex = ex > video.width ? video.width : ex;
        ey = ey > video.height ? video.height : ey;

        const width = ex - sx;
        const height = ey - sy;

        if (width < 50 || height < 50) {
          setDetectionArea([]);
        } else {
          setDetectionArea((prevState) => [
            {
              x: sx,
              y: sy,
              width: width,
              height: height,
              key: prevState.length + 1,
            },
          ]);
        }
      }
    },
    [video]
  );

  /**
   * Function reloads a random thumbnail from the video and saves it.
   *
   * @param {String} videoURL Link to the video.
   */
  const reloadVideoThumbnail = useCallback((videoURL) => {
    // Create a video element
    var tempVideo = document.createElement("video");
    tempVideo.src = videoURL;

    // After data is loaded, then set random video time
    tempVideo.addEventListener(
      "loadeddata",
      function () {
        reloadRandomFrame();
      },
      false
    );

    // After time in the video is shifted, get the frame and save it as a image
    tempVideo.addEventListener(
      "seeked",
      function () {
        var canvas = document.createElement("canvas");
        canvas.width = tempVideo.videoWidth;
        canvas.height = tempVideo.videoHeight;
        var context = canvas.getContext("2d");
        context.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        var base64DataImage = canvas.toDataURL("image/png");
        const image = new window.Image();
        image.src = base64DataImage;
        image.onload = () => {
          setVideoThumbnail(image);
        };
      },
      false
    );

    // Function sets random time in the video
    function reloadRandomFrame() {
      if (!isNaN(tempVideo.duration)) {
        var rand = Math.round(Math.random() * tempVideo.duration) + 1;
        tempVideo.currentTime = rand;
        console.log("Thumbnail: loaded at " + rand + " seconds.");
      }
    }
  }, []);

  /**
   * Function saves uploaded video from the user along with its metadata
   * and creates its first thumbnail at the same time.
   */
  const uploadVideo = useCallback(
    (accptedFile) => {
      if (accptedFile.length !== 0) {
        const videoURL = URL.createObjectURL(accptedFile[0]);

        var tempVideo = document.createElement("video");
        tempVideo.src = videoURL;

        tempVideo.addEventListener(
          "loadeddata",
          function () {
            reloadVideoThumbnail(videoURL);

            setVideo((prevState) => ({
              ...prevState,
              data: accptedFile[0],
              url: videoURL,
              width: tempVideo.videoWidth,
              height: tempVideo.videoHeight,
              duration: parseInt(tempVideo.duration),
              aspectRatio: tempVideo.videoWidth / tempVideo.videoHeight,
            }));
          },
          false
        );
      }
    },
    [reloadVideoThumbnail]
  );

  /**
   * Function removes uploaded video.
   */
  const removeVideo = useCallback(() => {
    setVideoThumbnail(undefined);
    setDetectionArea([]);
    setVideo({
      data: undefined,
      url: undefined,
      width: undefined,
      height: undefined,
      duration: undefined,
      aspectRatio: undefined,
    });
  }, []);

  return (
    <DataContext.Provider
      value={{
        video: video,
        uploadVideo: uploadVideo,
        removeVideo: removeVideo,
        videoThumbnail: videoThumbnail,
        reloadVideoThumbnail: reloadVideoThumbnail,
        procConfig: procConfig,
        setProcConfig: setProcConfig,
        areaOfInterest: detectionArea,
        setupAreaOfInterest: setupAreaOfInterest,
        processedVideo: processedVideo,
        setProcessedVideo: setProcessedVideo,
        recognitionDatabase: recognitionDatabase,
        setRecognitionDatabase: setRecognitionDatabase,
        weights: weights,
        setWeights: setWeights,
      }}
    >
      {children}
    </DataContext.Provider>
  );
});
