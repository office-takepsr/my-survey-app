export async function getSurveyMeta(surveyCode: string) {
  // ここに今のAPIの中身（Prismaの findUnique など）を書く
  const data = await db.survey.findUnique({ where: { code: surveyCode } });
  return data;
}
