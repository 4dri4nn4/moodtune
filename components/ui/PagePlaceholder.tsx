import Link from "next/link";

interface PagePlaceholderProps {
  title: string;
  description: string;
}

export default function PagePlaceholder({
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <main className="placeholder-page">
      <section className="placeholder-card">
        <p className="eyebrow">MoodTune</p>
        <h1>{title}</h1>
        <p>{description}</p>

        <Link href="/" className="button">
          Back to home
        </Link>
      </section>
    </main>
  );
}