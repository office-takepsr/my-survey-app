import SurveyForm from './SurveyForm';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ surveyCode: string }> }) {
  const { surveyCode } = await params;

  // --- 1. サーバーサイドで直接データを取得（fetchは使わない） ---
  
  // サーベイ基本情報
  const { data: survey } = await supabaseAdmin
    .from('surveys')
    .select('code, name, start_at, end_at, status')
    .eq('code', surveyCode)
    .single();

  if (!survey) {
    return notFound(); // 404ページを表示
  }

  // 部署一覧
  const { data: departments } = await supabaseAdmin
    .from('departments')
    .select('name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // 設問一覧
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('question_code, scale, question_text, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // --- 2. データを整形 ---
  
  const questionsByScale: any = { A: [], B: [], C: [], D: [], E: [], F: [] };
  questions?.forEach((q) => {
    if (questionsByScale[q.scale]) {
      questionsByScale[q.scale].push({
        question_code: q.question_code,
        question_text: q.question_text,
      });
    }
  });

  const meta = {
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

  // --- 3. レンダリング ---
  
  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <h1>{meta.survey?.name ?? 'サーベイ回答'}</h1>
      <p style={{ color: '#555' }}>
        実施期間：{new Date(meta.survey.start_at).toLocaleString('ja-JP')} 〜{' '}
        {new Date(meta.survey.end_at).toLocaleString('ja-JP')}
      </p>
      {/* 取得したデータをそのまま Client Component へ渡す */}
      <SurveyForm surveyCode={surveyCode} meta={meta} />
    </main>
  );
}
