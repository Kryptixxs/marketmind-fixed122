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
  assert(typeof a1.financialHistory.slopeRevenue === 'number', 'Financial slope must be generated');
  assert(a1.financialHistory.percentileBands.revenue.p90 >= a1.financialHistory.percentileBands.revenue.p10, 'Revenue percentile bands must be valid');
  assert(a1.newsArchive.articles.every((x) => typeof x.relevanceWeight === 'number'), 'Synthetic documents require relevance weights');
  assert(a1.newsArchive.articles.every((x) => x.relevanceWeight >= 0 && x.relevanceWeight <= 1), 'Document relevance weights must be bounded');
  assert(a1.newsArchive.provenance.label === 'SIMULATED', 'Synthetic provenance label must be SIMULATED');
  const root = a1.relationshipGraph.entities[0];
  const rootEdges = a1.relationshipGraph.edges.filter((e) => e.fromId === root.id);
  const countType = (type: string) => rootEdges.filter((e) => e.relationshipType === type).length;
  assert(countType('SUPPLIER') >= 5, 'Root must have at least 5 supplier edges');
  assert(countType('CUSTOMER') >= 3, 'Root must have at least 3 customer edges');
  assert(countType('PARTNERSHIP') >= 2, 'Root must have at least 2 partnership edges');
  assert(countType('COUNTRY_EXPOSURE') >= 2, 'Root must have at least 2 country exposure edges');
  assert(countType('LITIGATION') >= 1, 'Root must have at least 1 litigation edge');
  assert(countType('DOCUMENT_MENTION') >= 3, 'Root must have at least 3 document mention edges');

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
