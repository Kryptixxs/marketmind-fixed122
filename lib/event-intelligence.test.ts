import { getEventIntel, computeSurprise } from './event-intelligence';
import { EconomicEvent } from './types';

const mockEvent = (overrides: Partial<EconomicEvent>): EconomicEvent => ({
  id: 'test',
  date: '2024-01-01',
  time: '08:30',
  country: 'US',
  currency: 'USD',
  impact: 'High',
  title: 'Test Event',
  actual: null,
  forecast: null,
  previous: null,
  timestamp: 0,
  ...overrides
});

describe('Event Intelligence Rules Engine', () => {
  test('identifies CPI correctly with specific logic and assets', () => {
    const event = mockEvent({ title: 'Core CPI (MoM)' });
    const intel = getEventIntel(event);
    expect(intel.macroImpact).toBe(10);
    expect(intel.volatility).toBe('High');
    expect(intel.impactedAssets).toContainEqual(expect.objectContaining({ symbol: 'DXY', direction: 'UP' }));
    expect(intel.scenarios.length).toBe(3);
  });

  test('identifies Nonfarm Payrolls correctly with extreme volatility', () => {
    const event = mockEvent({ title: 'Nonfarm Payrolls' });
    const intel = getEventIntel(event);
    expect(intel.volatility).toBe('Extreme');
    expect(intel.surpriseThresholdPct).toBe(15);
  });

  test('identifies Jobless Claims correctly', () => {
    const event = mockEvent({ title: 'Initial Jobless Claims', impact: 'Medium' });
    const intel = getEventIntel(event);
    expect(intel.macroImpact).toBe(6);
    expect(intel.impactedAssets[0].symbol).toBe('2Y Yield');
  });

  test('provides currency-based fallback for unknown events', () => {
    const event = mockEvent({ title: 'Random Data', currency: 'EUR', impact: 'Low' });
    const intel = getEventIntel(event);
    expect(intel.macroImpact).toBe(4);
    expect(intel.impactedAssets[0].symbol).toBe('EUR');
  });
});

describe('Surprise Calculation', () => {
  test('classifies HOT surprise correctly', () => {
    const res = computeSurprise({ actual: '3.5%', forecast: '3.1%' });
    expect(res.classification).toBe('HOT');
    expect(res.surprisePct).toBeCloseTo(12.9, 1);
  });

  test('classifies COOL surprise correctly', () => {
    const res = computeSurprise({ actual: '150k', forecast: '200k' });
    expect(res.classification).toBe('COOL');
    expect(res.surprisePct).toBe(-25);
  });

  test('classifies INLINE surprise correctly', () => {
    const res = computeSurprise({ actual: '2.0%', forecast: '2.0%' });
    expect(res.classification).toBe('INLINE');
    expect(res.surprisePct).toBe(0);
  });

  test('handles missing data gracefully', () => {
    const res = computeSurprise({ actual: null, forecast: '1.0%' });
    expect(res.classification).toBe('N/A');
  });
});