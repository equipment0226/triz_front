import React from 'react';
import { GuideVisual } from './GuideVisual';
import { GuideLink } from './GuideLink';
import { SafeLink } from './Shared';

export function SeparationReference({ approach, kind, principles, go, chapter }) {
  const ids = approach.principles || [];
  const unrestricted = approach.selection_policy === 'UNRESTRICTED';
  const link = id => <GuideLink key={id} go={go} to={{material:'principles',principle:String(id),...(chapter ? {chapter:chapter.id} : {})}}>#{id} {principles[id]?.name_ko} ↗</GuideLink>;
  const rows = [
    ['정의 · 검토 기준', approach.description],
    ['핵심 질문', approach.question],
    ['적용 조건', approach.conditions],
    ['한계 · 검토사항', approach.limitations],
    ['발명원리 선택', unrestricted ? '공식 권장 목록은 비어 있습니다. 40가지 발명원리 전체에서 필요한 원리를 검토할 수 있습니다.' : '아래 권장 원리를 먼저 검토합니다. 다른 원리를 선택할 때는 적용 근거를 확인합니다.'],
  ].filter(([, value]) => value);
  return <div className="separation-reference">
    <div className="entry-tags"><span>{approach.family === 'SEPARATE' || !approach.family ? '분리원리' : '보완 접근'}</span>{approach.family === 'SATISFY' && <span>동시 충족</span>}{approach.family === 'BYPASS' && <span>우회</span>}</div>
    <figure className="separation-reference-diagram"><GuideVisual kind="separation" selected={kind} title={`${approach.name_ko}의 개념도`}/><figcaption>접근의 작동 방식을 설명하는 개념도 · <a href={`/knowledge/separation/${kind.toLowerCase()}.svg`} target="_blank" rel="noopener noreferrer">크게 보기 ↗</a></figcaption></figure>
    <div className="guide-table-scroll" tabIndex="0" role="region" aria-label={`${approach.name_ko} 상세`}><table className="entry-table"><caption>정의와 적용 검토</caption><tbody>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table></div>
    <div className="separation-recommendations"><h3>권장 발명원리</h3>{ids.length ? <div className="principle-links">{ids.map(link)}</div> : <p>지정된 권장 발명원리 없음{unrestricted ? ' · 전체 40가지 원리 검토 가능' : ''}</p>}<p className="reference-scope">권장 목록은 탐색을 돕는 자료입니다. 실제 분석에서 사용한 원리는 해당 해결안의 적용 기록에서 확인합니다.</p></div>
    {unrestricted && <details className="separation-all-principles"><summary>검토 가능한 40가지 발명원리 보기</summary><div className="principle-links">{Object.keys(principles).sort((a,b) => Number(a)-Number(b)).map(link)}</div></details>}
    {approach.source_url && <div className="entry-sources"><span>출처</span><SafeLink href={approach.source_url}>MATRIZ · {approach.source_section || approach.name_en || approach.name_ko} ↗</SafeLink>{approach.source_accessed_on && <small>대조일 {approach.source_accessed_on}</small>}</div>}
    {approach.catalog_version && <p className="reference-version">자료 버전 · {approach.catalog_version}</p>}
  </div>;
}
