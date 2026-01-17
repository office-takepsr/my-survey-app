import SurveyForm from './SurveyForm';
import { getSurveyMeta } from '@/lib/getSurveyData'; // 上で作った関数をインポート

export default async function Page({ params }: { params: Promise<{ surveyCode: string }> }) {
  const { surveyCode } = await params;

  // ★ fetch をやめて直接関数を呼ぶ！
  const meta = await getSurveyMeta(surveyCode);

  if (!meta) {
    return (
      <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
        <h1>サーベイが見つかりません</h1>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <h1>{meta.survey?.name ?? 'サーベイ回答'}</h1>
      <p style={{ color: '#555' }}>
        実施期間：{new Date(meta.survey.start_at).toLocaleString('ja-JP')} 〜{' '}
        {new Date(meta.survey.end_at).toLocaleString('ja-JP')}
      </p>
      {/* Client Component にデータを渡す */}
      <SurveyForm surveyCode={surveyCode} meta={meta} />
    </main>
  );
}
