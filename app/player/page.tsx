import PlayerView from "@/components/player/PlayerView";

type PlayerSearchParams = { track?: string; journey?: string; emotion?: string };
type PlayerPageProps = { searchParams: Promise<PlayerSearchParams> };

export default async function PlayerPage({ searchParams }: PlayerPageProps) {
  const parameters = await searchParams;
  return (
    <PlayerView
      trackId={parameters.track ?? ""}
      journey={parameters.journey ?? "feel"}
      emotion={parameters.emotion ?? ""}
    />
  );
}
