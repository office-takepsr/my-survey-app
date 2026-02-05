import SurveyForm from './SurveyForm';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // supabaseAdminをインポート
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ surveyCode: string }>;
}) {
  const { surveyCode } = await params;

// APIのレスポンス形式に合わせて meta オブジェクトを作成
  // Date型が含まれているとクライアントに渡す際にクラッシュするため、文字列に変換する
  const meta = {
    survey: {
      ...survey,
      start_at: new Date(survey.start_at).toISOString(),
      end_at: new Date(survey.end_at).toISOString(),
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <h1>{survey.name ?? 'サーベイ回答'}</h1>
      {/* ここでも Date に変換して表示 */}
      <p style={{ color: '#555' }}>
        実施期間：{new Date(survey.start_at).toLocaleString('ja-JP')} 〜{' '}
        {new Date(survey.end_at).toLocaleString('ja-JP')}
      </p>
      {/* プレーンなオブジェクトになった meta を渡す */}
      <SurveyForm surveyCode={surveyCode} meta={meta} />
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
