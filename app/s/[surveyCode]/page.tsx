import SurveyForm from './SurveyForm';
// APIの中身と同じ処理をする関数をインポート
import { getSurveyMeta } from '@/lib/api-logic'; 

export default async function Page({ params }: { params: Promise<{ surveyCode: string }> }) {
  const { surveyCode } = await params;

  // ❌ fetch は使わない
  // const res = await fetch(`${base}/api/surveys/${surveyCode}/meta`, ...);
  
  // ✅ 直接ロジックを呼び出す（これが一番速くて安全）
  try {
    const meta = await getSurveyMeta(surveyCode);

    if (!meta) {
      return <main><h1>サーベイが見つかりません</h1></main>;
    }

    return (
      <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
        <h1>{meta.survey?.name ?? 'サーベイ回答'}</h1>
        {/* ...中略... */}
        <SurveyForm surveyCode={surveyCode} meta={meta} />
      </main>
    );
  } catch (error) {
    return <main><h1>読み込みに失敗しました</h1></main>;
  }
}
