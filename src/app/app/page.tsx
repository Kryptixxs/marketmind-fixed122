import { TerminalRuntimeView } from './_components/TerminalRuntimeView';

export default function AppHomePage({
  searchParams,
}: {
  searchParams?: { onboarding?: string | string[] };
}) {
  const onboardingValue = Array.isArray(searchParams?.onboarding) ? searchParams?.onboarding[0] : searchParams?.onboarding;
  const bootCommand = onboardingValue === '1' ? 'TUTOR GO' : 'NAVTREE GO';
  return <TerminalRuntimeView bootCommand={bootCommand} />;
}

