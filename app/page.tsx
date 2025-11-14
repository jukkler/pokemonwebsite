/**
 * Root Page - Redirect zu /pokeroute
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/pokeroute');
}
