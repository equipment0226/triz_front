import React from 'react';
import { SafeLink } from './Shared';

const applicationTags = {MISSING_S2:'도구 누락',MISSING_F:'장 누락',INCOMPLETE:'불완전',USEFUL_INSUFFICIENT:'유익 작용 부족',EXCESSIVE:'과잉 작용',HARMFUL:'유해 작용',SYSTEM_LIMIT:'시스템 한계',PHYSICAL_CONTRADICTION:'물리적 모순',MEASUREMENT:'검출·측정',RESOURCE_LIMIT:'자원 제약'};

export function ReferenceSources({ sources = [], className = 'standard-reference' }) {
  if (!sources.length) return null;
  return <div className={className}><span>원문 참고</span>{sources.map((source, index) => <SafeLink key={`${source.url}-${index}`} href={source.url}>{source.title}{source.section ? ` · ${source.section}` : ''} ↗</SafeLink>)}</div>;
}

export function StandardDiagram({ standard, detailKey, title }) {
  const src = `/diagrams/standards/${standard.code}${detailKey ? `--${detailKey}` : ''}.svg`;
  const label = title || `${standard.code} ${standard.title_ko}`;
  return <figure className={detailKey ? 'standard-detail-diagram' : 'standard-specific-diagram'}>
    <div className="standard-diagram-scroll" tabIndex="0" role="region" aria-label={`${label} 개념도`}>
      <img key={src} src={src} loading={detailKey ? 'lazy' : undefined} alt={`${label}의 개념 구조도`}/>
    </div>
    <figcaption>설명을 위한 개념도 · <a href={src} target="_blank" rel="noopener noreferrer">구조도 크게 보기 ↗</a><small>작은 화면에서는 그림을 좌우로 움직여 볼 수 있습니다.</small></figcaption>
  </figure>;
}

function Alternative({ standard, entry, index, official }) {
  const title = `${official ? entry.code : `대안 ${index + 1}`} · ${entry.title_ko}`;
  return <details className="standard-alternative" data-standard-detail={official ? entry.code : `variant-${index + 1}`}>
    <summary><span>{official ? entry.code : `대안 ${index + 1}`}</span><strong>{entry.title_ko}</strong></summary>
    <div className="standard-alternative-body">
      <dl className="standard-detail-fields"><dt>모델 변환</dt><dd>{entry.transformation}</dd><dt>적용 조건</dt><dd>{entry.conditions}</dd></dl>
      <StandardDiagram standard={standard} detailKey={official ? `sub-${entry.code}` : `variant-${index + 1}`} title={title}/>
      <ReferenceSources sources={entry.sources}/>
    </div>
  </details>;
}

export function StandardDetailSections({ standard, collection }) {
  const review = standard.source_review;
  return <>
    {standard.applicability?.length > 0 && <div className="standard-search-tags"><small>탐색용 분류 · 적용 조건 충족 판정과 구분</small><div className="entry-tags">{standard.applicability.map(tag => <span key={tag}>{applicationTags[tag] || '기타 적용 유형'}</span>)}</div></div>}
    {standard.substandards?.length > 0 && <section className="standard-expansion" aria-label="공식 하위 방법">
      <h3>공식 하위 방법 <span>{standard.substandards.length}</span></h3>
      <p>원전에 부여된 하위 번호입니다. 각 방법의 조건을 확인해 적용할 대안을 고릅니다.</p>
      {standard.substandards.map((entry, index) => <Alternative key={entry.code} standard={standard} entry={entry} index={index} official/>)}
    </section>}
    {standard.variants?.length > 0 && <section className="standard-expansion" aria-label="분기와 대안">
      <h3>분기와 대안 <span>{standard.variants.length}</span></h3>
      <p>부모 표준해의 서로 다른 적용 경로입니다. 아래 대안 순번은 공식 표준해 번호가 아닙니다.</p>
      {standard.variants.map((entry, index) => <Alternative key={index} standard={standard} entry={entry} index={index}/>)}
    </section>}
    {standard.development_sequence?.length > 0 && <section className="standard-expansion" aria-label="발전·적용 순서">
      <h3>발전·적용 순서</h3>
      <ol className="standard-development">{standard.development_sequence.map((step, index) => <li key={index}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
      <StandardDiagram standard={standard} detailKey="sequence" title={`${standard.code} 발전·적용 순서`}/>
    </section>}
    <details className="standard-source-review">
      <summary>원문 대조와 해석 메모 <span>{standard.verified ? '원문 대조됨' : '원문 대조 필요'}</span></summary>
      <div>
        {standard.verification_scope && <p>{standard.verification_scope}</p>}
        {standard.notes && <p>{standard.notes}</p>}
        {review && <dl className="standard-detail-fields">
          <dt>대조 범위</dt><dd>표준해 {review.section || standard.code}</dd>
          <dt>대조 결과</dt><dd>{review.result === 'corrected' ? '대조 후 정정' : review.result === 'confirmed' ? '원문과 일치 확인' : '항목별 기록 확인'} · {review.checked_at}</dd>
          <dt>확인·정정 내용</dt><dd>{review.summary}</dd>
          <dt>교차 대조</dt><dd>{review.cross_check}</dd>
          <dt>원문 도식 확인</dt><dd>{review.diagram_review}</dd>
          {review.primary_url && <><dt>1차 원전</dt><dd><SafeLink href={review.primary_url}>알츠슐러 원전의 해당 항목 보기 ↗</SafeLink></dd></>}
        </dl>}
        {collection.version && <p className="reference-version">자료 버전 · {collection.version}</p>}
        {collection.note && <p className="reference-scope">{collection.note}</p>}
      </div>
    </details>
  </>;
}
