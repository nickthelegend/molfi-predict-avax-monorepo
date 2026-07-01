import { useMemo } from 'react';
import type { MolfiMarket } from '@/services/molfi-api';
import type { MarketItem, MarketGroup, GroupOutcome, NormalizedMarket } from '@/types/market-group';

function normalizeMarket(market: MolfiMarket): NormalizedMarket {
  return {
    id: market.id,
    title: market.title,
    description: market.description,
    category: market.category,
    tags: market.tags ?? [],
    venue: market.venue?.toUpperCase() ?? 'MOLFI_NATIVE',
    status: market.status,
    yesPrice: market.yes_price ?? 50,
    noPrice: market.no_price ?? 50,
    yesPercentage: market.yes_price ?? 50,
    noPercentage: market.no_price ?? 50,
    liquidity: market.liquidity ?? 0,
    volume24h: market.volume_24h ?? 0,
    totalVolume: market.volume_total ?? 0,
    openInterest: market.open_interest ?? 0,
    createdAt: market.created_at,
    endDate: market.expires_at,
    imageUrl: market.image_url ?? undefined,
  };
}

function transformToMarketGroup(markets: MolfiMarket[], groupId: string): MarketGroup {
  const firstMarket = markets[0];

  const outcomes: GroupOutcome[] = markets.map((market, index) => {
    const outcomeName = market.title.split('?')[1]?.trim() || `Outcome ${index + 1}`;

    return {
      outcomeId: market.id,
      label: outcomeName,
      marketId: market.id,
      yesPrice: market.yes_price ?? 50,
      noPrice: market.no_price ?? 50,
      impliedProbability: market.yes_price ?? 50,
      liquidity: market.liquidity,
      volume24h: market.volume_24h,
      provider: market.venue?.toUpperCase() ?? 'MOLFI_NATIVE',
      status: market.status === 'active' ? 'active' : market.status === 'resolved' ? 'settled' : 'suspended',
      iconUrl: market.image_url ?? undefined,
    };
  });

  outcomes.sort((a, b) => b.impliedProbability - a.impliedProbability);

  return {
    groupId,
    question: firstMarket.title.split('?')[0] + '?' || firstMarket.title,
    description: firstMarket.description,
    category: firstMarket.category,
    imageUrl: firstMarket.image_url ?? undefined,
    totalVolume: markets.reduce((sum, m) => sum + (m.volume_total || 0), 0),
    totalLiquidity: markets.reduce((sum, m) => sum + (m.liquidity || 0), 0),
    endDate: firstMarket.expires_at,
    status: firstMarket.status === 'active' ? 'active' : firstMarket.status === 'resolved' ? 'settled' : 'suspended',
    outcomes,
    updatedAt: firstMarket.updated_at,
  };
}

// Temporary mock data for QA testing
function generateMockMarketGroups(): MarketItem[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const shortFuture = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const mockGroups: MarketItem[] = [];

  const countries2 = ['Germany', 'Spain'];
  mockGroups.push({
    type: 'group',
    group: {
      groupId: 'test-group-2',
      question: 'Who will win the 2026 FIFA World Cup Finals?',
      category: 'Sports',
      sport: 'Soccer',
      totalVolume: 500000,
      totalLiquidity: 150000,
      endDate: futureDate,
      status: 'active',
      outcomes: countries2.map((country, i) => ({
        outcomeId: `outcome-2-${i}`,
        label: country,
        marketId: `market-2-${i}`,
        yesPrice: 75 - i * 20,
        noPrice: 25 + i * 20,
        impliedProbability: 75 - i * 20,
        liquidity: 75000,
        volume24h: 25000,
        provider: 'MOLFI_NATIVE',
        status: 'active' as const,
      })),
      updatedAt: now.toISOString(),
    },
  });

  const countries10 = ['Brazil', 'France', 'Argentina', 'England', 'Spain', 'Germany', 'Italy', 'Netherlands', 'Portugal', 'Belgium'];
  mockGroups.push({
    type: 'group',
    group: {
      groupId: 'test-group-10',
      question: 'Which country will win the most Olympic gold medals in 2028?',
      category: 'Sports',
      totalVolume: 2500000,
      totalLiquidity: 850000,
      endDate: futureDate,
      status: 'active',
      outcomes: countries10.map((country, i) => ({
        outcomeId: `outcome-10-${i}`,
        label: country,
        marketId: `market-10-${i}`,
        yesPrice: Math.max(5, 65 - i * 6),
        noPrice: Math.min(95, 35 + i * 6),
        impliedProbability: Math.max(5, 65 - i * 6),
        liquidity: 85000 - i * 5000,
        volume24h: 50000 - i * 3000,
        provider: 'MOLFI_NATIVE',
        status: i === 7 ? 'suspended' as const : 'active' as const,
      })),
      updatedAt: now.toISOString(),
    },
  });

  const companies = [
    'Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'Tesla', 'NVIDIA', 'Netflix', 'Adobe', 'Salesforce',
    'Oracle', 'Intel', 'IBM', 'Cisco', 'PayPal', 'AMD', 'Qualcomm', 'Texas Instruments', 'Broadcom', 'Micron',
    'Applied Materials', 'Lam Research', 'KLA', 'Synopsys', 'Cadence', 'ServiceNow', 'Workday', 'Snowflake',
    'Datadog', 'CrowdStrike', 'Palo Alto Networks', 'Fortinet', 'Cloudflare', 'MongoDB', 'Elastic', 'Splunk',
    'Twilio', 'Okta', 'Zoom', 'DocuSign', 'HubSpot', 'Atlassian', 'Shopify', 'Square', 'Stripe', 'Coinbase',
    'Robinhood', 'Affirm', 'SoFi', 'Plaid'
  ];
  
  mockGroups.push({
    type: 'group',
    group: {
      groupId: 'test-group-50',
      question: 'Which tech company will have the highest market cap by end of 2026?',
      category: 'Finance',
      totalVolume: 15000000,
      totalLiquidity: 5000000,
      endDate: futureDate,
      status: 'active',
      outcomes: companies.map((company, i) => ({
        outcomeId: `outcome-50-${i}`,
        label: company,
        marketId: `market-50-${i}`,
        yesPrice: Math.max(1, 40 - i * 0.8),
        noPrice: Math.min(99, 60 + i * 0.8),
        impliedProbability: Math.max(1, 40 - i * 0.8),
        liquidity: Math.max(10000, 100000 - i * 1500),
        volume24h: Math.max(5000, 300000 - i * 5000),
        provider: 'MOLFI_NATIVE',
        status: 'active' as const,
      })),
      updatedAt: now.toISOString(),
    },
  });

  const btcPriceRanges = ['Above $150K', '$120K-$150K', '$100K-$120K', '$80K-$100K', 'Below $80K'];
  mockGroups.push({
    type: 'group',
    group: {
      groupId: 'btc-price-2026',
      question: "What will be Bitcoin's price at the end of Q2 2026?",
      category: 'Crypto',
      imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
      totalVolume: 8500000,
      totalLiquidity: 2500000,
      endDate: shortFuture,
      status: 'active',
      outcomes: btcPriceRanges.map((range, i) => ({
        outcomeId: `btc-outcome-${i}`,
        label: range,
        marketId: `btc-market-${i}`,
        yesPrice: i === 1 ? 38 : i === 2 ? 28 : i === 0 ? 18 : i === 3 ? 12 : 4,
        noPrice: i === 1 ? 62 : i === 2 ? 72 : i === 0 ? 82 : i === 3 ? 88 : 96,
        impliedProbability: i === 1 ? 38 : i === 2 ? 28 : i === 0 ? 18 : i === 3 ? 12 : 4,
        liquidity: 500000 - i * 80000,
        volume24h: 150000 - i * 25000,
        provider: 'MOLFI_NATIVE',
        status: 'active' as const,
      })),
      updatedAt: now.toISOString(),
    },
  });

  const candidates = ['Donald Trump', 'Ron DeSantis', 'Kamala Harris', 'Gavin Newsom', 'Nikki Haley', 'Other'];
  mockGroups.push({
    type: 'group',
    group: {
      groupId: 'us-election-2028',
      question: 'Who will win the 2028 US Presidential Election?',
      category: 'Politics',
      totalVolume: 12000000,
      totalLiquidity: 4500000,
      endDate: futureDate,
      status: 'active',
      outcomes: candidates.map((candidate, i) => ({
        outcomeId: `election-outcome-${i}`,
        label: candidate,
        marketId: `election-market-${i}`,
        yesPrice: i === 0 ? 32 : i === 1 ? 24 : i === 2 ? 18 : i === 3 ? 14 : i === 4 ? 8 : 4,
        noPrice: i === 0 ? 68 : i === 1 ? 76 : i === 2 ? 82 : i === 3 ? 86 : i === 4 ? 92 : 96,
        impliedProbability: i === 0 ? 32 : i === 1 ? 24 : i === 2 ? 18 : i === 3 ? 14 : i === 4 ? 8 : 4,
        liquidity: 750000 - i * 100000,
        volume24h: 200000 - i * 30000,
        provider: 'MOLFI_NATIVE',
        status: 'active' as const,
      })),
      updatedAt: now.toISOString(),
    },
  });

  const aiMilestones = ['GPT-5 Release', 'AGI Announcement', 'AI Regulation Passed', 'OpenAI IPO', 'AI Winter Begins'];
  mockGroups.push({
    type: 'group',
    group: {
      groupId: 'ai-milestones-2026',
      question: 'Which AI milestone will happen first in 2026?',
      category: 'Technology',
      totalVolume: 3200000,
      totalLiquidity: 980000,
      endDate: shortFuture,
      status: 'active',
      outcomes: aiMilestones.map((milestone, i) => ({
        outcomeId: `ai-outcome-${i}`,
        label: milestone,
        marketId: `ai-market-${i}`,
        yesPrice: i === 0 ? 42 : i === 2 ? 28 : i === 1 ? 15 : i === 3 ? 10 : 5,
        noPrice: i === 0 ? 58 : i === 2 ? 72 : i === 1 ? 85 : i === 3 ? 90 : 95,
        impliedProbability: i === 0 ? 42 : i === 2 ? 28 : i === 1 ? 15 : i === 3 ? 10 : 5,
        liquidity: 200000 - i * 30000,
        volume24h: 80000 - i * 12000,
        provider: 'MOLFI_NATIVE',
        status: 'active' as const,
      })),
      updatedAt: now.toISOString(),
    },
  });

  return mockGroups;
}

export function useMarketGroups(markets: MolfiMarket[]): MarketItem[] {
  return useMemo(() => {
    const groupMap = new Map<string, MolfiMarket[]>();
    const ungrouped: MolfiMarket[] = [];
    
    markets.forEach(market => {
      if (market.group_id) {
        const existing = groupMap.get(market.group_id) || [];
        groupMap.set(market.group_id, [...existing, market]);
      } else {
        ungrouped.push(market);
      }
    });
    
    const items: MarketItem[] = [];
    
    groupMap.forEach((groupMarkets, groupId) => {
      if (groupMarkets.length >= 2) {
        items.push({
          type: 'group',
          group: transformToMarketGroup(groupMarkets, groupId),
        });
      } else {
        items.push({
          type: 'binary',
          market: normalizeMarket(groupMarkets[0]),
        });
      }
    });
    
    ungrouped.forEach(m => {
      items.push({ 
        type: 'binary', 
        market: normalizeMarket(m) 
      });
    });

    // TEMPORARY: Inject mock market groups for QA testing
    const mockGroups = generateMockMarketGroups();
    
    if (items.length > 1) {
      items.splice(1, 0, mockGroups[0]);
      items.splice(5, 0, mockGroups[1]);
      items.splice(10, 0, mockGroups[2]);
    } else {
      items.push(...mockGroups);
    }
    
    return items;
  }, [markets]);
}
