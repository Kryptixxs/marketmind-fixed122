import { redirect } from 'next/navigation';

export default function OrdersPage() {
  redirect('/app/terminal?fn=ORD');
}

