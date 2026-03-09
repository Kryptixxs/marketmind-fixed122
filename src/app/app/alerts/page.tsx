import { redirect } from 'next/navigation';

export default function AlertsPage() {
  redirect('/app/terminal?fn=ALRT');
}

