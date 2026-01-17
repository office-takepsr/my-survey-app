// lib/getSurveyData.ts (新しく作るのがおすすめ)
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function getSurveyMeta(surveyCode: string) {
  // survey取得
  const { data: survey, error: surveyErr } = await supabaseAdmin
    .from('surveys')
    .select('code, name, start_at, end_at, status')
    .eq('code', surveyCode)
    .single();

  if (surveyErr || !survey) return null;

  // 部署取得
  const { data: departments } = await supabaseAdmin
    .from('departments')
    .select('name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // 設問取得
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('question_code, scale, question_text, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (!departments || !questions) return null;

  // まとめる処理
  const questionsByScale: any = { A: [], B: [], C: [], D: [], E: [], F: [] };
  for (const q of questions) {
    if (questionsByScale[q.scale]) {
      questionsByScale[q.scale].push({
        question_code: q.question_code,
        question_text: q.question_text,
      });
    }
  }

  return {
    survey,
    departments,
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
