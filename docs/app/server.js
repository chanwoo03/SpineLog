/* =====================================================================
   server.js — 데모 화면을 "진짜 서버(FastAPI + MySQL)"에 연결하는 파일
   ---------------------------------------------------------------------
   언제 켜지나?  FastAPI가 화면까지 줄 때 (주소가 /web/ 로 시작: http://127.0.0.1:8000/web/)
                GitHub(chanwoo03.github.io)에서 열면 아무 일도 안 함 → 예전처럼 브라우저 안 가짜 서버
   무엇을 바꾸나? api.js의 api() 함수만 fetch로 바꿈 → app.js(화면)는 그대로
     화면(app.js) ──▶ api("POST", "/api/pain-logs", {...}) ──▶ fetch → FastAPI → MySQL
   로그인        토큰을 이 브라우저에 보관하고, 요청마다 Authorization: Bearer 토큰 을 붙임
                (deps.py의 get_current_user가 이 토큰을 읽어 누구인지 판단)
   ===================================================================== */
(function () {
  const SERVER_MODE = location.pathname.startsWith("/web/");
  if (!SERVER_MODE) return;                       // GitHub 데모는 그대로

  const TOKEN_KEY = "spinelog-token";
  let memToken = null;                            // 저장이 막힌 브라우저용
  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || memToken; } catch (e) { return memToken; } };
  const setToken = t => { memToken = t; try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {} };
  let me = null;                                  // GET /api/me 결과 (시간대 · 질환 여부)
  window.CURRENT_USER = null;                     // 로그인 전 = null → 오늘 기록 알림을 띄우지 않음 (app.js remindMissing)

  /* ---- 1. api(): 가짜 서버 대신 진짜 서버로 ---- */
  window.api = async function (method, url, body) {
    const headers = {};
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;          // ← 로그인 토큰 붙이기
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let status = 0, data = null;
    try {
      const res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      status = res.status;
      const text = await res.text();
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = { detail: text }; }
    } catch (e) {
      data = { detail: "서버에 연결할 수 없어요 (uvicorn이 켜져 있는지 확인)" };
    }
    API_LOG.unshift({ method, url, body, status, data, at: new Date().toLocaleTimeString("ko-KR") });
    if (API_LOG.length > 30) API_LOG.pop();
    if (typeof window.onApiLog === "function") window.onApiLog();
    if (status === 401 && !url.startsWith("/api/auth/")) showLogin("다시 로그인해 주세요");
    return { ok: status >= 200 && status < 300, status, data };
  };

  /* ---- 2. 가짜 서버 전용 기능을 진짜 서버에 맞게 ---- */
  // 화면(route)이 시간대 · 처음 방문 여부를 읽는 곳 → 서버에서 받은 내 정보로
  window.loadDB = () => ({ user: { timezone: (me && me.timezone) || "Asia/Seoul" }, onboarded: !!(me && me.conditions && me.conditions.length) });
  // "지난 6일 샘플"은 브라우저 가짜 DB에만 넣을 수 있음 (진짜 서버는 지난 날짜로 기록하는 API가 없음)
  window.makeSample = () => toast("실제 서버 모드에서는 샘플 기록을 넣지 않아요");
  // "모두 지우기" → 로그아웃
  window.resetDB = () => logout();

  async function refreshMe() {
    const r = await window.api("GET", "/api/me");
    me = r.ok ? r.data : null;
    window.CURRENT_USER = me ? me.user_id : null;
    return r.ok;
  }
  function logout() {
    setToken(null); me = null; window.CURRENT_USER = null; showLogin("로그아웃했어요");
  }

  /* ---- 3. 로그인 · 회원가입 화면 (화면 위에 덮는 창) ---- */
  const box = document.createElement("div");
  box.id = "authLayer";
  box.innerHTML = `
    <div class="auth-card card">
      <div class="eyebrow">SpineLog · 실제 서버</div>
      <h2 id="authTitle">로그인</h2>
      <p class="muted small" id="authMsg"></p>
      <form id="authForm">
        <input class="input" id="aId" placeholder="아이디 (3자 이상)" autocomplete="username" required>
        <input class="input" id="aEmail" type="email" placeholder="이메일" autocomplete="email" hidden>
        <input class="input" id="aName" placeholder="이름 (선택)" hidden>
        <input class="input" id="aPw" type="password" placeholder="비밀번호 (8자 이상)" autocomplete="current-password" required>
        <button class="btn primary block" type="submit" id="aGo">로그인</button>
      </form>
      <button class="btn block" id="aSwitch" type="button">처음이에요 · 회원가입</button>
      <p class="muted small center">기록은 서버(MySQL)에 저장됩니다 · 수업용 시연이며 의료 조언이 아닙니다</p>
    </div>`;
  let signupMode = false;

  function setMode(signup) {
    signupMode = signup;
    $("#authTitle").textContent = signup ? "회원가입" : "로그인";
    $("#aGo").textContent = signup ? "가입하고 로그인" : "로그인";
    $("#aSwitch").textContent = signup ? "이미 계정이 있어요 · 로그인" : "처음이에요 · 회원가입";
    $("#aEmail").hidden = !signup; $("#aEmail").required = signup;
    $("#aName").hidden = !signup;
    $("#aPw").autocomplete = signup ? "new-password" : "current-password";
  }
  function showLogin(msg) {
    decorate();                                   // 아직 창을 안 붙였으면 먼저 붙임
    document.body.classList.add("auth-open");
    $("#authMsg").textContent = msg || "";
    box.hidden = false;
  }
  function hideLogin() { box.hidden = true; document.body.classList.remove("auth-open"); }

  async function submit(e) {
    e.preventDefault();
    const user_id = $("#aId").value.trim(), password = $("#aPw").value;
    if (signupMode) {
      const r = await window.api("POST", "/api/auth/signup", {
        user_id, password, email: $("#aEmail").value.trim(), username: $("#aName").value.trim() || null });
      if (!r.ok) { $("#authMsg").textContent = errText(r); return; }
    }
    const r = await window.api("POST", "/api/auth/login", { user_id, password });
    if (!r.ok) { $("#authMsg").textContent = errText(r); return; }
    setToken(r.data.access_token);                                     // ← 받은 토큰 보관
    $("#aPw").value = "";
    await refreshMe();
    resetRemind();                                                     // 로그인 직후에는 오늘 기록 알림을 다시 보여 줌
    hideLogin();
    location.hash = me && me.conditions && me.conditions.length ? "#home" : "#me";
    route();
    toast(signupMode ? "가입했어요 · 먼저 질환을 골라 주세요" : `${user_id}님, 반가워요`);
  }

  /* ---- 4. 화면 꾸미기: "브라우저 데모" 표시 → "실제 서버", 로그아웃 버튼 ---- */
  let decorated = false;
  function decorate() {
    if (decorated) return; decorated = true;
    document.body.classList.add("server-mode");
    const tag = document.querySelector(".demo-tag"); if (tag) tag.textContent = "실제 서버";
    const back = document.querySelector(".top .back");
    if (back) { back.textContent = "로그아웃"; back.href = "#"; back.onclick = e => { e.preventDefault(); logout(); }; }
    const css = document.createElement("style");
    css.textContent = `
      #authLayer{position:fixed;inset:0;z-index:50;background:rgba(20,26,34,.55);display:flex;align-items:center;justify-content:center;padding:16px}
      #authLayer[hidden]{display:none}
      #authLayer .auth-card{width:100%;max-width:380px;display:flex;flex-direction:column;gap:10px}
      #authLayer form{display:flex;flex-direction:column;gap:10px}
      #authLayer input[hidden]{display:none}
      body.server-mode #sample{display:none}`;
    document.head.appendChild(css);
    document.body.appendChild(box);
    $("#authForm").addEventListener("submit", submit);
    $("#aSwitch").onclick = () => { setMode(!signupMode); $("#authMsg").textContent = ""; };
    // "이 브라우저에만 저장" 문구 → "서버에 저장"
    new MutationObserver(() => {
      document.querySelectorAll("#view p.muted").forEach(p => {
        if (p.textContent.includes("localStorage") || p.textContent.includes("이 브라우저에만")) p.textContent = "기록은 서버(MySQL)에 저장됩니다 · 수업용 시연이며 의료 조언이 아닙니다";
      });
      const reset = document.querySelector("#reset"); if (reset && reset.textContent !== "로그아웃") { reset.textContent = "로그아웃"; reset.onclick = () => logout(); }
    }).observe(document.querySelector("#view"), { childList: true, subtree: true });
  }

  /* ---- 5. 시작: 토큰이 있으면 내 정보 확인, 없으면 로그인 창 ---- */
  document.addEventListener("DOMContentLoaded", async () => {
    decorate(); setMode(false);
    if (getToken() && await refreshMe()) { hideLogin(); route(); }
    else showLogin(getToken() ? "로그인이 만료됐어요" : "");
  });
})();
