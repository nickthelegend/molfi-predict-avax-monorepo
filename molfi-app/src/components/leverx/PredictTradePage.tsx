import { PredictTradeTerminal } from "@/components/leverx/PredictTradeTerminal";

interface Props {
  oracleId: string;
}

export function PredictTradePage({ oracleId }: Props) {
  return <PredictTradeTerminal key={oracleId} oracleId={oracleId} />;
}
