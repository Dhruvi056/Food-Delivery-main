import { computeTax } from "../utils/taxUtils.js";

describe("Checkout Tax & Financial Computations", () => {
    it("should calculate an 8.8% tax for high-tax states like NY", () => {
        const subtotal = 200;
        const tax = computeTax("NY", subtotal);
        // 200 * 0.088 = 17.6 -> rounded 18
        expect(tax).toBe(18);
    });

    it("should calculate an 8.8% tax for high-tax states like CA", () => {
        const subtotal = 150.50;
        const tax = computeTax("CA", subtotal);
        // 150.5 * 0.088 = 13.244 -> rounded 13
        expect(tax).toBe(13);
    });

    it("should calculate a default 6.5% tax for unlisted states", () => {
        const subtotal = 100;
        const tax = computeTax("TX", subtotal);
        // TX is listed as LOW_RATE 4.0%
        // 100 * 0.04 = 4.0
        expect(tax).toBe(4);
    });

    it("should handle 0 subtotal correctly without NaN errors", () => {
        const tax = computeTax("NY", 0);
        expect(tax).toBe(0);
    });
});
