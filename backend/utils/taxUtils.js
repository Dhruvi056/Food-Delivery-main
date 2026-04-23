// Tax computation utility based on region

/**
 * Calculates tax based on the user's shipping state/region
 * @param {string} state - The delivery state/region
 * @param {number} subtotal - The cart subtotal
 * @returns {number} The calculated tax amount
 */
export const computeTax = (state, subtotal) => {
    if (!subtotal) return 0;

    // Match frontend behavior: use default rate when state is missing
    if (!state) return Math.round(subtotal * 0.05);

    const stateLower = state.toLowerCase().trim();

    // Define tax groups by region (in percentages)
    // Example specific states
    const HIGH_TAX_STATES = ["ca", "california", "ny", "new york", "wa", "washington"];
    const LOW_TAX_STATES = ["tx", "texas", "fl", "florida", "nv", "nevada"];

    // Tax Rates
    const HIGH_RATE = 0.088; // 8.8%
    const LOW_RATE = 0.02;   // 2.0%
    const BASE_RATE = 0.05;  // 5.0% standard fallback

    let appliedRate = BASE_RATE;

    if (HIGH_TAX_STATES.includes(stateLower)) {
        appliedRate = HIGH_RATE;
    } else if (LOW_TAX_STATES.includes(stateLower)) {
        appliedRate = LOW_RATE;
    }

    // Calculate and round to 2 decimal places
    const taxAmount = subtotal * appliedRate;
    return Math.round(taxAmount);
};
