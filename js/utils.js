/* ============================================================
   UTILS.JS — 공용 헬퍼 · 렌더 유틸
   ===================================== ======================= */

/* ---- DOM 헬퍼 ---- */
const $ = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ---- XSS 방지 ---- */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---- 아바타 색상 (이름 기반 해시) ---- */
function avColor(name) {
  let h = 0;
  for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) % 8;
  return 'av-' + h;
}

/* ---- 배지 HTML ---- */
function makeBadge(role) {
  const b = BADGE_MAP[role];
  return b ? `<span class="badge ${b.cls}">${b.label}</span>` : '';
}

/* ---- 아바타 HTML ---- */
function makeAvatar(name, size = 26, fontSize = 11) {
  const cls = avColor(name);
  const init = String(name).charAt(0).toUpperCase();
  return `<div class="avatar ${cls}" style="width:${size}px;height:${size}px;font-size:${fontSize}px;">${init}</div>`;
}

/* ---- 오늘 날짜 문자열 ---- */
function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

/* ---- 모달 열기/닫기 ---- */
function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

/* ---- 게시물 카드 내부 HTML ---- */
function cardInner(p) {
  const av = makeAvatar(p.author.name, 26, 11);
  const body = p.gameThumb
    ? `<div class="post-with-thumb">
         <img class="post-game-thumb" src="${esc(p.gameThumb)}" alt="" onerror="this.style.display='none'">
         <div class="post-thumb-info">
           <h3 class="post-title">${esc(p.title)}</h3>
           <p class="post-preview">${esc(p.content.slice(0, 120))}...</p>
         </div>
       </div>`
    : `<h3 class="post-title">${esc(p.title)}</h3>
       <p class="post-preview">${esc(p.content.slice(0, 160))}...</p>`;

  return `
    <div class="post-card-inner">
      <div class="post-meta-top">
        <div class="post-author">
          ${av}
          <span class="author-name">${esc(p.author.name)}</span>
          ${makeBadge(p.author.role)}
        </div>
        <span class="post-date">${p.date}</span>
      </div>
      ${body}
      <div class="post-footer">
        <span class="post-stat">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2.748-.717.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 3.485L8 2.748z" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          ${p.likes}
        </span>
        <span class="post-stat">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12z" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          ${p.comments}
        </span>
        <span class="section-tag"># ${SECTIONS[p.section]?.label || p.section}</span>
      </div>
    </div>`;
}

/* ---- 마크다운 삽입 (에디터 툴바 onclick에서 호출) ---- */
function insertMd(before, after) {
  const ta = $('editorTextarea');
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = ta.value.substring(s, e) || 'text';
  ta.value = ta.value.substring(0, s) + before + sel + after + ta.value.substring(e);
  ta.focus();
  ta.selectionStart = s + before.length;
  ta.selectionEnd   = s + before.length + sel.length;
}
