import { getEventIntel } from './event-intelligence';

describe('Event Intelligence Rules Engine', () => {
  test('identifies Nonfarm Payrolls correctly', () => {
    const intel = getEventIntel('Nonfarm Payrolls (Feb)', 'USD', 'High');
    expect(intel.importanceScore).toBe(10);
    expect(intel.volatility).toBe('Extreme');
    expect(intel.impactedAssets).toContainEqual(expect.objectContaining({ symbol: 'DXY' }));
  });

  test('identifies CPI correctly', () => {
    const intel = getEventIntel('Core CPI (MoM)', 'USD', 'High');
    expect(intel.importanceScore).toBe(10);
    expect(intel.volatility).toBe('High');
  });

  test('provides fallback for unknown events', () => {
    const intel = getEventIntel('Random Economic Data', 'EUR', 'Low');
    expect(intel.importanceScore).toBe(3);
    expect(intel.volatility).toBe('Moderate');
    expect(intel.impactedAssets[0].symbol).toBe('EUR');
  });

  test('respects API impact level for fallbacks', () => {
    const intel = getEventIntel('Unknown High Impact', 'GBP', 'High');
    expect(intel.importanceScore).toBe(9);
    expect(intel.volatility).toBe('High');
  });
});