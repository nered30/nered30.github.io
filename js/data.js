/* ============================================================
   DATA.JS — 섹션 정보 · 샘플 게시물 · 댓글 · 전역 상태
   ============================================================ */

const SECTIONS = {
  notice:    { label: '공지사항',    desc: '관리자가 작성하는 중요 공지를 확인하세요.' },
  update:    { label: '업데이트',    desc: '서비스 업데이트 내역을 확인하세요.' },
  showcase:  { label: '게임 소개',   desc: '내가 만든 게임을 소개하고 피드백 받아보세요.' },
  review:    { label: '리뷰 / 평가', desc: '게임에 대한 솔직한 리뷰를 남겨보세요.' },
  recommend: { label: '추천 요청',   desc: '하고 싶은 장르나 스타일을 말하면 추천해드려요.' },
  general:   { label: '자유 게시판', desc: '로블록스와 관련된 무엇이든 자유롭게 이야기하세요.' },
  qna:       { label: '질문 / 답변', desc: '궁금한 점을 질문하고 답변해보세요.' },
  tip:       { label: '팁 & 공략',   desc: '유용한 팁과 공략을 공유해보세요.' },
  devlog:    { label: '개발 일지',   desc: '게임 개발 과정을 기록하고 공유해보세요.' },
  recruit:   { label: '팀원 모집',   desc: '같이 게임 만들 팀원을 모집해보세요.' },
  asset:     { label: '에셋 공유',   desc: '무료 에셋을 공유하거나 찾아보세요.' },
};

const BADGE_MAP = {
  admin:  { label: '관리자',     cls: 'badge-admin' },
  mod:    { label: '모더레이터', cls: 'badge-mod' },
  pro:    { label: '판린',       cls: 'badge-pro' },
  active: { label: '활동자',     cls: 'badge-active' },
  new:    { label: '신규',       cls: 'badge-new' },
};

/* 샘플 게시물 */
let POSTS = [
  {
    id: 1, section: 'notice', pinned: true,
    title: 'RobloxBoard 서비스 오픈 안내',
    content: 'RobloxBoard가 정식 오픈했습니다.\n로블록스 게임을 공유하고 커뮤니티와 소통해보세요!\n\n게임 소개, 리뷰, 개발 일지, 팁 등 다양한 콘텐츠를 올릴 수 있습니다.',
    author: { name: 'Admin', role: 'admin' },
    likes: 24, comments: 2, date: '2025.04.28',
  },
  {
    id: 2, section: 'showcase', pinned: false,
    title: '6개월 동안 만든 타워 디펜스 게임 소개합니다',
    content: '안녕하세요! 혼자서 6개월간 만든 타워 디펜스 게임을 소개합니다.\n\n- 스테이지 20개\n- 타워 15종\n- 유니크한 보스몬스터\n\n많이 플레이해주세요!',
    author: { name: 'TowerKing', role: 'active' },
    likes: 87, comments: 3, date: '2025.04.27',
    gameId: '292439477',
    gameThumb: 'https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/768/432/Image/Png',
    gameName: 'Tower Defense Simulator',
  },
  {
    id: 3, section: 'qna', pinned: false,
    title: '스튜디오에서 레이캐스트 사용법 알려주세요',
    content: '레이캐스트로 총알 판정을 구현하려고 하는데, 예제 코드나 튜토리얼 링크 아시는 분 있나요?',
    author: { name: 'NewDev99', role: 'new' },
    likes: 5, comments: 12, date: '2025.04.27',
  },
  {
    id: 4, section: 'tip', pinned: false,
    title: '렉 없는 서버 스크립트 최적화 팁 모음',
    content: '1. 반복 루프 안에서 wait() 대신 task.wait() 사용\n2. RemoteEvent 남용 금지\n3. 인스턴스 생성 최소화\n4. CollectionService로 태그 관리',
    author: { name: 'ScriptPro', role: 'pro' },
    likes: 142, comments: 31, date: '2025.04.26',
  },
  {
    id: 5, section: 'general', pinned: false,
    title: '요즘 로블록스 트렌드가 레이싱 게임인가요?',
    content: '최근 인기 목록 보면 레이싱 게임이 많이 보이더라고요. 다들 어떤 장르 즐기시나요?',
    author: { name: 'RblxFan', role: 'new' },
    likes: 18, comments: 44, date: '2025.04.25',
  },
  {
    id: 6, section: 'devlog', pinned: false,
    title: '[개발일지 #7] 보스 AI 패턴 구현 완료!',
    content: '드디어 보스 AI 3가지 패턴을 모두 구현했습니다.\n\n- 패턴 1: 레이저 회전 공격\n- 패턴 2: 범위 폭발\n- 패턴 3: 소환 몬스터',
    author: { name: 'DevLogger', role: 'active' },
    likes: 63, comments: 17, date: '2025.04.24',
  },
  {
    id: 7, section: 'recruit', pinned: false,
    title: '스크립터 구합니다 (모바일 RPG 개발 중)',
    content: '맵 디자이너 1명, 기획 1명이 있고 스크립터 1명을 추가 모집합니다.\n\n요구 스펙: Lua 기초 이상, Discord 소통 가능, 주 10시간 이상 투자 가능',
    author: { name: 'RPGBuilder', role: 'active' },
    likes: 9, comments: 6, date: '2025.04.23',
  },
];

/* 샘플 댓글 */
let COMMENTS = {
  1: [
    { author: 'CoolPlayer', role: 'new',   text: '오픈 축하드립니다! 좋은 플랫폼이 될 것 같아요.', date: '2025.04.28' },
    { author: 'Admin',      role: 'admin', text: '감사합니다! 앞으로 더 좋은 서비스로 발전하겠습니다.', date: '2025.04.28' },
  ],
  2: [
    { author: 'GameFan',   role: 'active', text: '완성도 높네요. 플레이해봤는데 재밌어요!', date: '2025.04.27' },
    { author: 'NewDev99',  role: 'new',    text: '6개월 혼자 만드셨다고요? 대단하시네요.', date: '2025.04.27' },
    { author: 'ScriptPro', role: 'pro',    text: '렉은 없던데 최적화도 잘 되어있네요.', date: '2025.04.27' },
  ],
};

/* 전역 상태 */
const state = {
  section:   'notice',
  sort:      'latest',   // 'latest' | 'popular'
  loggedIn:  false,
  user:      null,       // { name, role }
  imgFiles:  [],
};
