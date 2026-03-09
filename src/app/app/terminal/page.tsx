import { TerminalRuntimeView } from '../_components/TerminalRuntimeView';

export default function AppTerminalPage({
  searchParams,
}: {
  searchParams?: { fn?: string | string[]; ticker?: string | string[] };
}) {
  const fn = Array.isArray(searchParams?.fn) ? searchParams?.fn[0] : searchParams?.fn;
  const ticker = Array.isArray(searchParams?.ticker) ? searchParams?.ticker[0] : searchParams?.ticker;
  const bootCommand = (ticker && fn ? `${ticker} ${fn} GO` : ticker ? `${ticker} DES GO` : fn ? `${fn} GO` : undefined);

  return <TerminalRuntimeView bootCommand={bootCommand} />;
}

