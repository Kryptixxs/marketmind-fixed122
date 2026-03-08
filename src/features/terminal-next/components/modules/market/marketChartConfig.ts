export const MARKET_CHART_CONFIG = {
  compactHeightClass: 'h-[84px]',
  mediumHeightClass: 'h-[112px]',
  frameClass: 'border border-[#111] bg-[#081321]',
  timeframeOrder: ['5D', '1M', '3M'] as const,
  questions: {
    regimeSnapshot: 'What is the current market regime across core risk proxies?',
    driverAnalysis: 'What factors are driving the move right now?',
    flowPositioning: 'Where are flows and positioning vulnerable?',
    deepDetail: 'How does current stress compare with historical and correlation depth?',
  },
} as const;
