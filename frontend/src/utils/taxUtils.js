export const computeTax = (state, subtotal) => {
    if (!subtotal) return 0;
    
    // Default fallback to 5.0% standard tax if state is unknown
    if (!state) return Math.round(subtotal * 0.05);

    const stateLower = state.toLowerCase().trim();

    const HIGH_TAX_STATES = ["ca", "california", "ny", "new york", "wa", "washington"];
    const LOW_TAX_STATES = ["tx", "texas", "fl", "florida", "nv", "nevada"];

    const HIGH_RATE = 0.088; // 8.8%
    const LOW_RATE = 0.02;   // 2.0%
    const BASE_RATE = 0.05;  // 5.0% standard fallback

    let appliedRate = BASE_RATE;

    if (HIGH_TAX_STATES.includes(stateLower)) {
        appliedRate = HIGH_RATE;
    } else if (LOW_TAX_STATES.includes(stateLower)) {
        appliedRate = LOW_RATE;
    }

    return Math.round(subtotal * appliedRate);
};
