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
  minimizePlayer: () => void;
  expandPlayer: () => void;
};

const PlayerContext =
  createContext<PlayerContextValue | null>(null);

export default function PlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const lastRecordedTrackId =
    useRef("");

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

    if (!audio || !currentTrack) {
      return;
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    audio
      .play()
      .catch((playbackError) => {
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

      setQueue(tracks);
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
    []
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

  const playPrevious = useCallback(() => {
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

      audio.currentTime = newTime;
      setCurrentTime(newTime);
    },
    []
  );

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
        error,
        loadQueue,
        togglePlay,
        playNext,
        playPrevious,
        seek,
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
        error,
        loadQueue,
        togglePlay,
        playNext,
        playPrevious,
        seek,
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
        }}
        {...audioSourceProperties}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(
            event.currentTarget.duration
          );
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
        onEnded={playNext}
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