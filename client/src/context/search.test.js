import { renderHook } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

// Ashley Chang Le Xuan, A0252633J
describe("SearchContext", () => {

    describe("Initial State", () => {
        it("should initialize with empty keyword", () => {
            // Arrange
            // (no setup needed - testing default state)

            // Act
            const { result } = renderHook(() => useSearch(), {
                wrapper: SearchProvider,
            });

            // Assert
            const [auth] = result.current;
            expect(auth.keyword).toBe("");
        });

        it("should initialize with empty results array", () => {
            // Arrange
            // (no setup needed - testing default state)

            // Act
            const { result } = renderHook(() => useSearch(), {
                wrapper: SearchProvider,
            });

            // Assert
            const [auth] = result.current;
            expect(auth.results).toEqual([]);
        });
    });
});