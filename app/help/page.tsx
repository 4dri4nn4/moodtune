import Link from "next/link";

import MoodTuneLogo from "@/components/ui/MoodTuneLogo";

const helpTopics = [
  {
    title: "How do the two MoodTune journeys work?",
    content:
      "Choose “I feel…” when you want music that reflects your current emotion. Choose “I want to feel…” when you want music selected for the emotion you would like to move towards.",
  },
  {
    title: "How are tracks matched to an emotion?",
    content:
      "Each track contains emotion tags in the MoodTune catalogue. Your selected emotion is compared with those tags to create a relevant listening queue.",
  },
  {
    title: "How do I use the music player?",
    content:
      "Open any recommended track to play, pause, seek, change volume, mute, move between tracks, shuffle or choose a repeat mode. Minimize the player to continue browsing without stopping the music.",
  },
  {
    title: "What can I save in my Library?",
    content:
      "Signed-in listeners can save favourites, create personal playlists and revisit listening history. Favourites and playlist tracks can be removed at any time.",
  },
  {
    title: "Where are my playback preferences stored?",
    content:
      "Volume, mute, shuffle and repeat preferences are stored locally in your browser. You can review or reset them from Settings.",
  },
  {
    title: "What should I do if a track does not play?",
    content:
      "Check your internet connection and device volume, then try another track. Refresh MoodTune if the problem continues. A temporary network interruption may stop an audio file from loading.",
  },
];

export default function HelpPage() {
  return (
    <main className="auth-page help-page">
      <Link
        href="/"
        className="auth-brand browse-brand-link"
        aria-label="Go to MoodTune home"
      >
        <MoodTuneLogo size={62} />
        <div className="auth-brand-name">
          Mood<span>Tune</span>
        </div>
        <p>Every emotion has a soundtrack.</p>
      </Link>

      <section className="auth-card help-card">
        <div className="auth-heading">
          <p className="eyebrow auth-eyebrow">
            HELP & ABOUT
          </p>
          <h1>How can we help?</h1>
          <p className="auth-description">
            Learn how MoodTune turns emotion into a
            personal listening experience.
          </p>
        </div>

        <nav
          className="help-quick-links"
          aria-label="Help shortcuts"
        >
          <Link href="/browse?journey=feel">
            Choose an emotion
          </Link>
          <Link href="/library">
            Open Library
          </Link>
          <Link href="/settings">
            Playback settings
          </Link>
        </nav>

        <section
          className="help-guide"
          aria-labelledby="help-guide-title"
        >
          <div className="help-section-heading">
            <p className="settings-kicker">
              GETTING STARTED
            </p>
            <h2 id="help-guide-title">
              Your MoodTune journey
            </h2>
          </div>

          <ol className="help-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Choose your journey</strong>
                <p>
                  Start with how you feel now or how
                  you want to feel next.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Select an emotion</strong>
                <p>
                  MoodTune finds tracks whose tags
                  match your selection.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Listen your way</strong>
                <p>
                  Play immediately, save favourites
                  or build a personal playlist.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section
          className="help-faq"
          aria-labelledby="help-faq-title"
        >
          <div className="help-section-heading">
            <p className="settings-kicker">
              COMMON QUESTIONS
            </p>
            <h2 id="help-faq-title">
              MoodTune guidance
            </h2>
          </div>

          <div className="help-questions">
            {helpTopics.map((topic) => (
              <details key={topic.title}>
                <summary>{topic.title}</summary>
                <p>{topic.content}</p>
              </details>
            ))}
          </div>
        </section>

        <aside className="help-wellbeing-note">
          <span aria-hidden="true">♡</span>
          <div>
            <strong>Wellbeing information</strong>
            <p>
              MoodTune supports music discovery and
              personal listening. It does not diagnose,
              treat or replace professional mental
              health or medical support.
            </p>
          </div>
        </aside>

        <div className="help-footer-actions">
          <Link href="/" className="auth-home-link">
            ← Back to home
          </Link>
          <Link
            href="/browse?journey=feel"
            className="settings-account-link"
          >
            Start listening
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

