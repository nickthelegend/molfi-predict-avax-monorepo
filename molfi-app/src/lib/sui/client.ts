import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

export const SUI_NETWORK = "testnet" as const;

export const suiClient = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl(SUI_NETWORK),
  network: SUI_NETWORK,
});
