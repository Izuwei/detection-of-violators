# vim: expandtab:ts=4:sw=4

# Author: Nicolai Wojke
# Source: https://github.com/nwojke/deep_sort/tree/master/deep_sort
# License: GPLv3
# Modified by Jakub Sadilek


class TrackState:
    """
    Enumeration type for the single target track state. Newly created tracks are
    classified as `tentative` until enough evidence has been collected. Then,
    the track state is changed to `confirmed`. Tracks that are no longer alive
    are classified as `deleted` to mark them for removal from the set of active
    tracks.

    """

    Tentative = 1
    Confirmed = 2
    Deleted = 3


class Track:
    """
    A single target track with state space `(x, y, a, h)` and associated
    velocities, where `(x, y)` is the center of the bounding box, `a` is the
    aspect ratio and `h` is the height.

    Parameters
    ----------
    mean : ndarray
        Mean vector of the initial state distribution.
    covariance : ndarray
        Covariance matrix of the initial state distribution.
    track_id : int
        A unique track identifier.
    n_init : int
        Number of consecutive detections before the track is confirmed. The
        track state is set to `Deleted` if a miss occurs within the first
        `n_init` frames.
    max_age : int
        The maximum number of consecutive misses before the track state is
        set to `Deleted`.
    feature : Optional[ndarray]
        Feature vector of the detection this track originates from. If not None,
        this feature is added to the `features` cache.

    Attributes
    ----------
    mean : ndarray
        Mean vector of the initial state distribution.
    covariance : ndarray
        Covariance matrix of the initial state distribution.
    track_id : int
        A unique track identifier.
    hits : int
        Total number of measurement updates.
    age : int
        Total number of frames since first occurance.
    time_since_update : int
        Total number of frames since last measurement update.
    state : TrackState
        The current track state.
    features : List[ndarray]
        A cache of features. On each measurement update, the associated feature
        vector is added to this list.

    """

    def __init__(
        self,
        mean,
        covariance,
        track_id,
        n_init,
        max_age,
        bboxColor,
        cornerColor,
        textColor,
        feature=None,
        label=None,
        conf=None,
        identity=None,
        faceDistance=None,
        personId="",
        faceId="",
    ):
        self.mean = mean
        self.label = label
        self.confidence = conf
        self.identity = identity
        self.faceDistance = faceDistance
        self.personId = personId
        self.faceId = faceId
        self.trail = []
        self.bboxColor = bboxColor
        self.cornerColor = cornerColor
        self.textColor = textColor
        self.covariance = covariance
        self.track_id = track_id
        self.hits = 1
        self.age = 1
        self.time_since_update = 0
        self.faceDistanceUpdateThreshold = 0.25

        self.state = TrackState.Tentative
        self.features = []
        if feature is not None:
            self.features.append(feature)

        self._n_init = n_init
        self._max_age = max_age

    def to_tlwh(self):
        """Get current position in bounding box format `(top left x, top left y,
        width, height)`.

        Returns
        -------
        ndarray
            The bounding box.

        """
        ret = self.mean[:4].copy()
        ret[2] *= ret[3]
        ret[:2] -= ret[2:] / 2
        return ret

    def to_tlbr(self):
        """Get current position in bounding box format `(min x, miny, max x,
        max y)`.

        Returns
        -------
        ndarray
            The bounding box.

        """
        ret = self.to_tlwh()
        ret[2:] = ret[:2] + ret[2:]
        return ret

    def predict(self, kf):
        """Propagate the state distribution to the current time step using a
        Kalman filter prediction step.

        Parameters
        ----------
        kf : kalman_filter.KalmanFilter
            The Kalman filter.

        """
        self.mean, self.covariance = kf.predict(self.mean, self.covariance)
        self.age += 1
        self.time_since_update += 1

    def update(self, kf, detection):
        """Perform Kalman filter measurement update step and update the feature
        cache.

        Parameters
        ----------
        kf : kalman_filter.KalmanFilter
            The Kalman filter.
        detection : Detection
            The associated detection.

        """
        self.mean, self.covariance = kf.update(
            self.mean, self.covariance, detection.to_xyah()
        )
        self.features.append(detection.feature)

        self.hits += 1
        self.time_since_update = 0
        if self.state == TrackState.Tentative and self.hits >= self._n_init:
            self.state = TrackState.Confirmed

        self.label = detection.label
        self.confidence = detection.get_confidence()

        # Better face matching => update name (identity)
        if self.label == "person":
            newFaceDistance = detection.get_faceDistance()

            if (
                self.faceDistance > newFaceDistance
                and newFaceDistance < self.faceDistanceUpdateThreshold
            ):
                self.identity = detection.get_identity()
                self.faceDistance = newFaceDistance
                self.personId = detection.get_personId()
                self.faceId = detection.get_faceId()

        self.trail.append(detection.center)

    def mark_missed(self):
        """Mark this track as missed (no association at the current time step)."""
        if self.state == TrackState.Tentative:
            self.state = TrackState.Deleted
            self.trail = []
        elif self.time_since_update > self._max_age:
            self.state = TrackState.Deleted
            self.trail = []

    def is_tentative(self):
        """Returns True if this track is tentative (unconfirmed)."""
        return self.state == TrackState.Tentative

    def is_confirmed(self):
        """Returns True if this track is confirmed."""
        return self.state == TrackState.Confirmed

    def is_deleted(self):
        """Returns True if this track is dead and should be deleted."""
        return self.state == TrackState.Deleted

    def get_label(self):
        """Returns label of the detected object."""
        return self.label

    def get_confidence(self):
        """Returns confidence score of the detected object."""
        return self.confidence

    def get_identity(self):
        """Returns identity of the detected person."""
        return self.identity

    def get_faceDistance(self):
        """Returns faceDistance of the detected person, measuring the similarity of the face."""
        return self.faceDistance

    def get_personId(self):
        """Returns ID of the detected person."""
        return self.personId

    def get_faceId(self):
        """Returns face image ID of the detected person."""
        return self.faceId
