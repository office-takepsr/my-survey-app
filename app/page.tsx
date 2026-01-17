import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function HomePage() {
  // ❌ fetch(`${base}/api/surveys`) は使わない
  // ✅ 直接 Supabase から取得する
  const { data: surveys } = await supabaseAdmin
    .from('surveys')
    .select('code, name')
    .eq('status', 'open'); // 公開中のものだけ

  return (
    <main style={{ padding: 24 }}>
      <h1>Survey App</h1>
      <ul>
        {surveys?.map((s) => (
          <li key={s.code}>
            {/* Link を使ってもOKですが、まずは <a> で試すと確実です */}
            <Link href={`/s/${s.code}`}>{s.name} ({s.code})</Link>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 20, color: '#666' }}>
        例：<a href="/s/2026-02">/s/2026-02</a>
      </p>
    </main>
  );
}
