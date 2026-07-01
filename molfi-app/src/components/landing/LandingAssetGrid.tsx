import type { CSSProperties } from "react";
import btcIcon from "@/assets/btc.png";
import molfiIcon from "@/assets/logo.png";
import usdcIcon from "@/assets/usdc.png";

/** Scattered asset tiles on the landing grid — col/row are 1-based on a 12×8 lattice. */
const TILES = [
  { src: btcIcon, col: 2, row: 2, size: 52, opacity: 0.14 },
  { src: molfiIcon, col: 10, row: 1, size: 44, opacity: 0.12 },
  { src: usdcIcon, col: 11, row: 4, size: 40, opacity: 0.1 },
  { src: usdcIcon, col: 1, row: 5, size: 48, opacity: 0.11 },
  { src: btcIcon, col: 9, row: 6, size: 36, opacity: 0.08 },
  { src: molfiIcon, col: 4, row: 7, size: 42, opacity: 0.09 },
  { src: usdcIcon, col: 7, row: 2, size: 34, opacity: 0.07 },
  { src: usdcIcon, col: 3, row: 3, size: 38, opacity: 0.08 },
  { src: btcIcon, col: 6, row: 8, size: 32, opacity: 0.06 },
  { src: molfiIcon, col: 12, row: 7, size: 40, opacity: 0.07 },
] as const;

export function LandingAssetGrid() {
  return (
    <div className="landing-asset-grid" aria-hidden>
      {TILES.map((tile, i) => (
        <div
          key={i}
          className="landing-asset-tile"
          style={{
            gridColumn: tile.col,
            gridRow: tile.row,
            opacity: tile.opacity,
            "--asset-size": `${tile.size}px`,
          } as CSSProperties}
        >
          <img
            src={tile.src}
            alt=""
            className="landing-asset-icon rounded-full"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
