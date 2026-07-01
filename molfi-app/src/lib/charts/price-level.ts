export type PriceLevelTone =
  | "current"
  | "liquidation"
  | "strike"
  | "settlement"
  | "entry-up"
  | "entry-down"
  | "entry-range";

export interface PriceLevel {
  label: string;
  price: number;
  tone: PriceLevelTone;
}
