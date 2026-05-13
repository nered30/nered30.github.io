import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "./firebase.js";
import { RBLX_USERS } from "./api.js";

const SESSION_KEY = "rblx_user";

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
export function saveSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
export function clearSession()    { localStorage.removeItem(SESSION_KEY); }

// 로블록스 유저 정보 가져오기 (POST - CORS 허용)
export async function fetchRobloxUser(username) {
  const res = await fetch(`${RBLX_USERS}/v1/usernames/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });
  if (!res.ok) throw new Error("유저를 찾을 수 없습니다");
  const data = await res.json();
  const user = data?.data?.[0];
  if (!user) throw new Error("존재하지 않는 유저명입니다");
  return { id: String(user.id), username: user.name };
}

// 로블록스 프로필 설명 가져오기
export async function fetchRobloxDescription(robloxId) {
  const res = await fetch(`${RBLX_USERS}/v1/users/${robloxId}`);
  if (!res.ok) throw new Error("프로필 조회 실패");
  const data = await res.json();
  return data.description || "";
}

// 인증 코드 생성 (로블록스 검열 우회 - 알파벳만 사용)
export function generateVerifyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RBLXSHARE-${code}`;
}

// Firestore에 유저 등록 or 코드 갱신
export async function registerUser(robloxId, robloxUsername) {
  const ref = doc(db, "users", robloxId);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().verified) {
    return { alreadyVerified: true, data: snap.data() };
  }
  const verifyCode = generateVerifyCode();
  await setDoc(ref, {
    robloxId, robloxUsername, verifyCode,
    verified: false, createdAt: serverTimestamp(),
  }, { merge: true });
  return { alreadyVerified: false, verifyCode };
}

// 프로필 설명에서 코드 확인 후 인증 완료
export async function verifyUser(robloxId) {
  const ref = doc(db, "users", robloxId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("등록된 유저가 없습니다");
  const { verifyCode, robloxUsername } = snap.data();
  const description = await fetchRobloxDescription(robloxId);
  if (!description.includes(verifyCode)) {
    throw new Error("프로필 설명에서 인증 코드를 찾을 수 없습니다");
  }
  await updateDoc(ref, { verified: true });
  const user = { robloxId, robloxUsername, verifyCode };
  saveSession(user);
  return user;
}
