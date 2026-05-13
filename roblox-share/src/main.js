import "./style.css";
import { getSession, clearSession, fetchRobloxUser, registerUser, verifyUser } from "./auth.js";
import { getPosts, getMyPosts, createPost, deletePost, validatePlaceId, fetchGameThumbnail, fetchAvatarUrl } from "./posts.js";

// ─── STATE ───────────────────────────────────────────
let currentUser = getSession();
let currentPage = "feed";

// ─── ROOT ────────────────────────────────────────────
const root = document.getElementById("app");

function render() {
  if (!currentUser) {
    renderAuth();
  } else {
    renderApp();
  }
}

// ─── AUTH SCREEN ─────────────────────────────────────
function renderAuth() {
  root.innerHTML = `
    <div id="auth-screen">
      <div class="auth-card" id="auth-step-1">
        <h1>🎮 RobloxShare</h1>
        <p class="sub">로블록스 프로필로 본인인증 후 게임을 공유하세요</p>
        <div class="form-group">
          <label class="form-label">로블록스 유저명</label>
          <input class="form-input" id="username-input" placeholder="Roblox 유저명 입력" autocomplete="off" />
        </div>
        <div id="auth-msg"></div>
        <div class="btn-row" style="justify-content:stretch; margin-top:16px;">
          <button class="btn btn-primary" style="width:100%;" id="auth-next-btn">다음</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("auth-next-btn").onclick = handleAuthStep1;
  document.getElementById("username-input").addEventListener("keydown", e => {
    if (e.key === "Enter") handleAuthStep1();
  });
}

async function handleAuthStep1() {
  const input = document.getElementById("username-input");
  const msg   = document.getElementById("auth-msg");
  const btn   = document.getElementById("auth-next-btn");
  const username = input.value.trim();
  if (!username) return;

  btn.disabled = true;
  btn.textContent = "조회 중...";
  msg.innerHTML = "";

  try {
    const robloxUser = await fetchRobloxUser(username);
    const result = await registerUser(robloxUser.id, robloxUser.username);

    if (result.alreadyVerified) {
      currentUser = { robloxId: robloxUser.id, robloxUsername: robloxUser.username };
      const { saveSession } = await import("./auth.js");
      saveSession(currentUser);
      renderApp();
      return;
    }

    renderVerifyStep(robloxUser, result.verifyCode);
  } catch (e) {
    msg.innerHTML = `<div class="error-msg">${e.message}</div>`;
    btn.disabled = false;
    btn.textContent = "다음";
  }
}

function renderVerifyStep(robloxUser, verifyCode) {
  root.innerHTML = `
    <div id="auth-screen">
      <div class="auth-card">
        <h1>🔐 본인인증</h1>
        <p class="sub"><strong>${robloxUser.username}</strong> 계정을 인증해주세요</p>

        <ol class="step-list">
          <li>아래 인증 코드를 복사하세요</li>
          <li>Roblox 프로필 설정 → About(소개) 란에 코드를 붙여넣고 저장하세요</li>
          <li>저장 완료 후 아래 인증 확인 버튼을 클릭하세요</li>
        </ol>

        <div class="verify-box">
          <div class="label">인증 코드</div>
          <div class="verify-code">
            <span id="code-text">${verifyCode}</span>
            <button class="copy-btn" id="copy-btn">복사</button>
          </div>
        </div>

        <div id="verify-msg"></div>

        <div class="btn-row" style="justify-content:stretch; margin-top:16px; flex-direction:column; gap:8px;">
          <button class="btn btn-primary" style="width:100%;" id="verify-btn">✅ 인증 확인</button>
          <button class="btn btn-secondary" style="width:100%;" id="back-btn">← 뒤로</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("copy-btn").onclick = () => {
    navigator.clipboard.writeText(verifyCode).then(() => {
      document.getElementById("copy-btn").textContent = "복사됨!";
      setTimeout(() => {
        const el = document.getElementById("copy-btn");
        if (el) el.textContent = "복사";
      }, 2000);
    });
  };

  document.getElementById("back-btn").onclick = renderAuth;

  document.getElementById("verify-btn").onclick = async () => {
    const btn = document.getElementById("verify-btn");
    const msg = document.getElementById("verify-msg");
    btn.disabled = true;
    btn.textContent = "확인 중...";
    msg.innerHTML = "";

    try {
      currentUser = await verifyUser(robloxUser.id);
      renderApp();
    } catch (e) {
      msg.innerHTML = `<div class="error-msg">${e.message}</div>`;
      btn.disabled = false;
      btn.textContent = "✅ 인증 확인";
    }
  };
}

// ─── MAIN APP ────────────────────────────────────────
function renderApp() {
  root.innerHTML = `
    <div id="sidebar">
      <div id="sidebar-header">
        <div class="logo">R</div>
        RobloxShare
      </div>
      <nav id="nav">
        <div class="nav-section">탐색</div>
        <div class="nav-item active" data-page="feed">
          <span class="icon">🏠</span> 전체 피드
        </div>
        <div class="nav-item" data-page="my">
          <span class="icon">👤</span> 내 게시물
        </div>
      </nav>
      <div id="sidebar-user">
        <div class="user-avatar" id="sidebar-avatar">
          ${currentUser.robloxUsername[0].toUpperCase()}
        </div>
        <div class="user-info">
          <div class="name">${currentUser.robloxUsername}</div>
          <div class="tag">인증된 계정 ✓</div>
        </div>
        <button class="icon-btn" id="logout-btn" title="로그아웃">⏏</button>
      </div>
    </div>

    <div id="main">
      <div id="topbar">
        <span class="page-title" id="page-title">🏠 전체 피드</span>
        <button class="btn btn-primary" id="new-post-btn" style="font-size:13px; padding:7px 14px;">
          + 게임 공유
        </button>
      </div>
      <div id="content">
        <div class="loading"><div class="spinner"></div> 불러오는 중...</div>
      </div>
    </div>

    <button id="fab">+ 게임 공유</button>
  `;

  // 유저 아바타 이미지 로드
  loadAvatarImage(currentUser.robloxId, "sidebar-avatar", currentUser.robloxUsername);

  // 네비 클릭
  document.querySelectorAll(".nav-item").forEach(el => {
    el.onclick = () => {
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      el.classList.add("active");
      currentPage = el.dataset.page;
      document.getElementById("page-title").textContent =
        currentPage === "feed" ? "🏠 전체 피드" : "👤 내 게시물";
      loadPosts();
    };
  });

  document.getElementById("logout-btn").onclick = () => {
    clearSession();
    currentUser = null;
    render();
  };

  document.getElementById("new-post-btn").onclick = openPostModal;
  document.getElementById("fab").onclick = openPostModal;

  loadPosts();
}

async function loadAvatarImage(robloxId, elId, fallback) {
  try {
    const url = await fetchAvatarUrl(robloxId);
    if (url) {
      const el = document.getElementById(elId);
      if (el) el.innerHTML = `<img src="${url}" alt="${fallback}" />`;
    }
  } catch {}
}

// ─── POST LIST ───────────────────────────────────────
async function loadPosts() {
  const content = document.getElementById("content");
  content.innerHTML = `<div class="loading"><div class="spinner"></div> 불러오는 중...</div>`;

  try {
    const posts = currentPage === "feed"
      ? await getPosts()
      : await getMyPosts(currentUser.robloxId);

    if (posts.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="emoji">🎮</div>
          <div class="title">${currentPage === "feed" ? "아직 게시물이 없어요" : "내 게시물이 없어요"}</div>
          <div class="desc">첫 번째로 게임을 공유해보세요!</div>
        </div>
      `;
      return;
    }

    content.innerHTML = "";
    posts.forEach(post => content.appendChild(renderPostCard(post)));

    // 아바타 이미지 로드
    posts.forEach(post => {
      loadAvatarImage(post.authorId, `av-${post.id}`, post.authorUsername);
    });

  } catch (e) {
    content.innerHTML = `<div class="error-msg">게시물 로드 실패: ${e.message}</div>`;
  }
}

function timeAgo(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function renderPostCard(post) {
  const card = document.createElement("div");
  card.className = "post-card";
  const isOwner = currentUser && post.authorId === currentUser.robloxId;

  card.innerHTML = `
    <img class="post-thumb" src="${post.thumbnailUrl || ""}"
      onerror="this.style.background='#e3e5e8'; this.src=''" alt="썸네일" />
    <div class="post-body">
      <div class="post-meta">
        <div class="user-avatar post-author-avatar" id="av-${post.id}">
          ${post.authorUsername ? post.authorUsername[0].toUpperCase() : "?"}
        </div>
        <span class="post-author">${post.authorUsername || "익명"}</span>
        <span class="post-time">${timeAgo(post.createdAt)}</span>
      </div>
      <div class="post-title">${escHtml(post.title)}</div>
      <div class="post-desc">${escHtml(post.description || "")}</div>
      <div class="post-footer">
        ${post.genre ? `<span class="genre-badge">${escHtml(post.genre)}</span>` : ""}
        <a class="play-btn" href="https://www.roblox.com/games/${post.gameId}/game" target="_blank" rel="noopener">
          ▶ 플레이
        </a>
        ${isOwner ? `<button class="delete-btn" data-id="${post.id}">삭제</button>` : ""}
      </div>
    </div>
  `;

  if (isOwner) {
    card.querySelector(".delete-btn").onclick = async () => {
      if (!confirm("이 게시물을 삭제할까요?")) return;
      try {
        await deletePost(post.id, currentUser.robloxId);
        card.remove();
      } catch (e) {
        alert(e.message);
      }
    };
  }

  return card;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── POST MODAL ──────────────────────────────────────
let gamePreviewData = null;

function openPostModal() {
  gamePreviewData = null;
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <div class="modal" id="post-modal">
      <h2>🎮 게임 공유하기</h2>

      <div class="form-group">
        <label class="form-label">Roblox 게임 URL 또는 Place ID</label>
        <div style="display:flex; gap:8px;">
          <input class="form-input" id="game-id-input"
            placeholder="https://www.roblox.com/games/123456... 또는 숫자 ID"
            style="flex:1;" />
          <button class="btn btn-secondary" id="fetch-game-btn">확인</button>
        </div>
        <div id="game-preview-area"></div>
      </div>

      <div class="form-group">
        <label class="form-label">게임 제목</label>
        <input class="form-input" id="post-title" placeholder="게임 이름을 입력하세요" />
      </div>

      <div class="form-group">
        <label class="form-label">소개글</label>
        <textarea class="form-textarea" id="post-desc" placeholder="게임을 소개해주세요..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">장르</label>
        <select class="form-select" id="post-genre">
          <option value="">선택 안함</option>
          <option>어드벤처</option>
          <option>RPG</option>
          <option>시뮬레이터</option>
          <option>타이쿤</option>
          <option>공포</option>
          <option>전투</option>
          <option>파쿠르</option>
          <option>레이싱</option>
          <option>기타</option>
        </select>
      </div>

      <div id="post-msg"></div>

      <div class="btn-row">
        <button class="btn btn-secondary" id="cancel-post-btn">취소</button>
        <button class="btn btn-primary" id="submit-post-btn" disabled>공유하기</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.getElementById("cancel-post-btn").onclick = () => overlay.remove();
  document.getElementById("fetch-game-btn").onclick = handleFetchGame;
  document.getElementById("game-id-input").addEventListener("keydown", e => {
    if (e.key === "Enter") handleFetchGame();
  });
  document.getElementById("submit-post-btn").onclick = handleSubmitPost;
}

function extractPlaceId(input) {
  const trimmed = input.trim();
  // URL 형식
  const match = trimmed.match(/roblox\.com\/games\/(\d+)/);
  if (match) return match[1];
  // 숫자만
  if (/^\d+$/.test(trimmed)) return trimmed;
  return null;
}

async function handleFetchGame() {
  const input = document.getElementById("game-id-input").value;
  const area  = document.getElementById("game-preview-area");
  const btn   = document.getElementById("fetch-game-btn");

  const placeId = extractPlaceId(input);
  if (!placeId) {
    area.innerHTML = `<div class="error-msg">올바른 게임 URL 또는 Place ID를 입력해주세요</div>`;
    return;
  }

  btn.disabled = true;
  btn.textContent = "확인 중...";
  area.innerHTML = `<div class="loading" style="padding:16px 0;"><div class="spinner"></div></div>`;

  try {
    const thumbUrl = await validatePlaceId(placeId);

    gamePreviewData = {
      gameId: placeId,
      thumbnailUrl: thumbUrl || "",
    };

    area.innerHTML = `
      <div class="game-preview">
        ${thumbUrl
          ? `<img src="${thumbUrl}" alt="썸네일" style="width:72px;height:72px;border-radius:8px;object-fit:cover;" />`
          : `<div style="width:72px;height:72px;border-radius:8px;background:var(--border);"></div>`}
        <div class="info">
          <div class="name" style="color:var(--green);font-size:13px;">✅ 게임 확인됨 (Place ID: ${placeId})</div>
          <div class="creator" style="color:var(--text-muted);font-size:12px;margin-top:4px;">아래에 제목을 직접 입력해주세요</div>
        </div>
      </div>
    `;

    document.getElementById("submit-post-btn").disabled = false;
  } catch (e) {
    area.innerHTML = `<div class="error-msg">${e.message}</div>`;
    gamePreviewData = null;
    document.getElementById("submit-post-btn").disabled = true;
  } finally {
    btn.disabled = false;
    btn.textContent = "확인";
  }
}

async function handleSubmitPost() {
  if (!gamePreviewData) return;

  const title   = document.getElementById("post-title").value.trim();
  const desc    = document.getElementById("post-desc").value.trim();
  const genre   = document.getElementById("post-genre").value;
  const btn     = document.getElementById("submit-post-btn");
  const msg     = document.getElementById("post-msg");

  if (!title) {
    document.getElementById("post-msg").innerHTML = `<div class="error-msg">게임 제목을 입력해주세요</div>`;
    return;
  }

  btn.disabled = true;
  btn.textContent = "업로드 중...";
  msg.innerHTML = "";

  try {
    await createPost({
      gameId:         gamePreviewData.gameId,
      title,
      description:    desc,
      thumbnailUrl:   gamePreviewData.thumbnailUrl,
      authorId:       currentUser.robloxId,
      authorUsername: currentUser.robloxUsername,
      genre,
    });

    document.querySelector(".overlay").remove();
    currentPage = "feed";
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    document.querySelector('[data-page="feed"]').classList.add("active");
    document.getElementById("page-title").textContent = "🏠 전체 피드";
    loadPosts();
  } catch (e) {
    msg.innerHTML = `<div class="error-msg">${e.message}</div>`;
    btn.disabled = false;
    btn.textContent = "공유하기";
  }
}

// ─── INIT ────────────────────────────────────────────
render();
