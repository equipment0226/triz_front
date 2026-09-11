import React from 'react';
import { ArrowDown, ArrowRight, ArrowLeftRight, Atom, BookOpen, Boxes, CheckCheck, CircleDot, Clock, Combine, Copy, Expand, Flag, Focus, GitBranch, Layers3, Lightbulb, ListOrdered, MapPin, Maximize2, Microscope, Minimize2, Network, ScanLine, Search, ShieldAlert, Split, Target, Undo2, Users, Waves, Zap } from 'lucide-react';

const parts = {
  1:{label:'갈등을 좁혀 문제를 정의합니다',layout:'sequence',icons:[Minimize2,Users,GitBranch,Target,Maximize2,Focus,Expand],output:'선택한 갈등과 미니문제'},
  2:{label:'어디서 · 언제 · 무엇으로',layout:'map',icons:[MapPin,Clock,Boxes,ListOrdered],output:'작용 영역·시간과 우선 자원'},
  3:{label:'이상적 결과에서 모순의 핵심으로',layout:'converge',icons:[Target,ShieldAlert,Layers3,Microscope,Focus,BookOpen],output:'IFR-2와 해소해야 할 물리적 모순'},
  4:{label:'이미 있는 자원에서 해결 수단을 찾습니다',layout:'resource',icons:[Users,Undo2,Combine,CircleDot,GitBranch,Zap,Atom],output:'자원을 동원한 해결 단서'},
  5:{label:'네 가지 지식 경로를 문제에 연결합니다',layout:'hub',icons:[BookOpen,Copy,Split,Atom],output:'표준해·사례·원리·효과를 적용한 후보'},
  6:{label:'풀리지 않는 문제를 다시 구성합니다',layout:'loop',icons:[Split,Users,Target,Layers3],output:'변경된 문제로 분석을 다시 검토'},
  7:{label:'해결안이 통과해야 할 네 가지 검토',layout:'gates',icons:[Target,ArrowLeftRight,ShieldAlert,CheckCheck],output:'모순 해소·유해작용·제약을 확인한 안'},
  8:{label:'한 해결안의 쓰임을 넓힙니다',layout:'spread',icons:[Network,Zap,Copy],output:'상위 시스템·초효과·다른 문제의 적용 가능성'},
  9:{label:'분석 과정을 되짚어 교훈을 남깁니다',layout:'reflect',icons:[ScanLine,Flag],output:'표준 흐름과의 차이, 결정적인 스텝'},
};

export function ArizPartDiagram({ part }) {
  const config=parts[part.id];
  return <figure className={`ariz-part-diagram ariz-layout-${config.layout}`} aria-label={`ARIZ Part ${part.id} ${part.title} 스텝 흐름`}>
    <figcaption><span>PART {String(part.id).padStart(2,'0')} / STEP MAP</span><h3>{config.label}</h3></figcaption>
    {['hub','spread','resource'].includes(config.layout) && <div className="ariz-diagram-origin"><Lightbulb size={19}/><span>{part.id===5?'정의된 문제와 필요한 기능':part.id===8?'도출된 해결안':'문제 해결에 필요한 작용'}</span><ArrowDown size={16}/></div>}
    <ol className="ariz-diagram-steps">{part.steps.map((step,index) => {
      const Icon=config.icons[index] || Search;
      return <li key={step.code} className={step.required?'required':'optional'}><a href={`#ariz-step-${step.code}`}><div className="ariz-step-top"><Icon size={22}/><span>{step.code}</span></div><strong>{step.title}</strong><small>{step.required?'필수':'선택'}</small></a>{['sequence','converge','loop','gates','reflect'].includes(config.layout) && index<part.steps.length-1 && <ArrowRight className="ariz-step-arrow" size={16} aria-hidden="true"/>}</li>;
    })}</ol>
    <div className="ariz-diagram-output">{part.id===6?<Undo2 size={17}/>:part.id===9?<Flag size={17}/>:<ArrowDown size={17}/>}<span>{config.output}</span></div>
    <p className="ariz-diagram-note">스텝을 누르면 아래의 해당 항목으로 이동합니다. 선택 스텝은 문제에 따라 적용합니다.</p>
  </figure>;
}
