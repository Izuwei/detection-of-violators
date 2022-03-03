class Detection:
    def __init__(
        self,
        label,
        conf,
        bbox,
        identity="Unknown",
        faceDistance=1,
        trackId=None,
        trailPts=[],
        bboxColor=(30, 128, 255),  # BGR
        cornerColor=(27, 26, 222),  # BGR
        textColor=(0, 255, 0),  # BGR
    ):
        self.label = label
        self.conf = conf
        self.bbox = bbox
        self.identity = identity
        self.faceDistance = faceDistance
        self.trackId = trackId
        self.trail = trailPts
        self.bboxColor = bboxColor
        self.cornerColor = cornerColor
        self.textColor = textColor

    def setIdentity(self, name, faceDistance):
        self.identity = name
        self.faceDistance = faceDistance