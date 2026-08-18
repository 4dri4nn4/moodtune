"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import type { Track } from "@/components/player/PlayerProvider";

type UseFavouriteResult = {
  isFavourite: boolean;
  updatingFavourite: boolean;
  favouriteError: string;
  toggleFavourite: () => Promise<void>;
};

export default function useFavourite(
  track: Track | null
): UseFavouriteResult {
  const router = useRouter();

  const trackId = track?.id ?? "";

  const [user, setUser] =
    useState<User | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  const [isFavourite, setIsFavourite] =
    useState(false);

  const [
    updatingFavourite,
    setUpdatingFavourite,
  ] = useState(false);

  const [
    favouriteError,
    setFavouriteError,
  ] = useState("");

  useEffect(() => {
    let unsubscribeFavourite:
      | Unsubscribe
      | null = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setAuthReady(true);
          setFavouriteError("");

          if (unsubscribeFavourite) {
            unsubscribeFavourite();
            unsubscribeFavourite = null;
          }

          if (!currentUser || !trackId) {
            setIsFavourite(false);
            return;
          }

          const favouriteReference = doc(
            db,
            "users",
            currentUser.uid,
            "favourites",
            trackId
          );

          unsubscribeFavourite = onSnapshot(
            favouriteReference,
            (snapshot) => {
              setIsFavourite(
                snapshot.exists()
              );
            },
            (error) => {
              console.error(
                "Favourite status error:",
                error
              );

              setFavouriteError(
                "We couldn't check whether this track is saved."
              );
            }
          );
        }
      );

    return () => {
      unsubscribeAuth();

      if (unsubscribeFavourite) {
        unsubscribeFavourite();
      }
    };
  }, [trackId]);

  async function toggleFavourite() {
    if (
      !authReady ||
      updatingFavourite ||
      !track
    ) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const favouriteReference = doc(
      db,
      "users",
      user.uid,
      "favourites",
      track.id
    );

    try {
      setUpdatingFavourite(true);
      setFavouriteError("");

      if (isFavourite) {
        await deleteDoc(
          favouriteReference
        );
      } else {
        await setDoc(
          favouriteReference,
          {
            title: track.title,
            artist: track.artist,
            genre: track.genre,
            audioURL: track.audioURL,
            coverURL: track.coverURL,
            duration: track.duration,
            emotionTags:
              track.emotionTags,
            savedAt:
              serverTimestamp(),
          }
        );
      }
    } catch (error) {
      console.error(
        "Favourite update error:",
        error
      );

      setFavouriteError(
        "We couldn't update your favourites."
      );
    } finally {
      setUpdatingFavourite(false);
    }
  }

  return {
    isFavourite,
    updatingFavourite,
    favouriteError,
    toggleFavourite,
  };
}