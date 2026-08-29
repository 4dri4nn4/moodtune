"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export type Track = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  audioURL: string;
  coverURL: string;
  duration: number;
  emotionTags: string[];
};

type JourneyContext = {
  journey: string;
  emotion: string;
};

export type RepeatMode = "off" | "all" | "one";

type PlayerContextValue = {
  queue: Track[];
  currentTrack: Track | null;
  currentIndex: number;
  journey: string;
  emotion: string;
  isPlaying: boolean;
  isMinimized: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  error: string;

  loadQueue: (
    tracks: Track[],
    selectedTrackId: string,
    context?: JourneyContext
  ) => void;

  togglePlay: () => Promise<void>;
  playNext: () => void;
  playPrevious: () => void;
  seek: (newTime: number) => void;
  setVolume: (newVolume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  minimizePlayer: () => void;
  expandPlayer: () => void;
};

const PlayerContext =
  createContext<PlayerContextValue | null>(
    null
  );

function getSavedVolume() {
  if (typeof window === "undefined") {
    return 0.8;
  }

  const savedVolume =
    window.localStorage.getItem(
      "moodtune-volume"
    );

  const parsedVolume = Number(savedVolume);

  if (
    savedVolume === null ||
    !Number.isFinite(parsedVolume)
  ) {
    return 0.8;
  }

  return Math.min(
    1,
    Math.max(0, parsedVolume)
  );
}

function getSavedMutedState() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(
      "moodtune-muted"
    ) === "true"
  );
}

function getSavedShuffleState() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(
      "moodtune-shuffle"
    ) === "true"
  );
}

function getSavedRepeatMode(): RepeatMode {
  if (typeof window === "undefined") {
    return "off";
  }

  const savedMode =
    window.localStorage.getItem(
      "moodtune-repeat-mode"
    );

  return savedMode === "all" ||
    savedMode === "one"
    ? savedMode
    : "off";
}

function createShuffledQueue(
  tracks: Track[],
  selectedTrackId: string
) {
  const selectedTrack = tracks.find(
    (track) => track.id === selectedTrackId
  );

  if (!selectedTrack) {
    return tracks;
  }

  const remainingTracks = tracks.filter(
    (track) => track.id !== selectedTrackId
  );

  for (
    let index = remainingTracks.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [
      remainingTracks[index],
      remainingTracks[randomIndex],
    ] = [
      remainingTracks[randomIndex],
      remainingTracks[index],
    ];
  }

  return [selectedTrack, ...remainingTracks];
}

export default function PlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const lastRecordedTrackId =
    useRef("");

  const lastAudibleVolume =
    useRef(0.8);

  const originalQueueRef =
    useRef<Track[]>([]);

  const [queue, setQueue] =
    useState<Track[]>([]);

  const [currentTrack, setCurrentTrack] =
    useState<Track | null>(null);

  const [journey, setJourney] =
    useState("");

  const [emotion, setEmotion] =
    useState("");

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [isMinimized, setIsMinimized] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [volume, setVolumeState] =
    useState(getSavedVolume);

  const [isMuted, setIsMuted] =
    useState(getSavedMutedState);

  const [isShuffle, setIsShuffle] =
    useState(getSavedShuffleState);

  const [repeatMode, setRepeatMode] =
    useState<RepeatMode>(getSavedRepeatMode);

  const [error, setError] =
    useState("");

  const currentIndex = useMemo(() => {
    if (!currentTrack) {
      return -1;
    }

    return queue.findIndex(
      (track) =>
        track.id === currentTrack.id
    );
  }, [currentTrack, queue]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume;
    audio.muted = isMuted;

    window.localStorage.setItem(
      "moodtune-volume",
      volume.toString()
    );

    window.localStorage.setItem(
      "moodtune-muted",
      isMuted.toString()
    );
  }, [isMuted, volume]);

  useEffect(() => {
    window.localStorage.setItem(
      "moodtune-shuffle",
      isShuffle.toString()
    );

    window.localStorage.setItem(
      "moodtune-repeat-mode",
      repeatMode
    );
  }, [isShuffle, repeatMode]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    audio
  .play()
  .catch((playbackError: unknown) => {
    if (
      playbackError instanceof DOMException &&
      playbackError.name === "AbortError"
    ) {
      return;
    }

    console.error(
      "Audio playback error:",
      playbackError
    );

    setError(
      "We couldn't play this audio file."
    );

    setIsPlaying(false);
  });
  }, [currentTrack, isPlaying]);

  const loadQueue = useCallback(
    (
      tracks: Track[],
      selectedTrackId: string,
      context?: JourneyContext
    ) => {
      const selectedTrack = tracks.find(
        (track) =>
          track.id === selectedTrackId
      );

      if (!selectedTrack) {
        setError(
          "The selected track is not available in this playlist."
        );

        return;
      }

      originalQueueRef.current = tracks;

      setQueue(
        isShuffle
          ? createShuffledQueue(
              tracks,
              selectedTrackId
            )
          : tracks
      );
      setJourney(
        context?.journey ?? ""
      );
      setEmotion(
        context?.emotion ?? ""
      );
      setError("");
      setIsPlaying(false);
      setIsMinimized(false);
      setCurrentTime(0);
      setDuration(
        selectedTrack.duration || 0
      );
      setCurrentTrack(selectedTrack);
    },
    [isShuffle]
  );

  const togglePlay =
    useCallback(async () => {
      const audio = audioRef.current;

      if (!audio || !currentTrack) {
        return;
      }

      try {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }

        setError("");
      } catch (playbackError) {
        console.error(
          "Audio playback error:",
          playbackError
        );

        setError(
          "We couldn't play this audio file."
        );
      }
    }, [currentTrack]);

  const selectTrack = useCallback(
    (track: Track) => {
      setCurrentTime(0);
      setDuration(
        track.duration || 0
      );
      setError("");
      setCurrentTrack(track);
      setIsPlaying(true);
    },
    []
  );

  const playNext = useCallback(() => {
    if (
      queue.length < 2 ||
      currentIndex < 0
    ) {
      return;
    }

    const nextIndex =
      (currentIndex + 1) %
      queue.length;

    const nextTrack =
      queue[nextIndex];

    if (!nextTrack) {
      return;
    }

    selectTrack(nextTrack);
  }, [
    currentIndex,
    queue,
    selectTrack,
  ]);

  const playPrevious =
    useCallback(() => {
      if (
        queue.length < 2 ||
        currentIndex < 0
      ) {
        return;
      }

      const previousIndex =
        (
          currentIndex -
          1 +
          queue.length
        ) % queue.length;

      const previousTrack =
        queue[previousIndex];

      if (!previousTrack) {
        return;
      }

      selectTrack(previousTrack);
    }, [
      currentIndex,
      queue,
      selectTrack,
    ]);

  const seek = useCallback(
    (newTime: number) => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      const safeTime = Math.max(
        0,
        Math.min(
          newTime,
          audio.duration || newTime
        )
      );

      audio.currentTime = safeTime;
      setCurrentTime(safeTime);
    },
    []
  );

  const setVolume = useCallback(
    (newVolume: number) => {
      const safeVolume = Math.min(
        1,
        Math.max(0, newVolume)
      );

      setVolumeState(safeVolume);

      if (safeVolume > 0) {
        lastAudibleVolume.current =
          safeVolume;

        setIsMuted(false);
      } else {
        setIsMuted(true);
      }
    },
    []
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      if (volume === 0) {
        const restoredVolume =
          lastAudibleVolume.current > 0
            ? lastAudibleVolume.current
            : 0.8;

        setVolumeState(restoredVolume);
      }

      setIsMuted(false);
      return;
    }

    if (volume > 0) {
      lastAudibleVolume.current = volume;
    }

    setIsMuted(true);
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => {
    const nextShuffleState = !isShuffle;

    if (currentTrack) {
      setQueue(
        nextShuffleState
          ? createShuffledQueue(
              originalQueueRef.current,
              currentTrack.id
            )
          : originalQueueRef.current
      );
    }

    setIsShuffle(nextShuffleState);
  }, [currentTrack, isShuffle]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((current) => {
      if (current === "off") {
        return "all";
      }

      if (current === "all") {
        return "one";
      }

      return "off";
    });
  }, []);

  const handleEnded = useCallback(() => {
    const audio = audioRef.current;

    if (
      (repeatMode === "one" ||
        (repeatMode === "all" &&
          queue.length === 1)) &&
      audio
    ) {
      audio.currentTime = 0;
      setCurrentTime(0);

      audio.play().catch((playbackError) => {
        console.error(
          "Audio playback error:",
          playbackError
        );

        setError(
          "We couldn't replay this audio file."
        );
        setIsPlaying(false);
      });

      return;
    }

    const isLastTrack =
      currentIndex === queue.length - 1;

    if (
      queue.length > 1 &&
      (isShuffle ||
        repeatMode === "all" ||
        !isLastTrack)
    ) {
      playNext();
      return;
    }

    setIsPlaying(false);
    setCurrentTime(duration);
  }, [
    currentIndex,
    duration,
    isShuffle,
    playNext,
    queue.length,
    repeatMode,
  ]);

  const minimizePlayer = useCallback(
    () => {
      setIsMinimized(true);
    },
    []
  );

  const expandPlayer = useCallback(
    () => {
      setIsMinimized(false);
    },
    []
  );

  const recordListeningHistory =
    useCallback(async () => {
      const user = auth.currentUser;

      if (
        !user ||
        !currentTrack ||
        lastRecordedTrackId.current ===
          currentTrack.id
      ) {
        return;
      }

      lastRecordedTrackId.current =
        currentTrack.id;

      try {
        await setDoc(
          doc(
            db,
            "users",
            user.uid,
            "listeningHistory",
            currentTrack.id
          ),
          {
            title: currentTrack.title,
            artist: currentTrack.artist,
            genre: currentTrack.genre,
            audioURL:
              currentTrack.audioURL,
            coverURL:
              currentTrack.coverURL,
            duration:
              currentTrack.duration,
            emotionTags:
              currentTrack.emotionTags,
            journey,
            emotion,
            lastPlayedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      } catch (historyError) {
        console.error(
          "Listening history error:",
          historyError
        );

        lastRecordedTrackId.current = "";
      }
    }, [
      currentTrack,
      emotion,
      journey,
    ]);

  const value =
    useMemo<PlayerContextValue>(
      () => ({
        queue,
        currentTrack,
        currentIndex,
        journey,
        emotion,
        isPlaying,
        isMinimized,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        error,
        loadQueue,
        togglePlay,
        playNext,
        playPrevious,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeatMode,
        minimizePlayer,
        expandPlayer,
      }),
      [
        queue,
        currentTrack,
        currentIndex,
        journey,
        emotion,
        isPlaying,
        isMinimized,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        error,
        loadQueue,
        togglePlay,
        playNext,
        playPrevious,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeatMode,
        minimizePlayer,
        expandPlayer,
      ]
    );

  const audioSourceProperties:
    { src?: string } = currentTrack
      ? {
          src: currentTrack.audioURL,
        }
      : {};

  return (
    <PlayerContext.Provider value={value}>
      {children}

      <audio
        ref={(element) => {
          audioRef.current = element;

          if (element) {
            element.volume = volume;
            element.muted = isMuted;
          }
        }}
        {...audioSourceProperties}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(
            event.currentTarget.duration
          );

          event.currentTarget.volume =
            volume;

          event.currentTarget.muted =
            isMuted;
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(
            event.currentTarget.currentTime
          );
        }}
        onPlay={() => {
          setIsPlaying(true);

          void recordListeningHistory();
        }}
        onPause={() => {
          setIsPlaying(false);
        }}
        onEnded={handleEnded}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context =
    useContext(PlayerContext);

  if (!context) {
    throw new Error(
      "usePlayer must be used inside PlayerProvider."
    );
  }

  return context;
}
