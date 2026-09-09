import React from 'react';
import {Check,FlaskConical,Layers3,Network,ShieldCheck,ChartNoAxesCombined,UserRound} from 'lucide-react';

const icons=[FlaskConical,Layers3,Network,ShieldCheck,ChartNoAxesCombined,UserRound];

export function ProblemDefinition({view}) {
  const constraints=view.constraints || [];
  const reviewers=view.reviewers || [];
  return <div className="definition-content">
    <div className="panel">
      <p className="eyebrow">PROBLEM FRAME</p>
      <h2>문제의 경계를 함께 정리합니다</h2>
      <p>{view.problem || view.query}</p>
      {constraints.length>0 && <>
        <h4>지켜야 할 조건</h4>
        <ul className="clean-list">{constraints.map((constraint,i)=><li key={i}><Check size={15}/>{constraint}</li>)}</ul>
      </>}
    </div>
    {reviewers.length>0 && <div className="panel">
      <h3>이 문제를 검토하는 전문가</h3>
      <div className="reviewers">{reviewers.map((reviewer,i)=>{
        const avatar=icons[reviewer.avatar] ? reviewer.avatar : 0;
        const Icon=icons[avatar];
        return <article key={i}>
          <span className={'avatar tone'+avatar}><UserRound size={24}/><Icon size={12} className="expertise-badge"/></span>
          <div><b>{reviewer.role}</b><p>{reviewer.mandate}</p></div>
        </article>;
      })}</div>
    </div>}
  </div>;
}
