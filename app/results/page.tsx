import ResultsView from "@/components/results/ResultsView";

type ResultsSearchParams = { journey?: string; emotion?: string };
type ResultsPageProps = { searchParams: Promise<ResultsSearchParams> };

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const parameters = await searchParams;
  return (
    <ResultsView
      journey={parameters.journey ?? "feel"}
      emotion={parameters.emotion ?? ""}
    />
  );
}
