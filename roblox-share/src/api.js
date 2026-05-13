// 개발환경: Vite 프록시 사용 / 프로덕션: 직접 URL 사용
const DEV = import.meta.env.DEV;

export const RBLX_USERS = DEV ? '/roblox-users' : 'https://users.roblox.com';
export const RBLX_THUMB  = DEV ? '/roblox-thumb'  : 'https://thumbnails.roblox.com';
export const RBLX_GAMES  = DEV ? '/roblox-games'  : 'https://games.roblox.com';
