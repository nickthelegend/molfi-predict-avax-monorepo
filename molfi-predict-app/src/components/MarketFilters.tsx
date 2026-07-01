import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ArrowUpDown } from "lucide-react";

interface MarketFiltersProps {
  venue?: string;
  sortBy?: string;
  onVenueChange?: (venue: string) => void;
  onSortChange?: (sort: string) => void;
}

export function MarketFilters({
  venue = 'all',
  sortBy = 'trending',
  onVenueChange,
  onSortChange,
}: MarketFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Venue Filter */}
      <Select value={venue} onValueChange={onVenueChange}>
        <SelectTrigger className="w-[160px] rounded-full border-2">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="All Venues" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Venues</SelectItem>
          <SelectItem value="POLYMARKET">Polymarket</SelectItem>
          <SelectItem value="KALSHI">Kalshi</SelectItem>
          <SelectItem value="LIMITLESS">Limitless</SelectItem>
          <SelectItem value="MOLFI_NATIVE">Molfi</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[170px] rounded-full border-2">
          <ArrowUpDown className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="trending">Trending</SelectItem>
          <SelectItem value="liquidity_desc">Top Liquidity</SelectItem>
          <SelectItem value="volume24h_desc">Highest Volume</SelectItem>
          <SelectItem value="createdAt_desc">Newest</SelectItem>
          <SelectItem value="endingSoon">Ending Soon</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default MarketFilters;
