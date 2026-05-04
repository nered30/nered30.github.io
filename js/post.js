/* ============================================================
   POST.JS — 피드 렌더 · 게시물 상세 · 글쓰기 · 댓글
   버그수정:
     - 이미지 URL 메모리 누수 (revokeObjectURL)
     - 댓글 등록 후 스크롤 위치 유지
     - 검색 후 섹션 클릭 시 검색어 초기화
   Firebase: Firestore 실시간 구독 적용 
   ============================================================ */

import {
  fbAddPost, fbWatchPosts, fbToggleLike, fbDeletePost, fbReportPost,
  fbWatchComments, fbAddComment, tsToStr,
} from './firebase.js';

/* 현재 구독 해제 함수 저장 */
let unsubPosts    = null;
let unsubComments = null;

/* ============================================================
   피드 렌더 (Firestore 실시간)
   ============================================================ */
function renderFeed() {
  const sec  = state.section;
  const info = SECTIONS[sec] || { label: sec, desc: '' };

  $('feedTitle').innerHTML  = `<span class="feed-hash">#</span>${info.label}`;
  $('feedDesc').textContent = info.desc;

  // 이전 구독 해제
  if (unsubPosts) { unsubPosts(); unsubPosts = null; }

  $('pinnedPosts').innerHTML = '<div class="feed-loading">불러오는 중...</div>';
  $('postsList').innerHTML   = '';

  // 실시간 구독
  unsubPosts = fbWatchPosts(sec, (posts) => {
    const pinned  = posts.filter(p => p.pinned);
    const normal  = posts.filter(p => !p.pinned);
    const sorted  = state.sort === 'popular'
      ? [...normal].sort((a, b) => (b.likes || 0) - (a.likes || 0))
      : normal;

    $('pinnedPosts').innerHTML = pinned.map(p => `
      <div class="post-card pinned-card" data-id="${p.id}">
        <div class="pin-label">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/>
          </svg>
          고정된 게시물
        </div>
        ${cardInner(p)}
      </div>`).join('');

    $('postsList').innerHTML = sorted.length
      ? sorted.map(p => `<div class="post-card" data-id="${p.id}">${cardInner(p)}</div>`).join('')
      : `<div style="text-align:center;padding:48px 0;color:var(--text3);font-size:13px;">
           아직 게시물이 없어요. 첫 번째 글을 작성해보세요!
         </div>`;

    $$('.post-card[data-id]').forEach(el => {
      el.addEventListener('click', () => openPost(el.dataset.id));
    });
  });
}

/* cardInner: Firestore 데이터 형식 맞춤 */
function cardInner(p) {
  const name = p.authorNick || '알 수 없음';
  const role = p.authorRole || 'new';
  const date = tsToStr(p.createdAt);
  const av   = makeAvatar(name, 26, 11);

  const body = p.gameThumb
    ? `<div class="post-with-thumb">
         <img class="post-game-thumb" src="${esc(p.gameThumb)}" alt="" onerror="this.style.display='none'">
         <div class="post-thumb-info">
           <h3 class="post-title">${esc(p.title)}</h3>
           <p class="post-preview">${esc((p.content || '').slice(0, 120))}...</p>
         </div>
       </div>`
    : `<h3 class="post-title">${esc(p.title)}</h3>
       <p class="post-preview">${esc((p.content || '').slice(0, 160))}...</p>`;

  return `
    <div class="post-card-inner">
      <div class="post-meta-top">
        <div class="post-author">${av}<span class="author-name">${esc(name)}</span>${makeBadge(role)}</div>
        <span class="post-date">${date}</span>
      </div>
      ${body}
      <div class="post-footer">
        <span class="post-stat">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2.748-.717.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 3.485L8 2.748z" stroke="currentColor" stroke-width="1.2"/></svg>
          ${p.likes || 0}
        </span>
        <span class="post-stat">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12z" stroke="currentColor" stroke-width="1.2"/></svg>
          ${p.comments || 0}
        </span>
        <span class="section-tag"># ${SECTIONS[p.section]?.label || p.section}</span>
      </div>
    </div>`;
}

/* ============================================================
   게시물 상세 모달
   ============================================================ */
async function openPost(postId) {
  if (unsubComments) { unsubComments(); unsubComments = null; }
  openModal('postModal');
  $('postModalContent').innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3);">불러오는 중...</div>';

  // 게시물 데이터는 피드에서 이미 있으므로 Firestore 재조회 없이 DOM에서 가져와도 됨
  // 댓글만 실시간 구독
  unsubComments = fbWatchComments(postId, async (coms) => {
    // 최초 1회 게시물 렌더 (이후엔 댓글만 갱신)
    const postEl = document.querySelector(`.post-card[data-id="${postId}"]`);
    const titleEl = postEl?.querySelector('.post-title');

    // postModalContent가 이미 렌더됐으면 댓글만 갱신
    const alreadyRendered = $('postModalContent').querySelector('.post-detail-title');
    if (!alreadyRendered) {
      await renderPostDetail(postId, coms);
    } else {
      renderComments(postId, coms);
    }
  });
}

async function renderPostDetail(postId, coms) {
  // 현재 피드 캐시에서 게시물 찾기
  const cardEl = document.querySelector(`.post-card[data-id="${postId}"]`);
  const title  = cardEl?.querySelector('.post-title')?.textContent || '';
  const preview= cardEl?.querySelector('.post-preview')?.textContent || '';

  // Firestore에서 전체 데이터 가져오기
  const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const { db } = await import('./firebase.js');
  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) { $('postModalContent').innerHTML = '<p>게시물을 찾을 수 없습니다.</p>'; return; }

  const p    = { id: snap.id, ...snap.data() };
  const name = p.authorNick || '알 수 없음';
  const date = tsToStr(p.createdAt);
  const liked = state.user && (p.likedBy || []).includes(state.user.uid);
  const isOwner = state.user && state.user.uid === p.authorId;

  const thumbHtml = p.gameThumb ? `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;
      background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:14px;">
      <img src="${esc(p.gameThumb)}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;"
        onerror="this.style.display='none'">
      <div>
        <div style="font-size:13px;font-weight:700;">${esc(p.gameName || '')}</div>
        <div style="font-size:11px;color:var(--text3);font-family:'Source Code Pro',monospace;">ID: ${esc(p.gameId)}</div>
      </div>
    </div>` : '';

  const imagesHtml = (p.imageURLs || []).length
    ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
        ${p.imageURLs.map(url => `<img src="${esc(url)}" style="max-width:100%;max-height:280px;border-radius:var(--r-md);border:1px solid var(--border);object-fit:cover;" onerror="this.style.display='none'">`).join('')}
       </div>`
    : '';

  $('postModalContent').innerHTML = `
    <div style="margin-bottom:16px;">
      <h2 class="post-detail-title">${esc(p.title)}</h2>
      <div class="post-detail-meta">
        ${makeAvatar(name, 22, 10)}
        <strong>${esc(name)}</strong>
        ${makeBadge(p.authorRole || 'new')}
        <span>${date}</span>
        <span style="font-family:'Source Code Pro',monospace;font-size:11px;"># ${SECTIONS[p.section]?.label || p.section}</span>
      </div>
    </div>
    ${thumbHtml}
    ${imagesHtml}
    <div class="post-detail-body">${esc(p.content)}</div>
    <div class="post-actions-row">
      <button class="like-btn ${liked ? 'liked' : ''}" id="likeBtn">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2.748-.717.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 3.485L8 2.748z" stroke="currentColor" stroke-width="1.3"/></svg>
        좋아요 <span id="likeCount">${p.likes || 0}</span>
      </button>
      ${isOwner ? `<button class="report-btn" id="deleteBtn" style="color:var(--red);">삭제</button>` : ''}
      <button class="report-btn" id="reportBtn">신고</button>
    </div>
    <div id="commentsSection"></div>`;

  /* 좋아요 */
  $('likeBtn').addEventListener('click', async () => {
    if (!state.loggedIn) { openModal('loginModal'); return; }
    const result = await fbToggleLike(postId, state.user.uid);
    $('likeBtn').classList.toggle('liked', result);
  });

  /* 삭제 */
  $('deleteBtn')?.addEventListener('click', async () => {
    if (!confirm('게시물을 삭제할까요?')) return;
    await fbDeletePost(postId);
    closeModal('postModal');
  });

  /* 신고 */
  $('reportBtn').addEventListener('click', async () => {
    if (!state.loggedIn) { openModal('loginModal'); return; }
    const reason = prompt('신고 사유를 입력해주세요:');
    if (!reason) return;
    await fbReportPost(postId, state.user.uid, reason);
    alert('신고가 접수되었습니다.');
  });

  renderComments(postId, coms);
}

function renderComments(postId, coms) {
  const section = $('commentsSection');
  if (!section) return;

  // 버그수정: 댓글 갱신 시 스크롤 위치 저장 후 복원
  const modal   = $('postModal');
  const scrollY = modal.scrollTop;

  const comsHtml = coms.map(c => {
    const name = c.authorNick || '알 수 없음';
    const date = tsToStr(c.createdAt);
    return `<div class="comment-item">
      ${makeAvatar(name, 28, 11)}
      <div class="comment-body">
        <div class="comment-author">${esc(name)} ${makeBadge(c.authorRole || 'new')} <span class="comment-date">${date}</span></div>
        <div class="comment-text">${esc(c.text)}</div>
      </div>
    </div>`;
  }).join('');

  section.innerHTML = `
    <div class="comments-title">댓글 ${coms.length}개</div>
    <div id="commentsBox">${comsHtml}</div>
    <div class="comment-input-row">
      <input type="text" id="commentInput"
        placeholder="${state.loggedIn ? '댓글을 입력하세요...' : '로그인 후 댓글을 달 수 있습니다.'}"
        ${state.loggedIn ? '' : 'disabled'}/>
      <button class="comment-submit" id="commentSubmit">등록</button>
    </div>`;

  // 스크롤 복원
  requestAnimationFrame(() => { modal.scrollTop = scrollY; });

  const submitComment = async () => {
    if (!state.loggedIn) { openModal('loginModal'); return; }
    const inp = $('commentInput');
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    $('commentSubmit').disabled = true;
    try {
      await fbAddComment(postId, {
        text:       txt,
        authorNick: state.user.nick,
        authorRole: state.user.role || 'new',
        authorId:   state.user.uid,
      });
    } finally {
      $('commentSubmit').disabled = false;
    }
  };

  $('commentSubmit').addEventListener('click', submitComment);
  $('commentInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitComment(); });
}

/* ---- 모달 닫기 ---- */
$('closePostModal').addEventListener('click', () => {
  closeModal('postModal');
  if (unsubComments) { unsubComments(); unsubComments = null; }
});
$('postModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) {
    closeModal('postModal');
    if (unsubComments) { unsubComments(); unsubComments = null; }
  }
});

/* ============================================================
   글쓰기 모달
   ============================================================ */
$('writeBtn').addEventListener('click', () => {
  if (!state.loggedIn) { openModal('loginModal'); return; }
  openModal('writeModal');
});
$('closeWriteModal').addEventListener('click', () => closeModal('writeModal'));
$('cancelWrite').addEventListener('click',      () => closeModal('writeModal'));
$('writeModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('writeModal'); });

/* 이미지 미리보기 — 버그수정: revokeObjectURL로 메모리 누수 방지 */
const previewURLs = [];

$('imageInput').addEventListener('change', e => {
  const files = Array.from(e.target.files);
  const rem   = 5 - state.imgFiles.length;
  state.imgFiles = [...state.imgFiles, ...files.slice(0, rem)];
  renderImgPreviews();
  e.target.value = '';
});

function renderImgPreviews() {
  // 이전 blob URL 해제
  previewURLs.forEach(u => URL.revokeObjectURL(u));
  previewURLs.length = 0;

  $('imgCount').textContent = `${state.imgFiles.length}/5`;
  $('imgPreviewRow').innerHTML = state.imgFiles.map((f, i) => {
    const url = URL.createObjectURL(f);
    previewURLs.push(url);
    return `<div class="img-preview-item">
      <img src="${url}" alt="">
      <button class="remove-img" data-i="${i}">x</button>
    </div>`;
  }).join('');

  $$('.remove-img').forEach(btn => btn.addEventListener('click', () => {
    URL.revokeObjectURL(previewURLs[+btn.dataset.i]);
    state.imgFiles.splice(+btn.dataset.i, 1);
    renderImgPreviews();
  }));
}

/* 게임 ID 불러오기 */
$('fetchGameBtn').addEventListener('click', fetchGame);
$('gameIdInput').addEventListener('keydown', e => { if (e.key === 'Enter') fetchGame(); });

function fetchGame() {
  const gid = $('gameIdInput').value.trim();
  if (!gid) return;
  // Roblox API는 CORS 차단 → 썸네일 URL 패턴으로 직접 구성
  const thumbUrl = `https://www.roblox.com/asset-thumbnail/image?assetId=${gid}&width=768&height=432&format=png`;
  $('gamePreview').classList.remove('hidden');
  $('gameThumb').innerHTML = `<img src="${thumbUrl}" onerror="this.src='';this.parentElement.style.background='#ddd'">`;
  $('gameNamePreview').textContent = `게임 ID: ${gid}`;
  $('gameIdPreview').textContent   = `ID: ${gid}`;
}

/* 게시하기 */
const submitBtn = $('submitPost');
submitBtn.addEventListener('click', async () => {
  const title   = $('writeTitle').value.trim();
  const content = $('editorTextarea').value.trim();
  const section = $('writeSectionSelect').value;
  const gameId  = $('gameIdInput').value.trim();

  if (!title)   { alert('제목을 입력해주세요.'); return; }
  if (!content) { alert('내용을 입력해주세요.'); return; }

  submitBtn.disabled    = true;
  submitBtn.textContent = '업로드 중...';

  try {
    await fbAddPost({
      section, title, content, gameId,
      gameName:  $('gameNamePreview').textContent || '',
      gameThumb: $('gameThumb').querySelector('img')?.src || '',
      author:    state.user,
      imgFiles:  state.imgFiles,
    });

    // 폼 초기화
    $('writeTitle').value     = '';
    $('editorTextarea').value = '';
    $('gameIdInput').value    = '';
    $('gamePreview').classList.add('hidden');
    previewURLs.forEach(u => URL.revokeObjectURL(u));
    previewURLs.length = 0;
    state.imgFiles = [];
    renderImgPreviews();

    closeModal('writeModal');

    // 버그수정: 검색어 초기화 후 해당 섹션으로 이동
    $('searchInput').value = '';
    state.section = section;
    $$('.section-item').forEach(i => i.classList.toggle('active', i.dataset.section === section));
    renderFeed();
  } catch (err) {
    alert('게시 실패: ' + err.message);
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = '게시하기';
  }
});

export { renderFeed };
