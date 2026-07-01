import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";

type ReturnValueBytes = number[] | Uint8Array | string;

function toU8(raw: ReturnValueBytes): Uint8Array {
  if (typeof raw === "string") {
    const bin = atob(raw);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }
  if (raw instanceof Uint8Array) return raw;
  return Uint8Array.from(raw);
}

function parseU64(raw: ReturnValueBytes): bigint {
  const bytes = toU8(raw);
  const len = Math.min(bytes.length, 8);
  let value = 0n;
  for (let i = 0; i < len; i++) {
    value += BigInt(bytes[i] ?? 0) << BigInt(8 * i);
  }
  return value;
}

function findReturnTuple(
  results: Array<{ returnValues?: Array<[ReturnValueBytes, string]> }> | null | undefined,
  count: number,
): bigint[] | null {
  let found: bigint[] | null = null;
  for (const result of results ?? []) {
    const values = result.returnValues;
    if (values && values.length >= count) {
      found = values.slice(0, count).map(([bytes]) => parseU64(bytes));
    }
  }
  return found;
}

const client = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl("testnet"),
  network: "testnet",
});

const LEVERX = "0xe960e158acfea28447f0b9945d452ad59f8222e7a72139c1e876e26816064cc9";
const QUOTE = "0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC";
const MANAGER = "0x3cda4a3f262ed19b7aec54ac08f18e9678b18fd301e04f59f642d16424bbaf00";
const SENDER = "0x0000000000000000000000000000000000000000000000000000000000000001";

const tx = new Transaction();
tx.setSender(SENDER);
tx.moveCall({
  target: `${LEVERX}::predict_client::manager_balance`,
  typeArguments: [QUOTE],
  arguments: [tx.object(MANAGER)],
});

const inspect = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: SENDER });
const tuple = findReturnTuple(inspect.results, 1);
console.log("parsed", tuple?.[0]?.toString(), "usd", Number(tuple?.[0] ?? 0n) / 1e6);
