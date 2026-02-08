import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ========== 型（必要最低限） ==========
type ResponseItemInput = {
  question_code: string; // "A-1", "F-3" など
  raw_score: number;     // 1..6
};

type SubmitPayload = {
  survey_id: string;        // UUID想定
  employee_id: string;      // 社員ID（文字列でも可）
  department_id?: string;   // 任意（部署を保存するなら）
  // 任意属性を保存するならここに追加（gender, ageなど）
  items: ResponseItemInput[];
};

// ========== ユーティリティ ==========
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isIntInRange(v: unknown, min: number, max: number): v is number {
  return Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
}

function calcScoredScore(questionCode: string, raw: number) {
  // 例: F尺度だけ逆転 (7 - raw)。コード体系が "F-1" など前提
  const isF = questionCode.toUpperCase().startsWith("F-");
  return isF ? 7 - raw : raw;
}

// Postgresの unique violation
function isUniqueViolation(err: any): boolean {
  // Postgres: 23505 = unique_violation
  return err?.code === "23505";
}

export async function POST(req: Request) {
  try {
    // 1) JSONパース
    const body = (await req.json()) as Partial<SubmitPayload>;

    // 2) 入力チェック（必須）
    if (!isNonEmptyString(body.survey_id)) {
      return NextResponse.json({ error: "survey_id は必須です" }, { status: 400 });
    }
    if (!isNonEmptyString(body.employee_id)) {
      return NextResponse.json({ error: "employee_id（社員ID）は必須です" }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "items は1件以上必要です" }, { status: 400 });
    }

    // itemsのチェック（コード・スコア範囲）
    for (const [i, it] of body.items.entries()) {
      if (!isNonEmptyString(it?.question_code)) {
        return NextResponse.json(
          { error: `items[${i}].question_code が不正です` },
          { status: 400 }
        );
      }
      if (!isIntInRange(it?.raw_score, 1, 6)) {
        return NextResponse.json(
          { error: `items[${i}].raw_score は1〜6の整数である必要があります` },
          { status: 400 }
        );
      }
    }

    // 3) survey期間チェック
    // surveys: { id, starts_at, ends_at, status } を想定（列名はあなたのDBに合わせて変更）
    const now = new Date();

    const { data: survey, error: surveyErr } = await supabaseAdmin
      .from("surveys")
      .select("id, starts_at, ends_at, status")
      .eq("id", body.survey_id)
      .single();

    if (surveyErr || !survey) {
      return NextResponse.json({ error: "survey が見つかりません" }, { status: 404 });
    }

    // statusの考え方は自由。例として "open" のみ受付
    if (survey.status && survey.status !== "open") {
      return NextResponse.json({ error: "このsurveyは回答受付中ではありません" }, { status: 400 });
    }

    const startsAt = survey.starts_at ? new Date(survey.starts_at) : null;
    const endsAt = survey.ends_at ? new Date(survey.ends_at) : null;

    if (startsAt && now < startsAt) {
      return NextResponse.json({ error: "回答期間前です" }, { status: 400 });
    }
    if (endsAt && now > endsAt) {
      return NextResponse.json({ error: "回答期間が終了しています" }, { status: 400 });
    }

    // 4) responses（ヘッダ）insert
    // responses: { id, survey_id, employee_id, answered_at } を想定
    // ※ ここで (survey_id, employee_id) UNIQUE が効いて重複はDBが弾く
    const { data: responseRow, error: responseErr } = await supabaseAdmin
      .from("responses")
      .insert({
        survey_id: body.survey_id,
        employee_id: body.employee_id,
        answered_at: now.toISOString(),
        // department_id を responses に持たせるならここに入れる
        department_id: body.department_id ?? null,
      })
      .select("id")
      .single();

    if (responseErr) {
      // 5) 重複エラー処理（ユニーク制約）
      if (isUniqueViolation(responseErr)) {
        return NextResponse.json(
          { error: "このsurveyでは既に回答済みです" },
          { status: 409 }
        );
      }
      // その他DBエラー
      return NextResponse.json(
        { error: "responses 保存に失敗しました", detail: responseErr.message },
        { status: 500 }
      );
    }

    const responseId = responseRow.id as string;

    // 6) response_items 作成（F逆転 7-raw を計算して scored_score に保存）
    const itemsToInsert = body.items.map((it) => ({
      response_id: responseId,
      question_code: it.question_code,
      raw_score: it.raw_score,
      scored_score: calcScoredScore(it.question_code, it.raw_score),
    }));

    const { error: itemsErr } = await supabaseAdmin
      .from("response_items")
      .insert(itemsToInsert);

    if (itemsErr) {
      // ここで失敗するとヘッダだけ残る可能性がある（MVPなら許容/後で掃除）
      // 本番で堅くするなら「DB関数（RPC）+ トランザクション」で一括処理が推奨
      return NextResponse.json(
        { error: "response_items 保存に失敗しました", detail: itemsErr.message },
        { status: 500 }
      );
    }

    // 7) 成功レスポンス
    return NextResponse.json(
      { ok: true, response_id: responseId },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "不正なリクエストです", detail: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}
