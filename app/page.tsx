import Link from "next/link";

export default function Home() {
  return (
    <main className="home-page">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="MoodTune home">
          MoodTune
        </Link>

        <nav className="topbar-actions" aria-label="Main navigation">
          <Link href="/browse" className="nav-link">
            Browse
          </Link>

          <Link href="/library" className="nav-link">
            Library
          </Link>

          <Link href="/login" className="nav-link">
            Sign in
          </Link>

          <Link href="/register" className="button button-small">
            Create account
          </Link>
        </nav>
      </header>

      <section className="hero">
        <p className="eyebrow">Emotion-aware music streaming</p>

        <h1>Every emotion has a soundtrack.</h1>

        <p className="hero-description">
          Discover and play music based on how you feel now, or how you want
          to feel next.
        </p>

        <div className="journey-grid">
          <Link
            href="/browse"
            className="journey-card"
          >
            <span className="journey-label">
              Current mood
            </span>

            <strong>I feel...</strong>

            <span>
              Choose music that reflects your emotions.
            </span>
          </Link>

          <Link
            href="/browse"
            className="journey-card"
          >
            <span className="journey-label">
              Desired mood
            </span>

            <strong>I want to feel...</strong>

            <span>
              Choose music that helps guide your mood.
            </span>
          </Link>
        </div>

        <div className="hero-actions">
          <Link href="/browse" className="button">
            Browse music
          </Link>

          <Link href="/register" className="text-link">
            Start your MoodTune journey
          </Link>
        </div>
      </section>

      <section
        className="feature-section"
        aria-labelledby="features-title"
      >
        <div className="section-heading">
          <p className="eyebrow">
            Designed around you
          </p>

          <h2 id="features-title">
            Music discovery that begins with emotion
          </h2>
        </div>

        <div className="feature-grid">
          <Link
            href="/browse"
            className="feature-card feature-card-link"
          >
            <h3>Emotion selection</h3>

            <p>
              Select your current or desired mood and discover
              matching music.
            </p>

            <span className="feature-card-action">
              Choose an emotion →
            </span>
          </Link>

          <Link
            href="/library"
            className="feature-card feature-card-link"
          >
            <h3>Your own library</h3>

            <p>
              Save favourites, manage playlists and revisit
              listening history.
            </p>

            <span className="feature-card-action">
              Open your library →
            </span>
          </Link>

          <article className="feature-card">
            <h3>Built-in playback</h3>

            <p>
              Listen directly inside MoodTune using the integrated
              music player.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}