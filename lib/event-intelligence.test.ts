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
  test('identifies CPI correctly with hawkish polarity', () => {
    const event = mockEvent({ title: 'Core CPI (MoM)' });
    const intel = getEventIntel(event);
    expect(intel.hawkishWhenHigher).toBe(true);
    
    const res = computeSurprise({ actual: '0.5%', forecast: '0.3%' }, intel);
    expect(res.direction).toBe('ABOVE');
    expect(res.interpretation).toBe('HAWKISH');
  });

  test('identifies Jobless Claims correctly with bearish polarity', () => {
    const event = mockEvent({ title: 'Initial Jobless Claims' });
    const intel = getEventIntel(event);
    expect(intel.goodWhenHigher).toBe(false);
    
    const res = computeSurprise({ actual: '250k', forecast: '200k' }, intel);
    expect(res.direction).toBe('ABOVE');
    expect(res.interpretation).toBe('BEARISH_RISK');
  });

  test('identifies Nonfarm Payrolls correctly with bullish polarity', () => {
    const event = mockEvent({ title: 'Nonfarm Payrolls' });
    const intel = getEventIntel(event);
    expect(intel.goodWhenHigher).toBe(true);
    
    const res = computeSurprise({ actual: '300k', forecast: '200k' }, intel);
    expect(res.direction).toBe('ABOVE');
    expect(res.interpretation).toBe('BULLISH_RISK');
  });
});