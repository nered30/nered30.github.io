/* ============================================================
   AUTH.JS — Roblox 프로필 코드 인증 로그인
   흐름: 유저명 입력 → 코드 발급 → 프로필 소개란 확인 → 로그인
   ============================================================ */

let _rblxUserId   = null;
let _rblxUserName = '';
let _verifyCode   = '';

/* 코드 생성 */
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RBB-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* Roblox API — allorigins 프록시 (CORS 우회, 배포 시 Firebase Functions 교체 권장) */
async function rblxFetch(url) {
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res   = await fetch(proxy);
  if (!res.ok) throw new Error('네트워크 오류');
  const json  = await res.json();
  return JSON.parse(json.contents);
}

/* 유저명으로 유저 조회 */
async function rblxGetUser(username) {
  const search = await rblxFetch(
    `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`
  );
  const found = (search.data || []).find(
    u => u.name.toLowerCase() === username.toLowerCase()
  );
  if (!found) throw new Error('Roblox 계정을 찾을 수 없어요.\n유저명을 다시 확인해주세요.');
  return found;
}

/* 아바타 썸네일 */
async function rblxGetAvatar(userId) {
  try {
    const data = await rblxFetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=48x48&format=Png`
    );
    return data.data?.[0]?.imageUrl || '';
  } catch { return ''; }
}

/* 프로필 소개란 */
async function rblxGetDescription(userId) {
  const data = await rblxFetch(`https://users.roblox.com/v1/users/${userId}`);
  return data.description || '';
}

/* 단계 전환 */
function goStep(n) {
  ['rblxStep1','rblxStep2','rblxStep3'].forEach((id, i) => {
    $(id).classList.toggle('hidden', i + 1 !== n);
  });
  ['step1Dot','step2Dot','step3Dot'].forEach((id, i) => {
    $(id).classList.toggle('active', i + 1 <= n);
  });
}

function showStepError(id, msg) {
  const el = $(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}
function clearStepError(id) { $(id).classList.add('hidden'); }
function setBtn(btn, loading, label) {
  btn.disabled    = loading;
  btn.textContent = loading ? '확인 중...' : label;
}

/* STEP 1 — 유저명 조회 */
async function handleStep1() {
  const username = $('rblxUsername').value.trim();
  if (!username) { showStepError('step1Error', '유저명을 입력해주세요.'); return; }
  clearStepError('step1Error');
  setBtn($('rblxCheckBtn'), true, '다음');
  $('rblxProfilePreview').classList.add('hidden');
  $('step1Next').classList.add('hidden');
  try {
    const user   = await rblxGetUser(username);
    const avatar = await rblxGetAvatar(user.id);
    _rblxUserId   = user.id;
    _rblxUserName = user.name;
    if (avatar) $('rblxAvatar').src = avatar;
    $('rblxPreviewName').textContent = user.name;
    $('rblxPreviewId').textContent   = `ID: ${user.id}`;
    $('rblxProfilePreview').classList.remove('hidden');
    $('step1Next').classList.remove('hidden');
  } catch (err) {
    showStepError('step1Error', err.message || 'Roblox 서버 연결 실패');
  } finally {
    setBtn($('rblxCheckBtn'), false, '다음');
  }
}

$('rblxCheckBtn').addEventListener('click', handleStep1);
$('rblxUsername').addEventListener('keydown', e => { if (e.key === 'Enter') handleStep1(); });

$('step1Next').addEventListener('click', () => {
  _verifyCode = genCode();
  $('verifyCode').textContent = _verifyCode;
  clearStepError('step2Error');
  goStep(2);
});

/* STEP 2 — 코드 확인 */
$('copyCodeBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(_verifyCode).then(() => {
    $('copyCodeBtn').textContent = '복사됨!';
    setTimeout(() => { $('copyCodeBtn').textContent = '복사'; }, 2000);
  }).catch(() => {
    const r = document.createRange();
    r.selectNode($('verifyCode'));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(r);
  });
});

$('step2Back').addEventListener('click', () => { clearStepError('step2Error'); goStep(1); });

async function handleVerify() {
  clearStepError('step2Error');
  setBtn($('step2VerifyBtn'), true, '인증 확인');
  try {
    const desc = await rblxGetDescription(_rblxUserId);
    if (!desc.includes(_verifyCode)) {
      showStepError('step2Error',
        `프로필 소개란에서 코드를 찾을 수 없어요.\n"${_verifyCode}"를 소개란에 붙여넣고 저장했는지 확인해주세요.`
      );
      return;
    }
    $('successName').textContent = _rblxUserName;
    goStep(3);
  } catch {
    showStepError('step2Error', 'Roblox 서버 연결 실패. 잠시 후 다시 시도해주세요.');
  } finally {
    setBtn($('step2VerifyBtn'), false, '인증 확인');
  }
}

$('step2VerifyBtn').addEventListener('click', handleVerify);

/* STEP 3 — 로그인 완료 */
$('step3Done').addEventListener('click', () => {
  state.loggedIn = true;
  state.user = { name: _rblxUserName, robloxId: _rblxUserId, role: 'new' };
  localStorage.setItem('rbboard_user', JSON.stringify(state.user));
  closeModal('loginModal');
  resetLoginModal();
  updateAuthUI();
  renderFeed();
});

/* 모달 리셋 */
function resetLoginModal() {
  $('rblxUsername').value = '';
  $('rblxProfilePreview').classList.add('hidden');
  $('step1Next').classList.add('hidden');
  clearStepError('step1Error');
  clearStepError('step2Error');
  goStep(1);
  _rblxUserId = null; _rblxUserName = ''; _verifyCode = '';
}

$('closeLoginModal').addEventListener('click', () => { closeModal('loginModal'); resetLoginModal(); });
$('loginModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) { closeModal('loginModal'); resetLoginModal(); }
});

/* 네비바 로그인 버튼 */
function updateAuthUI() {
  const btn = $('loginBtn');
  if (state.loggedIn && state.user) {
    btn.innerHTML =
      makeAvatar(state.user.name, 20, 10) +
      `<span style="margin-left:5px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(state.user.name)}</span>`;
  } else {
    btn.textContent = '로그인';
  }
}

$('loginBtn').addEventListener('click', () => {
  if (state.loggedIn) {
    state.loggedIn = false;
    state.user = null;
    localStorage.removeItem('rbboard_user');
    updateAuthUI();
    renderFeed();
  } else {
    openModal('loginModal');
  }
});

/* 새로고침 세션 복원 */
(function restoreSession() {
  try {
    const saved = localStorage.getItem('rbboard_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user && user.name) { state.loggedIn = true; state.user = user; updateAuthUI(); }
    }
  } catch {}
})();
