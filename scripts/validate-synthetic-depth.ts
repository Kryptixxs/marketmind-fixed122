import { generateSyntheticIntel } from '../src/lib/synthetic/intel-generator';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const a1 = generateSyntheticIntel('AAPL');
  const a2 = generateSyntheticIntel('AAPL');
  const m1 = generateSyntheticIntel('MSFT');

  assert(a1.seed === a2.seed, 'Seed mismatch for same symbol');
  assert(
    JSON.stringify(a1.financialHistory.points) === JSON.stringify(a2.financialHistory.points),
    'Financial history should be deterministic for same symbol'
  );
  assert(
    JSON.stringify(a1.relationshipGraph.edges) === JSON.stringify(a2.relationshipGraph.edges),
    'Relationship graph should be deterministic for same symbol'
  );
  assert(
    JSON.stringify(a1.newsArchive.articles.slice(0, 20)) === JSON.stringify(a2.newsArchive.articles.slice(0, 20)),
    'News archive should be deterministic for same symbol'
  );
  assert(a1.seed !== m1.seed, 'Different symbols should not share same seed');
  assert(a1.newsArchive.articles.length >= 200, 'Synthetic news should include at least 200 articles');
  assert(a1.relationshipGraph.entities.length >= 20, 'Synthetic relationship graph should include at least 20 entities');

  const stackDomainCount = [
    a1.financialHistory.points.length > 0,
    a1.analystRevisions.rows.length > 0,
    a1.relationshipGraph.edges.length > 0,
    a1.newsArchive.articles.length > 0,
    a1.riskProfile.debtMaturityLadder.length > 0,
    a1.flowMetrics.shortInterestTrend.length > 0,
    a1.peerComparison.peers.length > 0,
    a1.eventTimeline.events.length > 0,
  ].filter(Boolean).length;
  assert(stackDomainCount >= 8, 'Stacked intelligence must provide at least 8 populated domains');

  console.log('Synthetic depth validation passed.');
}

main();
