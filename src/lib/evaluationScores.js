const DIMENSIONS = {
  FEASIBILITY: {label: '구현성', aliases: ['구현성', '구현가능성', '실현가능성', '실현성', '실행가능성']},
  QUALITY: {label: '품질', aliases: ['품질', '품질성']},
  RISK: {label: '위험 관리', aliases: ['위험', '위험관리', '리스크', '리스크관리']},
  COST: {label: '비용', aliases: ['비용', '코스트']},
  TIME: {label: '소요 시간', aliases: ['시간', '소요시간', '기간']},
  GOAL: {label: '목표 기여도', aliases: ['목표', '목표기여도', '목표달성도']},
  RESOLUTION: {label: '모순 해소', aliases: ['모순해소', '모순해결', '모순해소도']},
  CAUSAL: {label: '인과 근거', aliases: ['인과근거', '인과성', '인과타당성']},
  ADOPTION: {label: '도입성', aliases: ['도입성', '수용성', '현장수용성']},
  SAFETY: {label: '안전', aliases: ['안전', '안전성']},
  SCALABILITY: {label: '확장성', aliases: ['확장성']},
};
const normalize = value => value.trim().toUpperCase().replace(/[\s_-]+/g, '');
const aliases = new Map(Object.entries(DIMENSIONS).flatMap(([key, value]) =>
  [key, ...value.aliases].map(alias => [normalize(alias), key])));

export function evaluationScores(dimensions = {}) {
  const grouped = new Map();
  for (const [rawKey, score] of Object.entries(dimensions || {})) {
    if (typeof score !== 'number' || !Number.isFinite(score)) continue;
    const key = aliases.get(normalize(rawKey)) || normalize(rawKey);
    if (!key) continue;
    // Prefer the stored canonical score when legacy aliases also exist.
    if (!grouped.has(key) || rawKey === key) {
      grouped.set(key, {key, label: DIMENSIONS[key]?.label || rawKey.trim(), score});
    }
  }
  return [...grouped.values()];
}
