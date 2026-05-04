/* ============================================================
   MAIN.JS — 사이드바 · 네비바 · 검색 · 정렬 · 모바일 햄버거
   버그수정: 검색 중 섹션 클릭 시 검색어 초기화 
   ============================================================ */

import { renderFeed }              from './post.js';
import { updateAuthUI, restoreSession } from './auth.js';

/* ---- 사이드바 섹션 클릭 ---- */
function initSidebar() {
  $$('.section-item').forEach(item => {
    item.addEventListener('click', () => {
      $$('.section-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      state.section = item.dataset.section;
      // 버그수정: 섹션 클릭 시 검색어 초기화
      $('searchInput').value = '';
      renderFeed();
      closeMobileSidebar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ---- 모바일 햄버거 ---- */
function initHamburger() {
  $('hamburger').addEventListener('click', () => {
    $('sidebar').classList.contains('open') ? closeMobileSidebar() : openMobileSidebar();
  });
  $('sidebarOverlay').addEventListener('click', closeMobileSidebar);
}
function openMobileSidebar() {
  $('sidebar').classList.add('open');
  $('sidebarOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMobileSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ---- 정렬 ---- */
function initSort() {
  $('sortBtn').addEventListener('click', () => {
    state.sort     = state.sort === 'latest' ? 'popular' : 'latest';
    $('sortLabel').textContent = state.sort === 'latest' ? '최신순' : '인기순';
    renderFeed();
  });
}

/* ---- 검색 ---- */
function initSearch() {
  let timer;
  $('searchInput').addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => handleSearch(e.target.value), 300);
  });
}

function handleSearch(q) {
  q = q.trim().toLowerCase();
  if (!q) { renderFeed(); return; }

  // 검색은 Firestore 전체 쿼리 대신 현재 섹션 내 클라이언트 필터
  // (추후 Algolia 연동으로 전체 검색 가능)
  $('feedTitle').innerHTML  = `<span class="feed-hash">#</span>검색: ${esc(q)}`;
  $('feedDesc').textContent = '검색 결과';
  $('pinnedPosts').innerHTML = '';
  $('postsList').innerHTML  =
    `<div style="text-align:center;padding:32px 0;color:var(--text3);font-size:13px;">
       Firestore 검색은 현재 섹션 내에서만 동작합니다.<br>
       더 넓은 검색은 추후 업데이트 예정이에요.
     </div>`;
}

/* ---- 더 보기 ---- */
function initLoadMore() {
  $('loadMoreBtn').addEventListener('click', function () {
    this.textContent = '불러오는 중...';
    setTimeout(() => { this.textContent = '더 보기'; }, 1200);
  });
}

/* ---- 창 크기 변경 ---- */
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) closeMobileSidebar();
});

/* ---- 모바일 글쓰기 모달 버그수정: 키보드 올라올 때 viewport 처리 ---- */
function initMobileViewport() {
  const writeModal = $('writeModal');
  if (!writeModal) return;
  const inputs = writeModal.querySelectorAll('input, textarea, select');
  inputs.forEach(inp => {
    inp.addEventListener('focus', () => {
      // iOS Safari에서 키보드 올라올 때 스크롤 보정
      setTimeout(() => {
        inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
  });
}

/* ---- 초기화 ---- */
document.addEventListener('DOMContentLoaded', () => {
  restoreSession();   // 새로고침 세션 복원
  initSidebar();
  initHamburger();
  initSort();
  initSearch();
  initLoadMore();
  initMobileViewport();
  renderFeed();
});
