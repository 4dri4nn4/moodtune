import BrowseView from "@/components/emotion/BrowseView";

type BrowsePageProps = {
  searchParams: Promise<{
    journey?: string;
  }>;
};

export default async function BrowsePage({
  searchParams,
}: BrowsePageProps) {
  const parameters = await searchParams;

  const initialJourney =
    parameters.journey === "want"
      ? "want"
      : "feel";

  return (
    <BrowseView
      initialJourney={initialJourney}
    />
  );
}