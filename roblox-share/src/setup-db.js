import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCh25ldiBE61zE9wiqPGL_bRhyxs5qEzXs",
  authDomain: "shevlo.firebaseapp.com",
  databaseURL: "https://shevlo-default-rtdb.firebaseio.com",
  projectId: "shevlo",
  storageBucket: "shevlo.firebasestorage.app",
  messagingSenderId: "714356282455",
  appId: "1:714356282455:web:3050a7c74c253e41a37f12",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const logEl = document.getElementById("log");
const statusEl = document.getElementById("status");

function log(msg, ok = true) {
  const div = document.createElement("div");
  div.className = ok ? "ok" : "err";
  div.textContent = msg;
  logEl.appendChild(div);
}

async function deleteCollection(colName) {
  const snap = await getDocs(collection(db, colName));
  const dels = snap.docs.map((d) => deleteDoc(doc(db, colName, d.id)));
  await Promise.all(dels);
  return snap.size;
}

async function setup() {
  statusEl.textContent = "DB 세팅 중...";

  // 1. 기존 컬렉션 전부 삭제
  const toDelete = ["_firebase_test", "users", "posts", "likes"];
  for (const col of toDelete) {
    try {
      const count = await deleteCollection(col);
      if (count > 0) log(`🗑️ '${col}' 컬렉션 ${count}개 문서 삭제 완료`);
    } catch (e) {
      log(`⚠️ '${col}' 삭제 중 오류: ${e.message}`, false);
    }
  }

  // 2. users 컬렉션 - 스키마 예시 문서 생성
  try {
    await setDoc(doc(db, "users", "_schema"), {
      robloxId: "",          // 로블록스 유저 ID (숫자)
      robloxUsername: "",    // 로블록스 유저명
      verifyCode: "",        // 본인인증 코드
      verified: false,       // 인증 완료 여부
      createdAt: serverTimestamp(),
    });
    log("✅ 'users' 컬렉션 생성 완료");
  } catch (e) {
    log(`❌ users 생성 실패: ${e.message}`, false);
  }

  // 3. posts 컬렉션 - 스키마 예시 문서 생성
  try {
    await setDoc(doc(db, "posts", "_schema"), {
      gameId: "",            // 로블록스 게임 ID
      title: "",             // 게임 제름
      description: "",       // 소개글
      thumbnailUrl: "",      // 썸네일 이미지 URL
      authorId: "",          // 작성자 robloxId
      authorUsername: "",    // 작성자 유저명
      likes: 0,              // 좋아요 수
      views: 0,              // 조회수
      genre: "",             // 장르
      createdAt: serverTimestamp(),
    });
    log("✅ 'posts' 컬렉션 생성 완료");
  } catch (e) {
    log(`❌ posts 생성 실패: ${e.message}`, false);
  }

  // 4. likes 컬렉션 - 스키마 예시 문서 생성
  try {
    await setDoc(doc(db, "likes", "_schema"), {
      postId: "",            // 게시물 ID
      userId: "",            // 유저 robloxId
      createdAt: serverTimestamp(),
    });
    log("✅ 'likes' 컬렉션 생성 완료");
  } catch (e) {
    log(`❌ likes 생성 실패: ${e.message}`, false);
  }

  statusEl.textContent = "✅ DB 세팅 완료!";
  statusEl.style.color = "#4caf50";
  log("━━━━━━━━━━━━━━━━━━━━━━");
  log("📦 생성된 컬렉션: users / posts / likes");
}

setup();
