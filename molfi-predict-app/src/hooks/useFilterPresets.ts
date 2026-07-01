import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface FilterPreset {
  id: string;
  name: string;
  category: string;
  venue: string;
  sortBy: string;
  minVolume?: number;
}

const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'high-volume',
    name: 'High Volume',
    category: 'all',
    venue: 'all',
    sortBy: 'volumeTotal_desc',
    minVolume: 10000,
  },
  {
    id: 'crypto-markets',
    name: 'Crypto Markets',
    category: 'crypto',
    venue: 'all',
    sortBy: 'volumeTotal_desc',
  },
  {
    id: 'politics',
    name: 'Politics',
    category: 'politics',
    venue: 'all',
    sortBy: 'createdAt_desc',
  },
  {
    id: 'polymarket-only',
    name: 'Polymarket Only',
    category: 'all',
    venue: 'POLYMARKET',
    sortBy: 'volumeTotal_desc',
  },
];

export const useFilterPresets = () => {
  const [customPresets, setCustomPresets] = useLocalStorage<FilterPreset[]>('market-filter-presets', []);

  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  const savePreset = (preset: Omit<FilterPreset, 'id'>) => {
    const newPreset: FilterPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
    };
    setCustomPresets([...customPresets, newPreset]);
  };

  const deletePreset = (id: string) => {
    setCustomPresets(customPresets.filter(p => p.id !== id));
  };

  return {
    presets: allPresets,
    savePreset,
    deletePreset,
  };
};
