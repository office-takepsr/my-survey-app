'use client';

import { useMemo, useState } from 'react';

type Meta = {
  departments: { name: string }[];
  questionsByScale: Record<string, { question_code: string; question_text: string }[]>;
  choices: {
    gender: string[];
    ageBand: string[];
    likert: { value: number; label: string }[];
  };
};

const EMPLOYEE_CODE_RE = /^[A-Za-z0-9]{3,20}$/;
const SCALE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

// サーバー・クライアント両方で安全にURLを取得する関数
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // ブラウザなら相対パス
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
};

export default function SurveyForm({
  surveyCode,
  meta,
}: {
  surveyCode: string;
  meta: Meta;
}) {
  const [employeeCode, setEmployeeCode] = useState('');
  const [departmentName, setDepartmentName] = useState(meta.departments?.[0]?.name ?? '');
  const [gender, setGender] = useState('未回答');
  const [ageBand, setAgeBand] = useState('未回答');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const allQuestions = useMemo(() => {
    const list: { code: string; text: string; scale: string }[] = [];
    for (const s of SCALE_ORDER) {
      const qs = meta.questionsByScale?.[s] ?? [];
      for (const q of qs) list.push({ code: q.question_code, text: q.question_text, scale: s });
    }
    return list;
  }, [meta]);

  const requiredQuestionCodes = useMemo(() => allQuestions.map((q) => q.code), [allQuestions]);

  function normalizeEmployeeCode(s: string) {
    return s.trim().toUpperCase();
  }

  function setAnswer(code: string, value: number) {
    setAnswers((prev) => ({ ...prev, [code]: value }));
  }

  function validate(): string | null {
    const normalized = normalizeEmployeeCode(employeeCode);
    if (!EMPLOYEE_CODE_RE.test(normalized)) {
      return '社員IDは半角英数字3〜20文字で入力してください（例：A00123）';
    }
    if (!departmentName) return '部署を選択してください。';
    const missing = requiredQuestionCodes.filter((c) => !(c in answers));
    if (missing.length > 0) return '未回答の設問があります。すべて回答してください。';
    return null;
  }

  async function onSubmit() {
    setMessage(null);
    const err = validate();
    if (err) {
      setMessage({ type: 'error', text: err });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeCode: normalizeEmployeeCode(employeeCode),
        departmentName,
        gender,
        ageBand,
        answers,
      };

      // 修正ポイント：getBaseUrl() を使用
      const res = await fetch(`${getBaseUrl()}/api/surveys/${surveyCode}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage({ type: 'success', text: '回答を送信しました。ご協力ありがとうございました。' });
        return;
      }

      if (res.status === 409) {
        setMessage({ type: 'error', text: data.error ?? 'この社員IDは回答済みのため再回答できません。' });
      } else if (res.status === 403) {
        setMessage({ type: 'error', text: data.error ?? '回答期間外です。' });
      } else if (res.status === 404) {
        setMessage({ type: 'error', text: data.error ?? 'サーベイが見つかりません。' });
      } else {
        setMessage({ type: 'error', text: data.error ?? '送信に失敗しました。時間をおいて再度お試しください。' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ marginTop: 16 }}>
      {/* ... (以下、既存のJSXコードと同じ) ... */}
