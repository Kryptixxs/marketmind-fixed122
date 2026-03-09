import { redirect } from 'next/navigation';

export default function MonitorsPage() {
  redirect('/app/terminal?fn=MON');
}

