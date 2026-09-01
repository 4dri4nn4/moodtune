# MoodTune

**Every emotion has a soundtrack.**

MoodTune is an emotion-aware music streaming web application. It helps listeners discover and play music based on either their current emotion or the emotion they would like to move towards.

Unlike a redirect-based recommendation service, MoodTune includes its own catalogue and built-in audio player, allowing the complete listening journey to remain inside the application.

## Core journeys

- **I feel…** — discover music that reflects a current emotion.
- **I want to feel…** — discover music intended to support movement towards a desired emotion.

Tracks are matched using emotion tags stored in the MoodTune catalogue.

## Live Application

MoodTune is deployed on Vercel and is available at:

https://moodtune-liart.vercel.app

## Implemented features

- Emotion selection across six categories: happy, calm, sad, energetic, anxious and reflective
- Emotion-matched track recommendations
- Built-in full music player and persistent mini-player
- Play, pause, seek, previous and next controls
- Synchronized volume and mute controls
- Shuffle, repeat queue and repeat current track modes
- Persistent browser playback preferences
- Firebase email/password registration and authentication
- Password reset and configurable login persistence
- Editable user profile
- Favourites
- Personal playlist creation, renaming and deletion
- Listening history
- Functional playback Settings page
- Help, FAQs and wellbeing guidance
- Responsive desktop and mobile layouts
- Accessible labels, focus states and status/error feedback

## Technology stack

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19
- TypeScript
- Firebase Authentication
- Cloud Firestore
- HTML5 Audio
- CSS with responsive media queries

## Application structure

```text
app/
  browse/       Emotion and journey selection
  help/         Help, FAQs and guidance
  library/      Favourites, history and playlists
  login/        Authentication and password reset
  player/       Full player route
  profile/      User account profile
  register/     Account creation
  results/      Emotion-matched recommendations
  settings/     Playback preferences

components/
  emotion/      Emotion selection interface
  favourites/   Favourite state management
  navigation/   Shared navigation controls
  player/       Player provider, full view and mini-player
  playlists/    Playlist controls
  results/      Recommendation results
  ui/           Shared visual components

lib/
  firebase.ts   Firebase initialization

public/
  audio/        Demonstration audio catalogue
  images/       Track cover artwork
```

## Firebase data

MoodTune uses Firebase Authentication for user accounts and Cloud Firestore for application data. The implemented structure includes:

```text
tracks
users/{userId}
users/{userId}/favourites
users/{userId}/listeningHistory
users/{userId}/playlists
users/{userId}/playlists/{playlistId}/tracks
```

Firestore security rules should allow catalogue reads while restricting personal user data to the authenticated account owner.

## Run locally

### Requirements

- Node.js 20 or later
- npm
- A configured Firebase project with Email/Password authentication and Cloud Firestore enabled

### Installation

```bash
npm install
```

Create the local Firebase configuration before starting the application:

```bash
cp .env.example .env.local
```

Replace the placeholder values in `.env.local` with the Firebase web application configuration, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Quality checks

Run ESLint:

```bash
npm run lint
```

Create an optimized production build:

```bash
npm run build
```

The application has been tested across its main journeys, authentication flows, Library functions and synchronized player controls.

## Firestore security

The repository includes `firestore.rules`. The rules permit authenticated listeners to read the demonstration track catalogue while restricting each user's profile, favourites, history and playlists to that account owner.

These rules mirror the verified rules currently deployed to the MoodTune Firebase project.

## Demonstration assets

Audio and cover artwork used by the demonstration catalogue are listed in [`docs/ASSET_CREDITS.md`](docs/ASSET_CREDITS.md). Asset provenance and licence evidence must be completed before final dissertation submission or public release.

## Project scope

MoodTune is a university dissertation project focused on emotion-aware music discovery, streaming interaction and user experience evaluation.

It is not a diagnostic, therapeutic or medical application and does not replace professional mental-health or medical support.
