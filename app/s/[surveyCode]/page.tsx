import SurveyForm from './SurveyForm';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// 1. API route.ts に書いていたロジックを直接ここに持ってくる（または別ファイルから呼ぶ）
async function getSurveyData(surveyCode: string) {
  const { data: survey } = await supabaseAdmin
    .from('surveys')
    .select('code, name, start_at, end_at, status')
    .eq('code', surveyCode)
    .single();

  if (!survey) return null;

  const { data: departments } = await supabaseAdmin
    .from('departments')
    .select('name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('question_code, scale, question_text, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const questionsByScale: any = { A: [], B: [], C: [], D: [], E: [], F: [] };
  questions?.forEach((q) => {
    if (questionsByScale[q.scale]) {
      questionsByScale[q.scale].push({
        question_code: q.question_code,
        question_text: q.question_text,
      });
    }
  });

  return {
    survey,
    departments: departments || [],
    questionsByScale,
    choices: {
      gender: ['未回答', '男性', '女性', 'その他', '回答しない'],
      ageBand: ['未回答', '〜20代', '30代', '40代', '50代', '60代〜'],
      likert: [
        { value: 1, label: '全くあてはまらない（1）' },
        { value: 2, label: 'あてはまらない（2）' },
        { value: 3, label: 'ややあてはまらない（3）' },
        { value: 4, label: 'ややあてはまる（4）' },
        { value: 5, label: 'あてはまる（5）' },
        { value: 6, label: '非常にあてはまる（6）' },
      ],
    },
  };
}

// 2. Page本体
export default async function Page({ params }: { params: Promise<{ surveyCode: string }> }) {
  const { surveyCode } = await params;

  // 重要：fetch は絶対に使わない！直接関数を呼ぶ
  const meta = await getSurveyData(surveyCode);

  if (!meta) {
    return <div>サーベイが見つかりません</div>;
  }

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <h1>{meta.survey?.name}</h1>
      {/* データを SurveyForm に渡す */}
      <SurveyForm surveyCode={surveyCode} meta={meta} />
    </main>
  );
}
