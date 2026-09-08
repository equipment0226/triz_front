import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers3,
  CircleDot,
  Network,
  MoveUpRight,
  Plus,
  Paperclip,
  X,
  Check,
  ChevronRight,
  Download,
  Search,
  BookOpen,
  FlaskConical,
  ShieldCheck,
  Lightbulb,
  UserRound,
  ChartNoAxesCombined,
  RefreshCw,
  Send,
} from "lucide-react";
import { api, post } from "../lib/api";
import { SafeLink, Bot, Empty, ReportSections, ReferenceCard, SearchStatus } from "../components/Shared";
const icons = [
  FlaskConical,
  Layers3,
  Network,
  ShieldCheck,
  ChartNoAxesCombined,
  UserRound,
];
const statusLabel = {
  CREATED: "분석 준비",
  QUEUED: "분석 대기",
  RUNNING: "분석 중",
  WAITING_HUMAN: "의견 확인",
  COMPLETED: "완료",
  FAILED: "재시도 필요",
  INTERRUPTED: "일시 중단",
};
function Intake({ seed, onCreated, onError }) {
  const [query, setQuery] = useState(seed),
    [mode, setMode] = useState("FULL"),
    [files, setFiles] = useState([]),
    [publicConsent, setPublicConsent] = useState(false),
    [busy, setBusy] = useState(false);
  const fileRef = useRef();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = new FormData();
      data.append("query", query);
      data.append("mode", mode);
      data.append("public_consent", String(publicConsent));
      files.forEach((f) => data.append("files", f));
      const res = await api("/runs", { method: "POST", body: data });
      onCreated(res.run_id);
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="section intake">
      <div className="section-top">
        <div>
          <p className="eyebrow">PROBLEM SOLVING</p>
          <h1>어떤 문제를 함께 풀어볼까요?</h1>
          <p className="lead">
            현상과 목표를 설명해 주세요. 필요한 정보는 대화하며 채워갑니다.
          </p>
        </div>
        <span className="pill">
          <span className="dot" /> 새로운 프로젝트
        </span>
      </div>
      <div className="intake-grid">
        <form className="panel input-panel" onSubmit={submit}>
          <label htmlFor="problem">해결하고 싶은 문제</label>
          <textarea
            id="problem"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={20000}
            required
            placeholder="어떤 시스템에서, 어떤 문제가 발생하나요? 개선하고 싶은 목표와 유지해야 할 조건을 함께 알려 주세요."
          />
          <div className="input-bottom">
            <button
              type="button"
              className="button subtle"
              onClick={() => fileRef.current.click()}
            >
              <Paperclip size={16} /> 참고 자료 첨부
            </button>
            <span>{query.length.toLocaleString()} / 20,000</span>
            <input
              ref={fileRef}
              type="file"
              hidden
              multiple
              accept=".pdf,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                const incoming = [...e.target.files];
                if (
                  incoming.some((f) => f.size > 25 * 1024 * 1024) ||
                  files.length + incoming.length > 8
                ) {
                  onError("파일당 25MB, 최대 8개까지 첨부해 주세요.");
                  return;
                }
                setFiles([...files, ...incoming]);
                e.target.value = "";
              }}
            />
          </div>
          {files.length > 0 && (
            <div className="files">
              {files.map((f, i) => (
                <span key={i}>
                  <Paperclip size={12} />
                  {f.name}
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, j) => i !== j))}
                    aria-label={f.name + " 제거"}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="hint">
            무료 베타 기간에 제출한 문제와 분석 결과는 Sample Case에 공개됩니다.
            사양서, 공정 데이터, 도면을 함께 주시면 분석이 더 구체적이 됩니다.
            PDF·Excel·이미지, 파일당 25MB까지.
          </p>
          <fieldset>
            <legend>분석 깊이</legend>
            <div className="modes">
              {[
                ["LITE", "빠른 탐색", "핵심 기법으로 방향 찾기"],
                ["FULL", "표준 분석", "다양한 관점으로 구체화"],
                ["DEEP", "심층 분석", "ARIZ를 포함한 고난도 탐색"],
              ].map(([id, title, desc]) => (
                <label className={mode === id ? "selected" : ""} key={id}>
                  <input
                    type="radio"
                    name="mode"
                    value={id}
                    checked={mode === id}
                    onChange={() => setMode(id)}
                  />
                  <b>{title}</b>
                  <small>{desc}</small>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="public-consent"><input type="checkbox" required checked={publicConsent} onChange={e => setPublicConsent(e.target.checked)} />
            무료 베타에서 입력한 문제·자료의 분석 내용·해결안·보고서가 Sample Case를 통해 비회원에게도 공개되는 데 동의합니다.</label>
          <button
            disabled={busy || !query.trim() || !publicConsent}
            className="button dark full"
            type="submit"
          >
            {busy ? "프로젝트를 준비하고 있어요" : "AI와 문제 분석 시작"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
        <aside className="intake-aside">
          <Bot />
          <h3>좋은 분석을 위한 작은 힌트</h3>
          <ol>
            <li>
              <b>지금 어떤 일이 일어나나요?</b>
              <p>불량, 지연, 손실처럼 관찰한 현상을 알려 주세요.</p>
            </li>
            <li>
              <b>무엇을 개선하고 싶나요?</b>
              <p>가능하면 기준값과 목표, 측정 단위를 적어 주세요.</p>
            </li>
            <li>
              <b>어떤 조건을 지켜야 하나요?</b>
              <p>
                예산, 재료, 설비, 환경 등 바꿀 수 없는 조건이 도움이 됩니다.
              </p>
            </li>
          </ol>
          <p className="hint">
            아직 몰라도 괜찮아요.
            <br />첫 단계에서 함께 확인할게요.
          </p>
        </aside>
      </div>
    </div>
  );
}

export function Workspace({ selected, seed, onCreated, onError }) {
  const [view, setView] = useState(null),
    [tab, setTab] = useState("분석 현황"),
    [busy, setBusy] = useState(false),
    [instruction, setInstruction] = useState(""),
    [stage, setStage] = useState(""),
    [role, setRole] = useState("");
  const refresh = async () => {
    try {
      setView(await api(`/runs/${selected}/view`));
    } catch (e) {
      onError(e.message);
    }
  };
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const update = async () => {
      try {
        const v = await api(`/runs/${selected}/view`);
        if (active) setView(v);
      } catch (e) {
        if (active) onError(e.message);
      }
    };
    update();
    const timer = setInterval(update, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selected]);
  async function act(path, body = {}) {
    setBusy(true);
    try {
      await post(`/runs/${selected}/${path}`, body);
      await refresh();
      return true;
    } catch (e) {
      onError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!selected)
    return <Intake seed={seed} onCreated={onCreated} onError={onError} />;
  if (!view)
    return (
      <div className="empty">
        <Bot />
        <p>프로젝트를 불러오고 있어요.</p>
      </div>
    );
  const paused = !["RUNNING", "QUEUED"].includes(view.status);
  return (
    <div className="section workspace">
      <div className="project-heading">
        <div>
          <p className="eyebrow">YOUR THINKING WORKSPACE</p>
          <h1>{view.title}</h1>
          <p className="muted">
            {view.industry || "업종 확인 중"}
            {view.system ? " / " + view.system : ""}
          </p>
        </div>
        <span className={"pill status-" + view.status}>
          {statusLabel[view.status]}
        </span>
      </div>
      <div className="work-grid">
        <aside className="stage-nav">
          <span className="eyebrow">PROJECT JOURNEY</span>
          {view.stages.map((s, i) => (
            <button
              key={s.key}
              onClick={() => {
                setStage(s.key);
                setTab("분석 현황");
              }}
              className={
                (i === view.stage_index ? "current " : "") +
                (i < view.stage_index ? "complete" : "")
              }
            >
              <span>
                {i < view.stage_index ? (
                  <Check size={13} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              {s.label}
            </button>
          ))}
          <div className="stage-footer">
            <ShieldCheck size={17} />
            <small>분석 결과는 단계마다 저장됩니다.</small>
          </div>
        </aside>
        <div className="work-main">
          <div className="guide">
            <Bot small />
            <div>
              <b>트리와 함께하는 문제 해결</b>
              <p aria-live="polite">{view.guide}</p>
            </div>
            {["FAILED", "INTERRUPTED", "QUEUED"].includes(view.status) && (
              <button
                className="button subtle"
                disabled={busy}
                onClick={() => act("continue")}
              >
                <RefreshCw size={15} /> 이어서 실행
              </button>
            )}
          </div>
          <div className="tabs">
            {["분석 현황", "해결안", "보고서", "피드백"].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "분석 현황" && (
            <>
              <SearchStatus status={view.search_status} />
              {view.pending && (
                <HumanInput
                  key={view.pending.interrupt_id}
                  pending={view.pending}
                  busy={busy}
                  submit={(payload) =>
                    act("resume", {
                      payload: {
                        ...payload,
                        interrupt_id: view.pending.interrupt_id,
                      },
                    })
                  }
                />
              )}
              <div className="panel">
                <p className="eyebrow">PROBLEM FRAME</p>
                <h2>문제의 경계를 함께 정리합니다</h2>
                <p>{view.problem || view.query}</p>
                {view.constraints.length > 0 && (
                  <>
                    <h4>지켜야 할 조건</h4>
                    <ul className="clean-list">
                      {view.constraints.map((c, i) => (
                        <li key={i}>
                          <Check size={15} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              {view.reviewers.length > 0 && (
                <div className="panel">
                  <h3>이 문제를 검토하는 전문가</h3>
                  <div className="reviewers">
                    {view.reviewers.map((p, i) => {
                      const Icon = icons[p.avatar];
                      return (
                        <article key={i}>
                          <span className={"avatar tone" + p.avatar}>
                            <UserRound size={24} />
                            <Icon size={12} className="expertise-badge" />
                          </span>
                          <div>
                            <b>{p.role}</b>
                            <p>{p.mandate}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="panel">
                <h3>분석에 의견 더하기</h3>
                <p className="muted">
                  확인할 단계를 선택하고 보완할 내용이나 전문가 관점을 알려
                  주세요.
                </p>
                <label>
                  검토할 단계
                  <select
                    value={
                      stage ||
                      view.stages[
                        Math.min(view.stage_index, view.stages.length - 1)
                      ].key
                    }
                    onChange={(e) => setStage(e.target.value)}
                  >
                    {view.stages.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  보완 의견
                  <textarea
                    rows={3}
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="예: 표면 반응과 재료 손상 메커니즘을 더 자세히 검토해 주세요."
                  />
                </label>
                <label>
                  추가 전문가 (선택)
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="예: 반도체 표면화학 전문가"
                  />
                </label>
                <button
                  className="button dark"
                  disabled={busy || !paused || !instruction.trim()}
                  onClick={async () => {
                    const key =
                      stage ||
                      view.stages[
                        Math.min(view.stage_index, view.stages.length - 1)
                      ].key;
                    setBusy(true);
                    try {
                      if (role.trim())
                        await post(`/runs/${selected}/inject-agent`, {
                          node: "stage:" + key,
                          role_name: role,
                          instruction,
                        });
                      await post(`/runs/${selected}/rerun`, {
                        stage: key,
                        instruction,
                      });
                      await refresh();
                      return true;
                    } catch (e) {
                      onError(e.message);
                      return false;
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  의견 반영해 다시 검토 <RefreshCw size={15} />
                </button>
                {!paused && (
                  <p className="hint">
                    분석이 사용자 확인 단계에 도달하면 의견을 반영할 수 있어요.
                  </p>
                )}
              </div>
            </>
          )}
          {tab === "해결안" && <Solutions view={view} />}
          {tab === "보고서" &&
            (view.report_ready ? (
              <>
                <div className="panel report-cover">
                  <p className="eyebrow">TRIZ PROJECT REPORT</p>
                  <h2>{view.title}</h2>
                  <p>{view.summary || view.problem}</p>
                  <div className="actions">
                    <a
                      className="button dark"
                      href={`/api/runs/${selected}/report?format=html`}
                    >
                      <Download size={16} /> 보고서 다운로드
                    </a>

                  </div>
                  <p className="hint">
                    HTML 보고서는 브라우저에서 열어 인쇄하거나 PDF로 저장할 수
                    있습니다.
                  </p>
                </div>
                <ReportSections sections={view.report_sections} />
              </>
            ) : (
              <Empty text="분석과 검토를 마치면 도식과 근거를 담은 보고서가 완성됩니다." />
            ))}
          {tab === "피드백" && (view.report_ready ? <Feedback solutions={view.solutions} submit={payload => act("feedback", payload)} busy={busy} /> : <Empty text="분석과 보고서가 완성되면 해결안을 평가할 수 있습니다." />)}
        </div>
      </div>
    </div>
  );
}

function HumanInput({ pending, busy, submit }) {
  const p = pending.payload;
  const [answers, setAnswers] = useState((p.questions || []).map(() => ""));
  const [candidate, setCandidate] = useState(p.candidates?.[0]?.id || "");
  const [amend, setAmend] = useState("");
  const [decisions, setDecisions] = useState({});
  const [industry, setIndustry] = useState(
    p.industry_profile?.industry_id || "",
  );
  const [difficulty, setDifficulty] = useState(
    p.industry_profile?.difficulty || "advanced",
  );
  if (pending.kind === "FEEDBACK")
    return (
      <div className="panel question-panel">
        <h3>보고서가 준비되었어요</h3>
        <p>보고서 탭에서 결과를 검토하고, 피드백 탭에서 의견을 남겨 주세요.</p>
        <button
          className="button subtle"
          disabled={busy}
          onClick={() => submit({})}
        >
          피드백은 나중에 남기고 완료
        </button>
      </div>
    );
  return (
    <form
      className="panel question-panel"
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          pending.kind === "CLARIFY"
            ? { answers, industry_id: industry, difficulty }
            : pending.kind === "CONFIRM"
              ? { candidate_id: candidate, amendment: amend }
              : { decisions },
        );
      }}
    >
      <span className="eyebrow">LET’S THINK TOGETHER</span>
      <h2>{pending.title}</h2>
      {p.deep_dive && (
        <div className="field-pair">
          <label>
            산업 분류
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {p.industries.map((i) => (
                <option value={i.id} key={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            검토 깊이
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="routine">일반 · 구성요소</option>
              <option value="advanced">심화 · 메커니즘</option>
              <option value="frontier">첨단 · 복합 척도</option>
            </select>
          </label>
        </div>
      )}
      {pending.kind === "CLARIFY" &&
        (p.questions || []).map((q, i) => (
          <label key={i}>
            {q.question}
            <small>{q.why_needed}</small>
            {q.proposed_answers?.length > 0 && (
              <div className="suggestions">
                {q.proposed_answers.map((a, j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() =>
                      setAnswers(answers.map((v, k) => (k === i ? a : v)))
                    }
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
            <input
              value={answers[i] || ""}
              onChange={(e) =>
                setAnswers(
                  answers.map((v, j) => (i === j ? e.target.value : v)),
                )
              }
              placeholder="모르는 항목은 비워 두셔도 됩니다."
            />
          </label>
        ))}
      {pending.kind === "CONFIRM" && (
        <>
          <div className="candidates">
            {(p.candidates || []).map((c) => (
              <label
                key={c.id}
                className={candidate === c.id ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="candidate"
                  checked={candidate === c.id}
                  onChange={() => setCandidate(c.id)}
                />
                <b>{c.name}</b>
                <p>{c.description}</p>
              </label>
            ))}
          </div>
          <label>
            대상 시스템 보완
            <input
              value={amend}
              onChange={(e) => setAmend(e.target.value)}
              placeholder="시스템 경계나 조건을 보완해 주세요."
            />
          </label>
        </>
      )}
      {pending.kind === "DECIDE" &&
        (p.conditional || []).map((c) => (
          <div className="decision" key={c.concept_id}>
            <h4>{c.title}</h4>
            <p>{c.mitigation}</p>
            <label>
              진행 판단
              <select
                required
                value={decisions[c.concept_id] || ""}
                onChange={(e) =>
                  setDecisions({ ...decisions, [c.concept_id]: e.target.value })
                }
              >
                <option value="" disabled>
                  선택해 주세요
                </option>
                <option value="accept">조건부 후보로 유지</option>
                <option value="drop">이번 제안에서 제외</option>
              </select>
            </label>
          </div>
        ))}
      <div className="actions">
        <button className="button dark" disabled={busy} type="submit">
          답변 전달하고 계속 <ArrowRight size={16} />
        </button>
        {pending.kind === "CLARIFY" && (
          <button
            className="button text"
            disabled={busy}
            type="button"
            onClick={() =>
              submit({ skip: true, answers, industry_id: industry, difficulty })
            }
          >
            현재 정보로 진행
          </button>
        )}
      </div>
    </form>
  );
}

function solutionReferences(view, c) {
  return (c.reference_cards || [
    ...(c.evidence || []).map(r => ({ ...r, description: r.mechanism })),
    ...(view.related_references || []).filter(r => r.concept_id === c.key).map(r => ({ ...r.reference, description: r.reason, status: r.status })),
  ]).filter(r => /^https?:\/\//i.test(r.url || ""));
}

export function Solutions({ view }) {
  if (!view.solutions.length)
    return (
      <Empty text="모순을 분석한 뒤 실행 가능한 해결안을 이곳에 정리할게요." />
    );
  return (
    <>
      {view.solutions.map((c, i) => (
        <article className="panel solution-card" key={c.key}>
          <div className="solution-top">
            <span className="solution-number">
              {c.rank === 99 ? "추가 도출" : String(i + 1).padStart(2, "0")}
            </span>
            <span className="pill">{c.verdict}</span>
            {c.score !== null && (
              <span className="score">
                {c.score.toFixed(1)}
                <small> / 5</small>
              </span>
            )}
          </div>
          <h2>{c.title}</h2>
          <p className="lead-small">{c.summary}</p>
          <p>{c.description}</p>
          <div className="mechanism">
            <FlaskConical size={18} />
            <p>
              <b>동작 원리</b>
              {c.mechanism}
            </p>
          </div>
          <div className="effect">
            <b>기대 효과와 가정</b>
            <p>{c.effect}</p>
          </div>
          {Object.keys(c.dimensions).length > 0 && (
            <div className="score-bars">
              {Object.entries(c.dimensions).map(([k, v]) => (
                <div key={k}>
                  <span>
                    {{
                      FEASIBILITY: "구현성",
                      QUALITY: "품질",
                      RISK: "위험 관리",
                      COST: "비용",
                      TIME: "소요 시간",
                      ADOPTION: "도입성",
                      SAFETY: "안전",
                      SCALABILITY: "확장성",
                    }[k] || "평가"}
                  </span>
                  <meter min="0" max="5" value={v} />
                  <b>{v.toFixed(1)}</b>
                </div>
              ))}
            </div>
          )}
          <details>
            <summary>
              적용 조건과 검증 계획 <Plus size={16} />
            </summary>
            <ul>
              {c.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
              {c.transfer_conditions.map((a, i) => (
                <li key={"t" + i}>{a}</li>
              ))}
            </ul>
            {c.validation.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>검증 지표</th>
                      <th>실험</th>
                      <th>반증 기준</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.validation.map((t, i) => (
                      <tr key={i}>
                        <td>{t.metric}</td>
                        <td>{t.experiment}</td>
                        <td>{t.failure_criterion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>구체적인 검증 실험을 추가로 설계해야 합니다.</p>
            )}
            <h4>남은 위험</h4>
            <ul>
              {c.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </details>
          {solutionReferences(view, c).length > 0 && <div className="references">
            <h4><BookOpen size={16} /> 관련 특허·논문</h4>
            {solutionReferences(view, c).map((r, i) => <ReferenceCard key={i} reference={r} />)}
          </div>}
        </article>
      ))}
      {view.additions.length > 0 && (
        <div className="panel">
          <p className="eyebrow">DISCOVERED IN PATENTS</p>
          <h2>특허에서 발견한 또 다른 가능성</h2>
          {view.additions.map((a, i) => (
            <article className="addition" key={i}>
              <h3>{a.title}</h3>
              <span className="pill">추가 검증 후보</span>
              <p>{a.how_it_differs}</p>
              <p>{a.validation_test}</p>
              <SafeLink href={a.reference.url}>{a.reference.title} ↗</SafeLink>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Feedback({ solutions, submit, busy }) {
  const [ratings, setRatings] = useState({}),
    [comments, setComments] = useState({}),
    [saved, setSaved] = useState(false);
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        const success = await submit({
          solution_feedback: solutions
            .filter((c) => ratings[c.key])
            .map((c) => ({
              concept_id: c.key,
              rating: Number(ratings[c.key]),
              comment: comments[c.key] || "",
              reason_tags: [],
            })),
        });
        setSaved(success !== false);
      }}
    >
      <h3>사용자의 의견이 다음 분석을 더 깊게 만듭니다</h3>
      {solutions.map((c) => (
        <div className="feedback-row" key={c.key}>
          <label>
            {c.title}
            <select
              aria-label={c.title + " 평가"}
              value={ratings[c.key] || ""}
              onChange={(e) =>
                setRatings({ ...ratings, [c.key]: e.target.value })
              }
            >
              <option value="">평가 선택</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}점
                </option>
              ))}
            </select>
          </label>
          <input
            aria-label={c.title + " 의견"}
            value={comments[c.key] || ""}
            onChange={(e) =>
              setComments({ ...comments, [c.key]: e.target.value })
            }
            placeholder="현장 적용 가능성과 보완할 점을 알려 주세요."
          />
        </div>
      ))}
      <button
        className="button dark"
        disabled={busy || !Object.values(ratings).some(Boolean)}
      >
        피드백 저장 <Send size={15} />
      </button>
      {saved && <p role="status">피드백을 전달했습니다.</p>}
    </form>
  );
}
