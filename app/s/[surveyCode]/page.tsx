import SurveyForm from './SurveyForm';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // supabaseAdminをインポート
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ surveyCode: string }>;
}) {
  const { surveyCode } = await params;

  // ❌ APIをfetchするのをやめる
  // ✅ 直接DBから取得する
  const { data: survey, error } = await supabaseAdmin
    .from('surveys')
    .select('*')
    .eq('code', surveyCode)
    .single();

  // エラーハンドリング
  if (error || !survey) {
    const msg = error ? '読み込みに失敗しました' : 'サーベイが見つかりません';
    return (
      <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
        <h1>サーベイ回答</h1>
        <p>{msg}</p>
      </main>
    );
  }

  // APIのレスポンス形式に合わせて meta オブジェクトを模倣
  const meta = { survey };

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <h1>{survey.name ?? 'サーベイ回答'}</h1>
      <p style={{ color: '#555' }}>
        実施期間：{new Date(survey.start_at).toLocaleString('ja-JP')} 〜{' '}
        {new Date(survey.end_at).toLocaleString('ja-JP')}
      </p>
      <SurveyForm surveyCode={surveyCode} meta={meta} />
    </main>
  );
}
