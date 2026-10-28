/* =====================================================================
   app.js — SpineLog 화면
   화면은 DB를 직접 만지지 않고, 항상 api("방식", "/api/주소", 보낼값)로만 데이터를 주고받는다.
   (실제 서비스에서 React 화면이 FastAPI를 부르는 것과 같은 구조)
   ===================================================================== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const view = () => $("#view");
const LEVEL_TEXT = { CONTRAINDICATED: "금기", CAUTION: "주의", RECOMMENDED: "추천" };
const STATUS_TEXT = { COMPLETED: "판정 완료", PARTIAL: "부분 판정", NO_MATCH: "맞는 규칙 없음" };
const MISSING_TEXT = { CONDITION: "질환 정보", MORNING_CHECKIN: "오늘 체크인" };
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
let TZ = "Asia/Seoul";

function dateLabel(ymd) { const d = new Date(ymd + "T00:00:00Z"); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEK[d.getUTCDay()]})`; }
function timeLabel(iso) { return new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)); }
function hm(min) { if (min == null) return "-"; const h = Math.floor(min / 60), m = min % 60; return m ? `${h}시간 ${m}분` : `${h}시간`; }
function toast(msg, bad = false) {
  const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (bad ? " bad" : "");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.className = "toast", 2600);
}
function errText(r) { const d = r.data && r.data.detail; return typeof d === "string" ? d : "입력값을 확인해 주세요"; }
function statusBadge(s) { return s ? `<span class="badge st-${s}">${STATUS_TEXT[s]}</span>` : ""; }

/* ---------- 판정 결과 카드 (저장 직후 · 기록 상세가 같이 씀) ---------- */
function resultCard(r, { withExercise = true } = {}) {
  const warn = r.pain_score >= 7 ? `<div class="alert red"><b>통증 ${r.pain_score}점 · 심각 범주</b><br>지금은 운동보다 안정이 우선입니다. 통증이 계속되면 진료를 받으세요. <span class="muted">(현재 기준: 7점 이상)</span></div>` : "";
  const missing = r.missing_context && r.missing_context.length
    ? `<p class="muted small">빠진 자료: ${r.missing_context.map(m => MISSING_TEXT[m] || m).join(", ")} → 채우면 더 정확한 판정</p>` : "";
  const guides = r.guides.map(g => `
    <div class="guide">
      <span class="lv lv-${g.level_code}">${g.level_label}</span>
      <div class="gbody"><b>${esc(g.exercise_name)}</b><span class="rule">규칙 ${g.rule_id}</span>
        <p>${esc(g.message)}</p>
        ${withExercise && g.level_code !== "CONTRAINDICATED" ? `<a class="link" href="#exercise?guide=${g.guide_id}&ex=${g.exercise_id}">이 운동 했어요 →</a>` : ""}
      </div>
    </div>`).join("");
  return `
    <div class="card result">
      <div class="row between"><div class="score-sm">${r.pain_score}<small>/10</small></div>${statusBadge(r.assessment_status)}</div>
      <p class="muted small">${esc(r.pain_location_name)} · ${esc(r.pain_type_name)} · ${timeLabel(r.recorded_at)}</p>
      ${warn}
      <p><b>${esc(r.severity_label)}</b> · ${esc(r.action_guide)}</p>
      ${missing}
      ${r.basic_guide ? `<div class="alert">${esc(r.basic_guide)}</div>` : ""}
      ${guides ? `<h3>오늘의 운동 판정</h3>${guides}` : ""}
    </div>`;
}

/* ---------- 7일 추이 그래프 (SVG) ---------- */
function trendChart(days) {
  const W = 320, H = 130, L = 22, R = 8, T = 12, B = 24, n = days.length;
  const x = i => L + (W - L - R) * (n === 1 ? .5 : i / (n - 1)), y = v => T + (H - T - B) * (1 - v / 10);
  let path = "", pts = "";
  days.forEach((d, i) => {
    if (d.avg == null) return;
    const prev = i > 0 && days[i - 1].avg != null;
    path += `${prev ? "L" : "M"}${x(i).toFixed(1)},${y(d.avg).toFixed(1)} `;
    pts += `<circle cx="${x(i).toFixed(1)}" cy="${y(d.avg).toFixed(1)}" r="4" class="pt${d.avg >= 7 ? " hi" : ""}"><title>${d.date} 평균 ${d.avg}점 (${d.count}회)</title></circle>
            <text x="${x(i).toFixed(1)}" y="${(y(d.avg) - 9).toFixed(1)}" class="lbl">${d.avg}</text>`;
  });
  const grid = [0, 5, 10].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="axis" text-anchor="end">${v}</text>`).join("");
  const band = `<rect x="${L}" y="${y(10)}" width="${W - L - R}" height="${y(7) - y(10)}" class="band"/>`;
  const xl = days.map((d, i) => `<text x="${x(i)}" y="${H - 6}" class="axis" text-anchor="middle">${+d.date.slice(8)}</text>`).join("");
  const empty = days.every(d => d.avg == null) ? `<text x="${W / 2}" y="${H / 2}" class="axis" text-anchor="middle">아직 기록이 없어요</text>` : "";
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="최근 7일 통증 평균">${band}${grid}<path d="${path}" class="line"/>${pts}${xl}${empty}</svg>`;
}
function bar(val, goal) { const p = val == null ? 0 : Math.min(100, Math.round(val / goal * 100)); return `<div class="bar"><i style="width:${p}%"></i></div>`; }

/* =========================== 화면들 =========================== */
const SCREENS = {

  /* ---- 처음 방문 ---- */
  async welcome() {
    view().innerHTML = `
      <div class="hero-card">
        <div class="eyebrow">SpineLog · 브라우저 데모</div>
        <h1>오늘 해도 되는 운동,<br>규칙으로 판정합니다</h1>
        <p>통증 · 아침 체크인 · 활동을 기록하면, DB에 저장된 규칙 19개로 운동을 <b>추천 · 주의 · 금기</b>로 판정합니다.</p>
      </div>
      <div class="card">
        <h3>어떻게 시작할까요?</h3>
        <button class="btn primary block" id="startDemo">시연 상태로 시작</button>
        <p class="muted small">척추전방전위증 2등급 + 다리 저림, 지난 6일치 체크인 · 통증 기록이 들어갑니다.</p>
        <button class="btn block" id="startSelf">내 상태를 직접 입력</button>
      </div>
      <p class="muted small center">기록은 이 브라우저에만 저장됩니다 · 수업용 시연이며 의료 조언이 아닙니다</p>`;
    $("#startDemo").onclick = async () => {
      await api("PUT", "/api/me/conditions", [{ condition_id: 3, disease_grade: 2 }]);
      await api("PUT", "/api/me/symptoms", [{ symptom_id: 1, severity_level: 2 }]);
      makeSample(); location.hash = "#home"; toast("시연 상태로 시작했어요");
    };
    $("#startSelf").onclick = () => { location.hash = "#me"; };
  },

  /* ---- 홈 (GET /api/dashboard) ---- */
  async home() {
    const r = await api("GET", "/api/dashboard"), d = r.data;
    const todo = d.todo.map(t => `<a class="todo" href="${t.code === "CONDITION" ? "#me" : "#checkin"}"><span>${esc(t.message)}</span><b>→</b></a>`).join("");
    const last = d.pain.last;
    const counts = last ? ["CONTRAINDICATED", "CAUTION", "RECOMMENDED"].map(c => `<span class="lv lv-${c}">${LEVEL_TEXT[c]} ${last.guide_counts[c] || 0}</span>`).join("") : "";
    const ck = d.checkin;
    view().innerHTML = `
      <div class="greet"><div class="muted">${dateLabel(d.date)}</div><h1>오늘의 허리 상태</h1></div>
      ${todo ? `<div class="todos">${todo}</div>` : ""}
      <a class="card link-card" href="${last ? `#log/${last.log_id}` : "#pain"}">
        <div class="row between"><h3>오늘 통증</h3>${last ? statusBadge(last.assessment_status) : ""}</div>
        ${last ? `<div class="row between"><div class="score-sm">${last.pain_score}<small>/10</small></div><div class="muted small right">${esc(last.severity_label)}<br>오늘 ${d.pain.today_count}번 기록</div></div>
                  <div class="row wrap">${counts}</div>`
               : `<p class="muted">아직 기록이 없어요. 지금 통증을 기록하고 운동 판정을 받아 보세요.</p><span class="btn primary">통증 기록하기</span>`}
      </a>
      <div class="card">
        <div class="row between"><h3>최근 7일 통증</h3><a class="link small" href="#records">기록 보기 →</a></div>
        ${trendChart(d.pain_trend_7d)}
        <p class="muted small">점 = 그날 평균 · 빨간 띠 = 7점 이상(심각 범주)</p>
      </div>
      <div class="grid2">
        <a class="card link-card" href="#checkin"><h3>수면</h3>
          ${ck ? `<div class="big">${hm(ck.sleep_minutes)}</div>${bar(ck.sleep_minutes, ck.sleep_goal)}<p class="muted small">목표 ${hm(ck.sleep_goal)} ${ck.sleep_ok ? "· 달성" : ""}</p>`
               : `<p class="muted small">체크인 전</p>`}</a>
        <a class="card link-card" href="#checkin"><h3>전날 걸음</h3>
          ${ck && ck.prev_day_steps != null ? `<div class="big">${ck.prev_day_steps.toLocaleString()}</div>${bar(ck.prev_day_steps, ck.steps_goal)}<p class="muted small">목표 ${ck.steps_goal.toLocaleString()}보 ${ck.steps_ok ? "· 달성" : ""}</p>`
               : `<p class="muted small">기록 없음</p>`}</a>
        <a class="card link-card" href="#activity"><h3>오늘 활동</h3><div class="big">${d.activity.today_minutes}<small>분</small></div><p class="muted small">${d.activity.today_count}건</p></a>
        <a class="card link-card" href="#exercise"><h3>오늘 운동</h3><div class="big">${d.exercise.today_count}<small>회</small></div><p class="muted small">판정 보고 한 운동</p></a>
      </div>
      <div class="card soft"><h3>의학 콘텐츠</h3><p class="muted small">API는 준비됐고, 질환별 내용은 출처와 함께 작성 중입니다.</p></div>`;
  },

  /* ---- 통증 기록 (GET /api/pain-options → POST /api/pain-logs) ---- */
  async pain() {
    const o = (await api("GET", "/api/pain-options")).data;
    view().innerHTML = `
      <div class="greet"><div class="muted">POST /api/pain-logs</div><h1>지금 통증 기록</h1></div>
      <div class="card">
        <h3>얼마나 아픈가요?</h3>
        <div class="row between"><div class="score" id="sv">5</div><div class="right"><b id="sl"></b><div class="muted small" id="sr"></div></div></div>
        <input type="range" id="score" min="0" max="10" value="5" class="range">
        <div class="row between muted small"><span>0 통증 없음</span><span>10 최악</span></div>
        <p class="hint" id="sg"></p>
      </div>
      <div class="card">
        <h3>어디가 아픈가요?</h3>
        <select id="loc" class="input">${o.locations.map(l => `<option value="${l.location_id}">${esc(l.location_name)}</option>`).join("")}</select>
        <h3>어떤 느낌인가요?</h3>
        <div class="chips" id="types">${o.types.map((t, i) => `<label class="chip${i === 0 ? " on" : ""}"><input type="radio" name="typ" value="${t.pain_type_id}" ${i === 0 ? "checked" : ""}>${esc(t.pain_type_name)}</label>`).join("")}</div>
      </div>
      <button class="btn primary block lg" id="save">저장하고 판정 받기</button>`;
    const show = () => { const s = o.scale.find(x => x.pain_score === +$("#score").value);
      $("#sv").textContent = s.pain_score; $("#sl").textContent = s.level_name; $("#sr").textContent = `${s.severity_label} · ${s.nrs_range}`; $("#sg").textContent = s.action_guide;
      $("#sv").className = "score" + (s.pain_score >= 7 ? " hi" : ""); };
    $("#score").oninput = show; show();
    $("#types").onchange = e => { document.querySelectorAll("#types .chip").forEach(c => c.classList.toggle("on", c.querySelector("input").checked)); };
    $("#save").onclick = async () => {
      const r = await api("POST", "/api/pain-logs", { pain_score: +$("#score").value, pain_location_id: +$("#loc").value,
        pain_type_id: +document.querySelector("input[name=typ]:checked").value });
      if (!r.ok) return toast(errText(r), true);
      location.hash = `#log/${r.data.log_id}?new=1`;
    };
  },

  /* ---- 기록 1건 (GET /api/pain-logs/{id}) ---- */
  async log(id, q) {
    const r = await api("GET", `/api/pain-logs/${id}`);
    if (!r.ok) { view().innerHTML = `<div class="card"><p>${esc(errText(r))}</p><a class="btn" href="#records">기록으로</a></div>`; return; }
    view().innerHTML = `
      <div class="greet"><div class="muted">${q.new ? "POST /api/pain-logs → 201" : `GET /api/pain-logs/${id}`}</div><h1>${q.new ? "저장했어요" : "기록 상세"}</h1></div>
      ${resultCard(r.data)}
      <p class="muted small">${q.new ? "판정 결과는 기록과 함께 저장되어, 나중에 다시 봐도 그때 받은 판정 그대로 보입니다." : "규칙을 다시 돌리지 않고, 저장된 그때의 판정을 보여 줍니다."}</p>
      <div class="row"><a class="btn" href="#home">홈으로</a><a class="btn" href="#records">기록 목록</a></div>`;
  },

  /* ---- 날짜별 기록 (GET /api/pain-logs?date=) ---- */
  async records(_, q) {
    const me = (await api("GET", "/api/me")).data, today = localDate(new Date().toISOString(), me.timezone);
    const d = q.date || today, r = (await api("GET", `/api/pain-logs?date=${d}`)).data;
    view().innerHTML = `
      <div class="greet"><div class="muted">GET /api/pain-logs?date=${d}</div><h1>통증 기록</h1></div>
      <div class="row between datebar"><a class="btn sm" href="#records?date=${addDays(d, -1)}">←</a><b>${dateLabel(d)}</b>
        ${d < today ? `<a class="btn sm" href="#records?date=${addDays(d, 1)}">→</a>` : `<span class="btn sm off">→</span>`}</div>
      ${r.items.length ? r.items.map(i => `
        <a class="card link-card row between" href="#log/${i.log_id}">
          <div class="row"><div class="score-xs${i.pain_score >= 7 ? " hi" : ""}">${i.pain_score}</div><div><b>${esc(i.pain_location_name)}</b><div class="muted small">${esc(i.pain_type_name)} · ${timeLabel(i.recorded_at)}</div></div></div>
          <div class="right">${statusBadge(i.assessment_status)}<div class="muted small">판정 ${i.guide_count}개</div></div>
        </a>`).join("") : `<div class="card"><p class="muted">이 날은 기록이 없어요.</p></div>`}
      <p class="muted small">날짜는 ${esc(r.timezone)} 기준으로 나눕니다 (저장은 UTC).</p>`;
  },

  /* ---- 아침 체크인 (PUT /api/checkins/today, GET /api/checkins) ---- */
  async checkin() {
    const list = (await api("GET", "/api/checkins?days=7")).data, today = list.items[list.items.length - 1];
    const sm = today.sleep_minutes ?? 420;
    view().innerHTML = `
      <div class="greet"><div class="muted">${dateLabel(list.today)} · PUT /api/checkins/today</div><h1>아침 체크인</h1></div>
      <div class="card">
        <h3>지난밤 수면</h3>
        <div class="row"><input type="number" id="sh" class="input num" min="0" max="24" value="${Math.floor(sm / 60)}"><span>시간</span>
          <input type="number" id="smin" class="input num" min="0" max="59" step="10" value="${sm % 60}"><span>분</span></div>
        <h3>전날 걸음 수 <span class="muted small">(선택)</span></h3>
        <div class="row"><input type="number" id="steps" class="input" min="0" max="100000" step="100" placeholder="예: 5200" value="${today.prev_day_steps ?? ""}"><span>보</span></div>
        <button class="btn primary block" id="save">${today.sleep_minutes != null ? "고치기" : "저장"}</button>
        <p class="muted small">하루에 한 번 저장됩니다. 다시 저장하면 오늘 기록을 고칩니다. 체크인이 있어야 통증 판정이 '부분 판정'이 아닌 '판정 완료'가 됩니다.</p>
      </div>
      <div class="card"><h3>최근 7일</h3>
        <div class="week">${list.items.map(c => `<div class="day${c.sleep_minutes != null ? " on" : ""}"><span>${WEEK[new Date(c.checkin_date + "T00:00:00Z").getUTCDay()]}</span><b>${c.sleep_minutes != null ? (c.sleep_minutes / 60).toFixed(1) : "-"}</b><small>${c.sleep_minutes != null ? "시간" : ""}</small></div>`).join("")}</div>
      </div>`;
    $("#save").onclick = async () => {
      const steps = $("#steps").value === "" ? null : +$("#steps").value;
      const r = await api("PUT", "/api/checkins/today", { sleep_minutes: (+$("#sh").value) * 60 + (+$("#smin").value), prev_day_steps: steps });
      if (!r.ok) return toast(errText(r), true);
      toast("체크인을 저장했어요"); SCREENS.checkin();
    };
  },

  /* ---- 활동 기록 (activity-options · activity-types · activity-logs) ---- */
  async activity() {
    const o = (await api("GET", "/api/activity-options")).data, list = (await api("GET", "/api/activity-logs")).data;
    const now = new Intl.DateTimeFormat("en-GB", { timeZone: list.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    view().innerHTML = `
      <div class="greet"><div class="muted">${dateLabel(list.date)} · POST /api/activity-logs</div><h1>활동 기록</h1></div>
      <div class="card">
        <h3>무엇을 했나요?</h3>
        ${o.activity_types.length ? `<div class="chips" id="atypes">${o.activity_types.map((t, i) => `<label class="chip${i === 0 ? " on" : ""}"><input type="radio" name="at" value="${t.activity_type_id}" ${i === 0 ? "checked" : ""}>${esc(t.type_label)}</label>`).join("")}</div>`
          : `<p class="muted small">아직 활동 종류가 없어요. 아래에서 먼저 만들어 주세요.</p>`}
        <div class="row"><label class="field">시작<input type="time" id="start" class="input" value="${now}"></label>
          <label class="field">시간(분)<input type="number" id="dur" class="input" min="1" max="1440" value="60"></label>
          <label class="field">강도<select id="inten" class="input"><option value="">-</option>${[1, 2, 3, 4, 5].map(i => `<option>${i}</option>`).join("")}</select></label></div>
        <button class="btn primary block" id="save" ${o.activity_types.length ? "" : "disabled"}>활동 저장</button>
      </div>
      <div class="card">
        <h3>오늘 한 활동 <span class="muted small">총 ${list.total_minutes}분</span></h3>
        ${list.items.length ? list.items.map(a => `<div class="item"><div><b>${esc(a.type_label)}</b> <span class="muted small">${timeLabel(a.started_at)} · ${a.duration_minutes}분${a.intensity ? ` · 강도 ${a.intensity}` : ""}</span></div>
          <div class="row wrap">${a.tags.map(t => `<span class="tag">${esc(t.tag_label)}</span>`).join("")}</div></div>`).join("") : `<p class="muted small">아직 없어요.</p>`}
        <p class="muted small">어제~오늘 활동의 동작 태그는 통증 판정 때 '최근 동작'으로 쓰입니다. (지금 규칙 중 동작 조건을 쓰는 규칙은 아직 0개)</p>
      </div>
      <details class="card"><summary><b>새 활동 종류 만들기</b> <span class="muted small">POST /api/activity-types</span></summary>
        <input id="tlabel" class="input" placeholder="예: 장거리 운전, 이삿짐 나르기" maxlength="60">
        <p class="muted small">이 활동에 들어 있는 동작을 고르세요</p>
        <div class="chips" id="tags">${o.movement_tags.map(t => `<label class="chip" title="${esc(t.description)}"><input type="checkbox" value="${t.tag_id}">${esc(t.tag_label)}</label>`).join("")}</div>
        <button class="btn block" id="mk">만들기</button>
      </details>`;
    document.querySelectorAll(".chips").forEach(c => c.onchange = () => c.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x.querySelector("input").checked)));
    $("#mk").onclick = async () => {
      const r = await api("POST", "/api/activity-types", { type_label: $("#tlabel").value, tag_ids: [...document.querySelectorAll("#tags input:checked")].map(i => +i.value) });
      if (!r.ok) return toast(errText(r), true);
      toast("활동 종류를 만들었어요"); SCREENS.activity();
    };
    if (o.activity_types.length) $("#save").onclick = async () => {
      const r = await api("POST", "/api/activity-logs", { activity_type_id: +document.querySelector("input[name=at]:checked").value,
        started_at: zonedToUTC(list.date, $("#start").value || "00:00", list.timezone), duration_minutes: +$("#dur").value,
        intensity: $("#inten").value ? +$("#inten").value : null });
      if (!r.ok) return toast(errText(r), true);
      toast("활동을 저장했어요"); SCREENS.activity();
    };
  },

  /* ---- 운동 수행 기록 (POST /api/exercise-logs) ---- */
  async exercise(_, q) {
    const list = (await api("GET", "/api/exercise-logs")).data;
    const gid = q.guide ? +q.guide : null, exId = q.ex ? +q.ex : REF.exercises[0].id;
    view().innerHTML = `
      <div class="greet"><div class="muted">POST /api/exercise-logs</div><h1>운동 기록</h1></div>
      <div class="card">
        ${gid ? `<p class="muted small">판정 #${gid}을 보고 한 운동으로 기록합니다.</p>` : ""}
        <h3>어떤 운동?</h3>
        <select id="ex" class="input" ${gid ? "disabled" : ""}>${REF.exercises.map(e => `<option value="${e.id}" ${e.id === exId ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select>
        <div class="grid2 tight">
          <label class="field">운동 전 통증 <b id="bv">5</b><input type="range" id="before" min="0" max="10" value="5" class="range"></label>
          <label class="field">운동 후 통증 <b id="av">4</b><input type="range" id="after" min="0" max="10" value="4" class="range"></label>
        </div>
        <label class="field">운동 시간(분)<input type="number" id="dur" class="input" min="0" max="600" value="15"></label>
        <button class="btn primary block" id="save">기록하기</button>
      </div>
      <div id="out"></div>
      <div class="card"><h3>오늘 한 운동</h3>
        ${list.items.length ? list.items.map(e => `<div class="item row between"><div><b>${esc(e.exercise_name)}</b> <span class="muted small">${timeLabel(e.performed_at)}${e.guide_level_label ? ` · ${e.guide_level_label} 판정` : ""}</span></div>
          <span class="${e.pain_change > 0 ? "up" : e.pain_change < 0 ? "down" : "muted"}">${e.pain_before} → ${e.pain_after}</span></div>`).join("") : `<p class="muted small">아직 없어요. 홈의 판정 결과에서 '이 운동 했어요'를 누르면 바로 올 수 있어요.</p>`}
      </div>`;
    $("#before").oninput = () => $("#bv").textContent = $("#before").value;
    $("#after").oninput = () => $("#av").textContent = $("#after").value;
    $("#save").onclick = async () => {
      const r = await api("POST", "/api/exercise-logs", { exercise_id: +$("#ex").value, guide_id: gid, pain_before: +$("#before").value,
        pain_after: +$("#after").value, duration_minutes: +$("#dur").value });
      if (!r.ok) return toast(errText(r), true);
      await SCREENS.exercise(null, {});
      $("#out").innerHTML = `<div class="card ${r.data.notices.length ? "warn" : "ok"}"><b>저장했어요 · 통증 ${r.data.pain_before} → ${r.data.pain_after} (${r.data.pain_change > 0 ? "+" : ""}${r.data.pain_change})</b>
        ${r.data.notices.map(n => `<p>${esc(n)}</p>`).join("")}${r.data.pain_change > 0 ? `<a class="btn primary" href="#pain">지금 통증 다시 기록</a>` : ""}</div>`;
    };
  },

  /* ---- 내 정보 (GET /api/me, PUT /api/me/…) ---- */
  async me() {
    const me = (await api("GET", "/api/me")).data, opt = (await api("GET", "/api/profile-options")).data;
    const cg = Object.fromEntries(me.conditions.map(c => [c.condition_id, c.disease_grade])), ss = new Set(me.symptoms.map(s => s.symptom_id));
    const zones = ["Asia/Seoul", "Asia/Tokyo", "America/New_York", "America/Los_Angeles", "Europe/London", "Australia/Sydney"];
    view().innerHTML = `
      <div class="greet"><div class="muted">GET /api/me · PUT /api/me/…</div><h1>내 정보</h1></div>
      <div class="card"><h3>질환 <span class="muted small">판정의 기준 · 등급은 Meyerding 등</span></h3>
        ${opt.conditions.map(c => `<div class="crow${c.condition_id in cg ? " on" : ""}"><label><input type="checkbox" data-c="${c.condition_id}" ${c.condition_id in cg ? "checked" : ""}> ${esc(c.disease_name)}</label>
          <select data-g="${c.condition_id}" class="input sm" ${c.condition_id in cg ? "" : "disabled"}><option value="">등급 없음</option>${[1, 2, 3, 4, 5].map(g => `<option ${cg[c.condition_id] == g ? "selected" : ""}>${g}</option>`).join("")}</select></div>`).join("")}
        <h3>증상</h3>
        <div class="chips">${opt.symptoms.map(s => `<label class="chip${ss.has(s.symptom_id) ? " on" : ""}"><input type="checkbox" data-s="${s.symptom_id}" ${ss.has(s.symptom_id) ? "checked" : ""}>${esc(s.symptom_name)}</label>`).join("")}</div>
        <button class="btn primary block" id="saveCond">질환 · 증상 저장</button>
      </div>
      <div class="card"><h3>목표</h3>
        <div class="row"><label class="field">수면(분)<input type="number" id="gs" class="input" value="${me.goals.target_sleep_minutes}"></label>
          <label class="field">걸음(보)<input type="number" id="gw" class="input" step="500" value="${me.goals.target_steps}"></label></div>
        <h3>시간대 <span class="muted small">'오늘'을 계산하는 기준</span></h3>
        <select id="tz" class="input">${zones.map(z => `<option ${z === me.timezone ? "selected" : ""}>${z}</option>`).join("")}</select>
        <button class="btn block" id="saveGoal">목표 · 시간대 저장</button>
      </div>
      <div class="card soft"><h3>데모 데이터</h3>
        <div class="row wrap"><button class="btn" id="sample">지난 6일 샘플 넣기</button><button class="btn danger" id="reset">모두 지우기</button></div>
        <p class="muted small">기록은 이 브라우저(localStorage)에만 저장되고 서버로 가지 않습니다.</p>
      </div>
      <a class="card link-card row between" href="about.html"><div><b>프로젝트 소개</b><div class="muted small">구조 · API · 실행 결과 · 진행 상황</div></div><b>→</b></a>`;
    document.addEventListener("change", onMeChange);
    $("#saveCond").onclick = async () => {
      const conds = [...document.querySelectorAll("input[data-c]:checked")].map(i => { const g = document.querySelector(`select[data-g="${i.dataset.c}"]`).value; return { condition_id: +i.dataset.c, disease_grade: g ? +g : null }; });
      const r1 = await api("PUT", "/api/me/conditions", conds); if (!r1.ok) return toast(errText(r1), true);
      const r2 = await api("PUT", "/api/me/symptoms", [...document.querySelectorAll("input[data-s]:checked")].map(i => ({ symptom_id: +i.dataset.s })));
      if (!r2.ok) return toast(errText(r2), true);
      toast("질환 · 증상을 저장했어요");
    };
    $("#saveGoal").onclick = async () => {
      const r = await api("PUT", "/api/me/goals", { target_sleep_minutes: +$("#gs").value, target_steps: +$("#gw").value }); if (!r.ok) return toast(errText(r), true);
      const t = await api("PUT", "/api/me/timezone", { timezone: $("#tz").value }); if (!t.ok) return toast(errText(t), true);
      TZ = t.data.timezone; toast("저장했어요");
    };
    $("#sample").onclick = () => { makeSample(); toast("샘플 기록을 넣었어요"); location.hash = "#home"; };
    $("#reset").onclick = () => { if (confirm("이 브라우저의 SpineLog 기록을 모두 지울까요?")) { resetDB(); TZ = "Asia/Seoul"; location.hash = "#welcome"; } };
  },
};
function onMeChange(e) {
  const t = e.target;
  if (t.dataset && t.dataset.c) { const g = document.querySelector(`select[data-g="${t.dataset.c}"]`); if (g) g.disabled = !t.checked; t.closest(".crow").classList.toggle("on", t.checked); }
  if (t.dataset && t.dataset.s) t.closest(".chip").classList.toggle("on", t.checked);
}

/* ---------- API 기록 보기 (화면이 실제로 부른 API) ---------- */
function renderDev() {
  $("#devList").innerHTML = API_LOG.map(l => `<details><summary><span class="m m-${l.method}">${l.method}</span> <span class="mono">${esc(l.url)}</span> <b class="${l.status < 300 ? "okc" : "bad"}">${l.status}</b> <span class="muted small">${l.at}</span></summary>
    ${l.method !== "GET" ? `<div class="muted small">보낸 값</div><pre>${esc(JSON.stringify(l.body, null, 2))}</pre>` : ""}<div class="muted small">응답</div><pre>${esc(JSON.stringify(l.data, null, 2))}</pre></details>`).join("") || `<p class="muted small">아직 호출이 없어요</p>`;
}

/* ---------- 주소(#) 따라 화면 바꾸기 ---------- */
async function route() {
  document.removeEventListener("change", onMeChange);
  const raw = location.hash.slice(1) || "", [pathPart, qs] = raw.split("?"), q = Object.fromEntries(new URLSearchParams(qs || ""));
  const [name, arg] = pathPart.split("/");
  const db = loadDB(); TZ = db.user.timezone;
  let screen = name || (db.onboarded ? "home" : "welcome");
  if (!SCREENS[screen]) screen = "home";
  document.querySelectorAll(".tabbar a").forEach(a => a.classList.toggle("on", a.dataset.tab === ({ log: "home", records: "home", exercise: "home", welcome: "home" }[screen] || screen)));
  await SCREENS[screen](arg, q);
  window.scrollTo(0, 0);
  if ($("#dev").open) renderDev();
}
window.addEventListener("hashchange", route);
$("#dev").addEventListener("toggle", () => { if ($("#dev").open) renderDev(); });
route();
window.onApiLog = () => { if ($("#dev").open) renderDev(); };
