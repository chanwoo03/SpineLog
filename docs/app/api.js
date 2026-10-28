/* =====================================================================
   api.js — 브라우저 안에서 돌아가는 "가짜 서버"
   ---------------------------------------------------------------------
   chanwlab.com은 웹호스팅이라 파이썬 서버(uvicorn + FastAPI)를 켤 수 없다.
   그래서 실제 백엔드와 같은 주소 · 같은 응답 모양의 API를 여기서 흉내 낸다.

     화면(app.js) ──▶ api("POST", "/api/pain-logs", {...}) ──▶ 이 파일
                                                               └▶ localStorage (= 이 브라우저만의 DB)

   나중에 NAS에 진짜 서버를 올리면, 맨 아래 api() 함수 안을
   fetch("https://서버주소" + path, ...) 로 바꾸기만 하면 화면 코드는 그대로 쓸 수 있다.

   판정 순서는 services/rule_engine.py와 같다:
     collect_context → match_rules → decide → assess_status → save
   ===================================================================== */

const DB_KEY = "spinelog-demo-v1";
const BASIC_GUIDE = "맞는 규칙이 없습니다. 가벼운 걷기를 하고, 통증이 계속되면 전문의와 상담하세요.";
const LEVEL_RANK = { CONTRAINDICATED: 3, CAUTION: 2, RECOMMENDED: 1 };
const LV = Object.fromEntries(REF.levels.map(l => [l.id, l]));
const EX = Object.fromEntries(REF.exercises.map(e => [e.id, e]));
const LOC = Object.fromEntries(REF.locations.map(l => [l.id, l]));
const TYP = Object.fromEntries(REF.types.map(t => [t.id, t]));
const TAG = Object.fromEntries(REF.tags.map(t => [t.id, t]));
const COND = Object.fromEntries(REF.conditions.map(c => [c.id, c]));
const SYM = Object.fromEntries(REF.symptoms.map(s => [s.id, s]));
const SCALE = Object.fromEntries(REF.scale.map(s => [s.score, s]));

/* ---------- DB (localStorage, 저장이 막힌 브라우저면 메모리) ---------- */
let MEM = null;
function freshDB() {
  return {
    user: { user_id: "demo", username: "시연 사용자", timezone: "Asia/Seoul" },
    goals: null, conditions: [], symptoms: [],
    pain_logs: [], guides: [], checkins: [], activity_types: [], activity_logs: [], exercise_logs: [],
    seq: { log: 0, guide: 0, atype: 0, alog: 0, exlog: 0 }, onboarded: false,
  };
}
function loadDB() {
  if (MEM) return MEM;
  try { const s = localStorage.getItem(DB_KEY); if (s) { MEM = JSON.parse(s); return MEM; } } catch (e) {}
  MEM = freshDB(); return MEM;
}
function saveDB(db) { MEM = db; try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {} }
function resetDB() { MEM = freshDB(); try { localStorage.removeItem(DB_KEY); } catch (e) {} }

/* ---------- 시간 도구 (timeutil.py와 같은 생각: 저장은 UTC, 날짜는 사용자 시간대) ---------- */
const utcNow = () => new Date(Math.floor(Date.now() / 1000) * 1000).toISOString().replace(".000Z", "Z");
function localDate(iso, tz) {                    // UTC 시각 → 사용자 시간대의 날짜 "YYYY-MM-DD"
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}
const localToday = tz => localDate(new Date().toISOString(), tz);
function addDays(ymd, n) { const d = new Date(ymd + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function tzOffsetMs(tz, ts) {                    // 그 순간 그 시간대가 UTC보다 몇 ms 빠른지
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(new Date(ts)).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ts;
}
function zonedToUTC(ymd, hm, tz) {               // "2026-10-28" + "09:00" (현지) → UTC ISO
  const [y, m, d] = ymd.split("-").map(Number), [h, mi] = hm.split(":").map(Number);
  let ts = Date.UTC(y, m - 1, d, h, mi);
  ts -= tzOffsetMs(tz, ts); ts = Date.UTC(y, m - 1, d, h, mi) - tzOffsetMs(tz, ts);
  return new Date(ts).toISOString().replace(".000Z", "Z");
}

/* ---------- 에러 (FastAPI의 HTTPException처럼) ---------- */
class ApiError extends Error { constructor(status, detail) { super(detail); this.status = status; this.detail = detail; } }
const fail = (status, detail) => { throw new ApiError(status, detail); };
const isInt = v => Number.isInteger(v);
function rangeInt(v, lo, hi, name, optional = false) {
  if (optional && (v === null || v === undefined || v === "")) return null;
  if (!isInt(v)) fail(422, `${name}: 정수를 넣어 주세요`);
  if (v < lo || v > hi) fail(422, `${name}: ${lo}~${hi} 사이여야 합니다`);
  return v;
}

/* ---------- 규칙 판정 (services/rule_engine.py) ---------- */
function collectContext(db) {
  const tz = db.user.timezone, today = localToday(tz), yesterday = addDays(today, -1);
  const grades = {}; db.conditions.forEach(c => grades[c.condition_id] = c.disease_grade);
  const symptomIds = new Set(db.symptoms.map(s => s.symptom_id));
  const recentTags = new Set();
  db.activity_logs.filter(a => localDate(a.started_at, tz) >= yesterday).forEach(a => {
    const t = db.activity_types.find(x => x.activity_type_id === a.activity_type_id);
    (t ? t.tag_ids : []).forEach(id => recentTags.add(id));
  });
  const ck = db.checkins.find(c => c.checkin_date === today);
  const sleep = ck ? ck.sleep_minutes : null;
  const missing = [];
  if (Object.keys(grades).length === 0) missing.push("CONDITION");
  if (sleep === null) missing.push("MORNING_CHECKIN");
  return { tz, grades, symptomIds, recentTags, sleep, missing };
}
function matchRules(score, ctx) {
  return REF.rules.filter(r => {
    if (r.min_pain_score !== null && score < r.min_pain_score) return false;
    if (r.max_pain_score !== null && score > r.max_pain_score) return false;
    const cond = r.target_condition_id;
    if (cond !== null && !(cond in ctx.grades)) return false;                        // 그 질환이 없음
    if (r.min_stage_level !== null || r.max_stage_level !== null) {
      const g = ctx.grades[cond], lo = r.min_stage_level ?? -99, hi = r.max_stage_level ?? 99;
      if (g === null || g === undefined || !(lo <= g && g <= hi)) return false;      // 등급 범위 밖
    }
    if (r.target_symptom_id !== null && !ctx.symptomIds.has(r.target_symptom_id)) return false;
    if (r.target_tag_id !== null && !ctx.recentTags.has(r.target_tag_id)) return false;
    if (r.max_sleep_minutes !== null && (ctx.sleep === null || ctx.sleep > r.max_sleep_minutes)) return false;
    return true;
  });
}
function decide(matched) {                       // 운동마다 하나: 금기 > 주의 > 추천, 같으면 priority 작은 것
  const final = new Map();
  for (const r of matched) {
    const key = [-LEVEL_RANK[LV[r.guide_level_id].code], r.priority];
    const cur = final.get(r.exercise_id);
    if (!cur) final.set(r.exercise_id, { ...r, _key: key, _order: final.size });
    else if (key[0] < cur._key[0] || (key[0] === cur._key[0] && key[1] < cur._key[1])) final.set(r.exercise_id, { ...r, _key: key, _order: cur._order });
  }
  return final;
}
const assessStatus = (final, ctx) => final.size === 0 ? "NO_MATCH" : (ctx.missing.length ? "PARTIAL" : "COMPLETED");

function judgeAndSave(db, log) {
  const ctx = collectContext(db);
  const final = decide(matchRules(log.pain_score, ctx));
  [...final.values()].forEach(r => db.guides.push({ idx: ++db.seq.guide, log_id: log.log_id, exercise_id: r.exercise_id,
    guide_level_id: r.guide_level_id, rule_id: r.rule_id, guide_message: r.guide_message, priority: r.priority, order: r._order,
    generated_at: log.recorded_at }));
  log.assessment_status = assessStatus(final, ctx); log.missing_context = ctx.missing;
}
function loadDetail(db, logId) {
  const p = db.pain_logs.find(x => x.log_id === logId);
  if (!p) return null;
  const s = SCALE[p.pain_score];
  const guides = db.guides.filter(g => g.log_id === logId)
    .sort((a, b) => b.guide_level_id - a.guide_level_id || a.priority - b.priority || a.order - b.order)
    .map(g => ({ guide_id: g.idx, exercise_id: g.exercise_id, exercise_name: EX[g.exercise_id].name,
      level_code: LV[g.guide_level_id].code, level_label: LV[g.guide_level_id].label, message: g.guide_message, rule_id: g.rule_id }));
  return { log_id: p.log_id, recorded_at: p.recorded_at, pain_score: p.pain_score, severity_label: s.severity_label,
    action_guide: s.action_guide, pain_location_name: LOC[p.pain_location_id].name, pain_type_name: TYP[p.pain_type_id].name,
    assessment_status: p.assessment_status, missing_context: p.missing_context, guides,
    basic_guide: p.assessment_status === "NO_MATCH" ? BASIC_GUIDE : null };
}
function goalsOf(db) { return db.goals ? { ...db.goals, is_default: false } : { target_steps: 6000, target_sleep_minutes: 420, is_default: true }; }
function painTrend(db, days) {
  const tz = db.user.timezone, today = localToday(tz), first = addDays(today, -(days - 1)), by = {};
  db.pain_logs.slice().sort((a, b) => a.recorded_at < b.recorded_at ? -1 : 1).forEach(p => {
    const d = localDate(p.recorded_at, tz); if (d >= first && d <= today) (by[d] = by[d] || []).push(p.pain_score);
  });
  return Array.from({ length: days }, (_, i) => { const d = addDays(first, i), s = by[d] || [];
    return { date: d, count: s.length, avg: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length * 10) / 10 : null,
      max: s.length ? Math.max(...s) : null, last: s.length ? s[s.length - 1] : null }; });
}
function meOf(db) {
  return { ...db.user, goals: goalsOf(db),
    conditions: db.conditions.map(c => ({ ...c, disease_name: COND[c.condition_id].name })),
    symptoms: db.symptoms.map(s => ({ ...s, symptom_name: SYM[s.symptom_id].name })) };
}
const typeView = t => ({ activity_type_id: t.activity_type_id, type_label: t.type_label, is_mine: true,
  tags: t.tag_ids.map(id => ({ tag_id: id, tag_code: TAG[id].code, tag_label: TAG[id].label })) });
function activityView(db, a) {
  const t = db.activity_types.find(x => x.activity_type_id === a.activity_type_id);
  return { activity_log_id: a.idx, activity_type_id: a.activity_type_id, type_label: t ? t.type_label : "(삭제된 종류)",
    started_at: a.started_at, duration_minutes: a.duration_minutes, intensity: a.intensity, memo: a.memo, tags: t ? typeView(t).tags : [] };
}
function exerciseView(db, e) {
  const g = e.guide_idx ? db.guides.find(x => x.idx === e.guide_idx) : null;
  return { exercise_log_id: e.exercise_log_id, exercise_id: e.exercise_id, exercise_name: EX[e.exercise_id].name, guide_id: e.guide_idx,
    guide_level_code: g ? LV[g.guide_level_id].code : null, guide_level_label: g ? LV[g.guide_level_id].label : null,
    performed_at: e.performed_at, duration_minutes: e.duration_minutes, pain_before: e.pain_before, pain_after: e.pain_after,
    memo: e.memo, pain_change: e.pain_after - e.pain_before };
}

/* ---------- 주소별 처리 (routers/*.py) ---------- */
const ROUTES = [
  // 통증 기록 · pain_logs.py
  ["GET", /^\/api\/pain-options$/, () => ({
    locations: REF.locations.map(l => ({ location_id: l.id, location_name: l.name })),
    types: REF.types.map(t => ({ pain_type_id: t.id, pain_type_name: t.name })),
    scale: REF.scale.map(s => ({ pain_score: s.score, level_name: s.level_name, action_guide: s.action_guide, severity_label: s.severity_label, nrs_range: s.nrs_range })) })],
  ["POST", /^\/api\/pain-logs$/, (db, b) => {
    rangeInt(b.pain_score, 0, 10, "pain_score");
    if (!LOC[b.pain_location_id]) fail(422, "없는 통증 위치입니다");
    if (!TYP[b.pain_type_id]) fail(422, "없는 통증 유형입니다");
    const log = { log_id: ++db.seq.log, pain_score: b.pain_score, pain_location_id: b.pain_location_id, pain_type_id: b.pain_type_id, recorded_at: utcNow() };
    db.pain_logs.push(log); judgeAndSave(db, log);
    return [201, loadDetail(db, log.log_id)];
  }],
  ["GET", /^\/api\/pain-logs\/(\d+)$/, (db, b, m) => loadDetail(db, +m[1]) || fail(404, "통증 기록이 없습니다")],
  ["GET", /^\/api\/pain-logs$/, (db, b, m, q) => {
    const tz = db.user.timezone, d = q.date || localToday(tz);
    const items = db.pain_logs.filter(p => localDate(p.recorded_at, tz) === d).sort((a, b) => a.recorded_at < b.recorded_at ? 1 : -1)
      .map(p => ({ log_id: p.log_id, recorded_at: p.recorded_at, pain_score: p.pain_score, severity_label: SCALE[p.pain_score].severity_label,
        pain_location_name: LOC[p.pain_location_id].name, pain_type_name: TYP[p.pain_type_id].name, assessment_status: p.assessment_status,
        guide_count: db.guides.filter(g => g.log_id === p.log_id).length }));
    return { date: d, timezone: tz, items };
  }],
  // 내 정보 · me.py
  ["GET", /^\/api\/profile-options$/, () => ({ conditions: REF.conditions.map(c => ({ condition_id: c.id, disease_name: c.name, description: c.description })),
    symptoms: REF.symptoms.map(s => ({ symptom_id: s.id, symptom_name: s.name })) })],
  ["GET", /^\/api\/me$/, db => meOf(db)],
  ["PUT", /^\/api\/me\/conditions$/, (db, b) => {
    if (!Array.isArray(b)) fail(422, "목록을 보내 주세요");
    const ids = b.map(i => i.condition_id); if (new Set(ids).size !== ids.length) fail(422, "같은 질환이 두 번 들어 있습니다");
    b.forEach(i => { if (!COND[i.condition_id]) fail(422, `없는 질환입니다: ${i.condition_id}`); rangeInt(i.disease_grade, 1, 5, "disease_grade", true); });
    db.conditions = b.map(i => ({ condition_id: i.condition_id, disease_grade: i.disease_grade ?? null })); db.onboarded = true;
    return meOf(db);
  }],
  ["PUT", /^\/api\/me\/symptoms$/, (db, b) => {
    if (!Array.isArray(b)) fail(422, "목록을 보내 주세요");
    const ids = b.map(i => i.symptom_id); if (new Set(ids).size !== ids.length) fail(422, "같은 증상이 두 번 들어 있습니다");
    b.forEach(i => { if (!SYM[i.symptom_id]) fail(422, `없는 증상입니다: ${i.symptom_id}`); });
    db.symptoms = b.map(i => ({ symptom_id: i.symptom_id, severity_level: i.severity_level ?? null }));
    return meOf(db);
  }],
  ["PUT", /^\/api\/me\/goals$/, (db, b) => {
    db.goals = { target_steps: rangeInt(b.target_steps, 0, 100000, "target_steps"), target_sleep_minutes: rangeInt(b.target_sleep_minutes, 0, 1440, "target_sleep_minutes") };
    return goalsOf(db);
  }],
  ["PUT", /^\/api\/me\/timezone$/, (db, b) => {
    try { new Intl.DateTimeFormat("en", { timeZone: b.timezone }); } catch (e) { fail(422, `모르는 시간대입니다: ${b.timezone}`); }
    db.user.timezone = b.timezone; return { user_id: db.user.user_id, timezone: b.timezone };
  }],
  // 아침 체크인 · checkins.py
  ["PUT", /^\/api\/checkins\/today$/, (db, b) => {
    const sleep = rangeInt(b.sleep_minutes, 0, 1440, "sleep_minutes"), steps = rangeInt(b.prev_day_steps, 0, 100000, "prev_day_steps", true);
    const today = localToday(db.user.timezone), cur = db.checkins.find(c => c.checkin_date === today);
    if (cur) Object.assign(cur, { sleep_minutes: sleep, prev_day_steps: steps });                  // 하루 1번: 있으면 고침
    else db.checkins.push({ checkin_date: today, sleep_minutes: sleep, prev_day_steps: steps });
    return { timezone: db.user.timezone, checkin_date: today, sleep_minutes: sleep, prev_day_steps: steps };
  }],
  ["GET", /^\/api\/checkins$/, (db, b, m, q) => {
    const days = Math.min(31, Math.max(1, +(q.days || 7))), today = localToday(db.user.timezone), first = addDays(today, -(days - 1));
    return { timezone: db.user.timezone, today, items: Array.from({ length: days }, (_, i) => { const d = addDays(first, i);
      return db.checkins.find(c => c.checkin_date === d) || { checkin_date: d, sleep_minutes: null, prev_day_steps: null }; }) };
  }],
  // 활동 기록 · activities.py
  ["GET", /^\/api\/activity-options$/, db => ({ categories: [], movement_tags: REF.tags.map(t => ({ tag_id: t.id, tag_code: t.code, tag_label: t.label, description: t.description })),
    activity_types: db.activity_types.map(typeView) })],
  ["POST", /^\/api\/activity-types$/, (db, b) => {
    const label = String(b.type_label || "").trim(); if (!label) fail(422, "활동 이름을 넣어 주세요");
    const tags = b.tag_ids || []; if (new Set(tags).size !== tags.length) fail(422, "같은 태그가 두 번 들어 있습니다");
    tags.forEach(t => { if (!TAG[t]) fail(422, `없는 동작 태그입니다: ${t}`); });
    const t = { activity_type_id: ++db.seq.atype, type_label: label, tag_ids: tags }; db.activity_types.push(t);
    return [201, typeView(t)];
  }],
  ["POST", /^\/api\/activity-logs$/, (db, b) => {
    if (!db.activity_types.find(x => x.activity_type_id === b.activity_type_id)) fail(422, "없는 활동 종류입니다");
    if (!b.started_at || Number.isNaN(Date.parse(b.started_at))) fail(422, "시작 시각을 넣어 주세요");
    if (Date.parse(b.started_at) > Date.now() + 5 * 60000) fail(422, "아직 오지 않은 시각입니다");
    const a = { idx: ++db.seq.alog, activity_type_id: b.activity_type_id, started_at: new Date(b.started_at).toISOString().replace(".000Z", "Z"),
      duration_minutes: rangeInt(b.duration_minutes, 1, 1440, "duration_minutes"), intensity: rangeInt(b.intensity, 1, 5, "intensity", true), memo: b.memo || null };
    db.activity_logs.push(a); return [201, activityView(db, a)];
  }],
  ["GET", /^\/api\/activity-logs$/, (db, b, m, q) => {
    const tz = db.user.timezone, d = q.date || localToday(tz);
    const items = db.activity_logs.filter(a => localDate(a.started_at, tz) === d).sort((a, b) => a.started_at < b.started_at ? -1 : 1).map(a => activityView(db, a));
    return { date: d, timezone: tz, total_minutes: items.reduce((s, i) => s + i.duration_minutes, 0), items };
  }],
  // 운동 수행 기록 · exercise_logs.py
  ["POST", /^\/api\/exercise-logs$/, (db, b) => {
    if (!EX[b.exercise_id]) fail(422, "없는 운동입니다");
    if (b.guide_id != null) { const g = db.guides.find(x => x.idx === b.guide_id); if (!g) fail(404, "판정 기록이 없습니다");
      if (g.exercise_id !== b.exercise_id) fail(422, "판정의 운동과 기록한 운동이 다릅니다"); }
    const e = { exercise_log_id: ++db.seq.exlog, exercise_id: b.exercise_id, guide_idx: b.guide_id ?? null, performed_at: utcNow(),
      duration_minutes: rangeInt(b.duration_minutes, 0, 600, "duration_minutes", true), pain_before: rangeInt(b.pain_before, 0, 10, "pain_before"),
      pain_after: rangeInt(b.pain_after, 0, 10, "pain_after"), memo: b.memo || null };
    db.exercise_logs.push(e);
    const v = exerciseView(db, e), notices = [];
    if (v.guide_level_code === "CONTRAINDICATED") notices.push("금기 판정을 받은 운동입니다. 다음에는 피하세요.");
    if (v.pain_change > 0) notices.push("운동 후 통증이 늘었습니다. 지금 통증을 다시 기록하면 판정을 새로 받을 수 있습니다.");
    return [201, { ...v, notices }];
  }],
  ["GET", /^\/api\/exercise-logs$/, (db, b, m, q) => {
    const tz = db.user.timezone, d = q.date || localToday(tz);
    return { date: d, timezone: tz, items: db.exercise_logs.filter(e => localDate(e.performed_at, tz) === d).map(e => exerciseView(db, e)) };
  }],
  // 대시보드 · dashboard.py
  ["GET", /^\/api\/pain-trend$/, (db, b, m, q) => ({ timezone: db.user.timezone, days: painTrend(db, Math.min(31, Math.max(1, +(q.days || 7)))) })],
  ["GET", /^\/api\/dashboard$/, db => {
    const tz = db.user.timezone, today = localToday(tz);
    const todayLogs = db.pain_logs.filter(p => localDate(p.recorded_at, tz) === today).sort((a, b) => a.recorded_at < b.recorded_at ? 1 : -1);
    const last = todayLogs[0], counts = {};
    if (last) db.guides.filter(g => g.log_id === last.log_id).forEach(g => { const c = LV[g.guide_level_id].code; counts[c] = (counts[c] || 0) + 1; });
    const ck = db.checkins.find(c => c.checkin_date === today), goals = goalsOf(db);
    const acts = db.activity_logs.filter(a => localDate(a.started_at, tz) === today);
    const todo = [];
    if (!db.conditions.length) todo.push({ code: "CONDITION", message: "질환 정보를 입력하면 운동 판정을 받을 수 있어요" });
    if (!ck) todo.push({ code: "MORNING_CHECKIN", message: "오늘 아침 체크인을 아직 하지 않았어요" });
    return { date: today, timezone: tz,
      pain: { today_count: todayLogs.length, last: last ? { log_id: last.log_id, recorded_at: last.recorded_at, pain_score: last.pain_score,
        severity_label: SCALE[last.pain_score].severity_label, assessment_status: last.assessment_status, guide_counts: counts } : null },
      checkin: ck ? { sleep_minutes: ck.sleep_minutes, prev_day_steps: ck.prev_day_steps, sleep_goal: goals.target_sleep_minutes, steps_goal: goals.target_steps,
        sleep_ok: ck.sleep_minutes >= goals.target_sleep_minutes, steps_ok: ck.prev_day_steps != null && ck.prev_day_steps >= goals.target_steps } : null,
      activity: { today_count: acts.length, today_minutes: acts.reduce((s, a) => s + a.duration_minutes, 0) },
      exercise: { today_count: db.exercise_logs.filter(e => localDate(e.performed_at, tz) === today).length },
      pain_trend_7d: painTrend(db, 7), todo };
  }],
  // 의학 콘텐츠 · contents.py (콘텐츠 데이터는 아직 없음)
  ["GET", /^\/api\/contents$/, () => ({ categories: [], items: [] })],
  ["GET", /^\/api\/contents\/(\d+)$/, () => fail(404, "콘텐츠가 없습니다")],
];

/* ---------- 시연용 샘플: 지난 6일치 체크인 · 통증 기록 ---------- */
function makeSample() {
  const db = loadDB(), tz = db.user.timezone, today = localToday(tz);
  const plan = [[-6, 6, 300], [-5, 5, 340], [-4, 6, 320], [-3, 4, 380], [-2, 4, 400], [-1, 3, 410]];
  for (const [off, score, sleep] of plan) {
    const d = addDays(today, off);
    if (!db.checkins.find(c => c.checkin_date === d)) db.checkins.push({ checkin_date: d, sleep_minutes: sleep, prev_day_steps: 3000 + (6 + off) * 600 });
    const log = { log_id: ++db.seq.log, pain_score: score, pain_location_id: 1, pain_type_id: 1, recorded_at: zonedToUTC(d, "08:30", tz) };
    db.pain_logs.push(log);
    // 그날 기준으로 판정 (그날 체크인이 있으니 수면 자료 있음)
    const ctx = collectContext(db); ctx.sleep = sleep; ctx.missing = ctx.missing.filter(x => x !== "MORNING_CHECKIN");
    const final = decide(matchRules(score, ctx));
    [...final.values()].forEach(r => db.guides.push({ idx: ++db.seq.guide, log_id: log.log_id, exercise_id: r.exercise_id, guide_level_id: r.guide_level_id,
      rule_id: r.rule_id, guide_message: r.guide_message, priority: r.priority, order: r._order, generated_at: log.recorded_at }));
    log.assessment_status = assessStatus(final, ctx); log.missing_context = ctx.missing;
  }
  saveDB(db);
}

/* ---------- 화면이 부르는 함수 (나중에 fetch로 바꿀 자리) ---------- */
const API_LOG = [];
async function api(method, url, body) {
  await new Promise(r => setTimeout(r, 120));          // 서버에 다녀오는 느낌
  const [path, qs] = url.split("?"), q = Object.fromEntries(new URLSearchParams(qs || ""));
  const db = JSON.parse(JSON.stringify(loadDB()));   // 복사본에서 작업 → 성공하면 저장 (트랜잭션처럼)
  let status = 200, data;
  try {
    const route = ROUTES.find(([m, re]) => m === method && re.test(path));
    if (!route) fail(404, "Not Found");
    let out = route[2](db, body ?? {}, path.match(route[1]), q);
    if (Array.isArray(out) && typeof out[0] === "number" && out.length === 2) [status, out] = out;
    data = out;
    if (method !== "GET") saveDB(db);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    status = e.status; data = { detail: e.detail };      // 실패하면 복사본을 버림 = 아무것도 안 바뀜
  }
  API_LOG.unshift({ method, url, body, status, data, at: new Date().toLocaleTimeString("ko-KR") });
  if (API_LOG.length > 30) API_LOG.pop();
  if (typeof window.onApiLog === "function") window.onApiLog();
  return { ok: status < 300, status, data };
}
