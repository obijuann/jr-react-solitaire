import { beforeEach, describe, expect, it, vi } from "vitest";
import { isGameNumberSolvable, pickRandomSolvableGameNumber, setSolvabilityBitmapForTests } from "./solvability-table";

const BITMAP_SIZE = 125_000;

function makeBitmapWithBits(indices: number[]): Uint8Array {
    const bitmap = new Uint8Array(BITMAP_SIZE);
    for (const index of indices) {
        const byteIndex = Math.floor(index / 8);
        const bitOffset = index % 8;
        bitmap[byteIndex] |= (1 << bitOffset);
    }
    return bitmap;
}

describe("solvability-table", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        setSolvabilityBitmapForTests(null);
    });

    it("looks up bits using game-number indexing rules", async () => {
        const bitmap = makeBitmapWithBits([1, 999_999, 0]);
        setSolvabilityBitmapForTests(bitmap);

        await expect(isGameNumberSolvable(1)).resolves.toBe(true);
        await expect(isGameNumberSolvable(2)).resolves.toBe(false);
        await expect(isGameNumberSolvable(999_999)).resolves.toBe(true);
        await expect(isGameNumberSolvable(1_000_000)).resolves.toBe(true);
    });

    it("validates game-number bounds", async () => {
        setSolvabilityBitmapForTests(makeBitmapWithBits([]));

        await expect(isGameNumberSolvable(0)).rejects.toThrow(/Invalid game number/);
        await expect(isGameNumberSolvable(1_000_001)).rejects.toThrow(/Invalid game number/);
    });

    it("loads bitmap via fetch once and caches it", async () => {
        const bitmap = makeBitmapWithBits([7]);
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            arrayBuffer: async () => bitmap.buffer,
        });

        vi.stubGlobal("fetch", fetchMock);

        await expect(isGameNumberSolvable(7)).resolves.toBe(true);
        await expect(isGameNumberSolvable(8)).resolves.toBe(false);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("picks a solvable game number from random samples", async () => {
        const bitmap = makeBitmapWithBits([123_456]);
        setSolvabilityBitmapForTests(bitmap);

        const randomValues = [0.01, 0.123455, 0.123455, 0.123456].values();
        const rng = () => randomValues.next().value as number;

        const gameNumber = await pickRandomSolvableGameNumber(rng, 10);
        expect(gameNumber).toBe(123_456);
    });
});
