import { MarketplaceFeed } from "@/components/marketplace-feed";
export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <MarketplaceFeed p={await searchParams} basePath="/explore" />;
}
