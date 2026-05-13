import {
  db, collection, addDoc, getDocs, getDoc, deleteDoc,
  doc, query, orderBy, where, serverTimestamp,
} from "./firebase.js";
import { RBLX_THUMB } from "./api.js";

// Place ID로 썸네일 가져오기 (CORS 허용 공개 API)
export async function fetchGameThumbnail(placeId) {
  try {
    const res = await fetch(
      `${RBLX_THUMB}/v1/places/gameicons?placeIds=${placeId}&returnPolicy=PlaceHolder&size=512x512&format=Png`
    );
    const data = await res.json();
    return data?.data?.[0]?.imageUrl || null;
  } catch {
    return null;
  }
}

// Place ID 유효성 확인 (썸네일로 존재 여부 체크)
export async function validatePlaceId(placeId) {
  const res = await fetch(
    `${RBLX_THUMB}/v1/places/gameicons?placeIds=${placeId}&returnPolicy=PlaceHolder&size=512x512&format=Png`
  );
  if (!res.ok) throw new Error("게임을 찾을 수 없습니다");
  const data = await res.json();
  if (!data?.data?.[0]) throw new Error("존재하지 않는 게임입니다");
  return data.data[0].imageUrl || null;
}

// 게시물 작성
export async function createPost({ gameId, title, description, thumbnailUrl, authorId, authorUsername, genre }) {
  const ref = await addDoc(collection(db, "posts"), {
    gameId, title, description,
    thumbnailUrl: thumbnailUrl || "",
    authorId, authorUsername,
    genre: genre || "",
    likes: 0, views: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// 전체 게시물 목록
export async function getPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs
    .filter(d => d.id !== "_schema" && d.data().gameId)
    .map(d => ({ id: d.id, ...d.data() }));
}

// 내 게시물만
export async function getMyPosts(authorId) {
  const q = query(collection(db, "posts"), where("authorId", "==", authorId));
  const snap = await getDocs(q);
  return snap.docs
    .filter(d => d.id !== "_schema")
    .sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0))
    .map(d => ({ id: d.id, ...d.data() }));
}

// 게시물 삭제
export async function deletePost(postId, authorId) {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("게시물이 없습니다");
  if (snap.data().authorId !== authorId) throw new Error("삭제 권한이 없습니다");
  await deleteDoc(ref);
}

// 유저 아바타 URL 가져오기
export async function fetchAvatarUrl(robloxId) {
  try {
    const res = await fetch(
      `${RBLX_THUMB}/v1/users/avatar-headshot?userIds=${robloxId}&size=48x48&format=Png`
    );
    const data = await res.json();
    return data?.data?.[0]?.imageUrl || null;
  } catch {
    return null;
  }
}
