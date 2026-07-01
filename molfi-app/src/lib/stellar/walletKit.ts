/**
 * Stellar Wallets Kit — shared singleton for Molfi's wallet/identity layer.
 *
 * This is the first step of the Sui → Stellar migration: it replaces the Sui
 * wallet-standard connection with a Stellar wallet (Freighter / xBull / Albedo /
 * Lobstr / Hana). Trade *execution* still targets the Sui protocol until the
 * on-chain layer is ported to Soroban — see WalletContext for the transition note.
 */
import {
  StellarWalletsKit,
  WalletNetwork,
  FREIGHTER_ID,
  FreighterModule,
  xBullModule,
  AlbedoModule,
  LobstrModule,
  HanaModule,
  RabetModule,
} from "@creit.tech/stellar-wallets-kit";

export const STELLAR_NETWORK: WalletNetwork =
  import.meta.env.VITE_STELLAR_NETWORK === "mainnet"
    ? WalletNetwork.PUBLIC
    : WalletNetwork.TESTNET;

export const NETWORK_PASSPHRASE = STELLAR_NETWORK;

export const SOROBAN_RPC_URL: string =
  import.meta.env.VITE_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";

export const walletKit = new StellarWalletsKit({
  network: STELLAR_NETWORK,
  selectedWalletId: FREIGHTER_ID,
  // Stellar browser wallets only. We deliberately exclude HOT (NEAR), Ledger,
  // Trezor, and WalletConnect: their Node-only deps (near-js → randombytes
  // `global`, `usb`) break the Vite browser build.
  modules: [
    new FreighterModule(),
    new xBullModule(),
    new AlbedoModule(),
    new LobstrModule(),
    new HanaModule(),
    new RabetModule(),
  ],
});
