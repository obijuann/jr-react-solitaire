import solveTableBitmapUrl from "../assets/solve-table.dat?url";
import { TOTAL_SOLITAIRE_GAMES } from "./deck-shuffler";

/** Number of bytes in the draw-one solvability bitmap (1,000,000 bits packed). */
const SOLVABILITY_BITMAP_BYTES = 125_000;

/** Cached bitmap bytes after the first successful load. */
let cachedBitmap: Uint8Array | null = null;
/** Shared in-flight load promise used to deduplicate concurrent fetches. */
let loadPromise: Promise<Uint8Array> | null = null;

/**
 * Load and validate the packaged solvability bitmap.
 * Uses memoization so the bitmap is fetched only once per page lifetime.
 *
 * @returns Bitmap bytes used for O(1) solvability checks
 * @throws Error when fetch fails or byte length is unexpected
 */
async function loadSolvabilityBitmap(): Promise<Uint8Array> {
    if (cachedBitmap) {
        return cachedBitmap;
    }

    if (!loadPromise) {
        // Reuse one promise for all concurrent callers until fetch completes.
        loadPromise = fetch(solveTableBitmapUrl)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load solvability bitmap: HTTP ${response.status}`);
                }
                const bytes = new Uint8Array(await response.arrayBuffer());
                if (bytes.length !== SOLVABILITY_BITMAP_BYTES) {
                    throw new Error(`Invalid solvability bitmap size: ${bytes.length}. Expected ${SOLVABILITY_BITMAP_BYTES}`);
                }
                cachedBitmap = bytes;
                return bytes;
            })
            .finally(() => {
                loadPromise = null;
            });
    }

    return loadPromise;
}

/** Returns whether game number is solvable using the draw-one solvability bitmap. */
export async function isGameNumberSolvable(gameNumber: number): Promise<boolean> {
    if (!Number.isInteger(gameNumber) || gameNumber < 1 || gameNumber > TOTAL_SOLITAIRE_GAMES) {
        throw new Error(`Invalid game number: ${gameNumber}. Expected integer in [1, ${TOTAL_SOLITAIRE_GAMES}]`);
    }

    const bitmap = await loadSolvabilityBitmap();

    // The source table stores game #1,000,000 at bit 0; all others use their own index.
    const index = gameNumber === TOTAL_SOLITAIRE_GAMES ? 0 : gameNumber;
    const byteIndex = Math.floor(index / 8);
    const bitOffset = index % 8;

    // A set bit means the corresponding game number is solvable in draw-one mode.
    return (bitmap[byteIndex] & (1 << bitOffset)) !== 0;
}

/**
 * Pick a random solvable game number by sampling random game numbers.
 *
 * This helper keeps generation fast by avoiding full scans and using bitmap O(1) checks.
 * If all attempts fail, it returns the last sampled value so callers can still progress.
 *
 * @param rng Random number source that returns [0, 1)
 * @param maxAttempts Maximum random samples before fallback
 * @returns Solvable game number when found, otherwise the final sampled number
 * Fallback: returns most recent sampled game number if max attempts exhausted.
 */
export async function pickRandomSolvableGameNumber(rng: () => number = Math.random, maxAttempts: number = 5000): Promise<number> {
    let sampled = 1;
    for (let i = 0; i < maxAttempts; i++) {
        sampled = Math.floor(rng() * TOTAL_SOLITAIRE_GAMES) + 1;
        if (await isGameNumberSolvable(sampled)) {
            return sampled;
        }
    }
    return sampled;
}

/**
 * Testing hook to replace/reset the cached bitmap and avoid network fetch in unit tests.
 * @param bitmap Test bitmap or null to clear cache state
 */
export function setSolvabilityBitmapForTests(bitmap: Uint8Array | null): void {
    cachedBitmap = bitmap;
    loadPromise = null;
}
