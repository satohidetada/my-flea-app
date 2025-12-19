"use client";
import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import Link from "next/link";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const unsubLikes = onSnapshot(collection(db, "users", currentUser.uid, "likes"), (snap) => {
          const likes: Record<string, boolean> = {};
          snap.docs.forEach(doc => likes[doc.id] = true);
          setUserLikes(likes);
        });
        return () => unsubLikes();
      } else {
        setUserLikes({});
      }
    });

    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsubSnap = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAuth();
      unsubSnap();
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (confirm("ログアウトしますか？")) {
      await signOut(auth);
      alert("ログアウトしました");
    }
  };

  const toggleLike = async (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("いいねするにはログインが必要です。");
      login();
      return;
    }
    const likeRef = doc(db, "users", user.uid, "likes", itemId);
    if (userLikes[itemId]) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, { createdAt: new Date() });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <header className="bg-white p-4 shadow-md flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-extrabold text-red-600 tracking-tighter cursor-pointer">NOMI</h1>
        </Link>
        <div className="flex items-center space-x-3">
          <Link href="/upload" className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm">出品</Link>
          {user ? (
            <>
              <Link href="/mypage" className="text-gray-600 text-sm font-medium">マイページ</Link>
              <button onClick={logout} className="text-gray-400 text-xs border border-gray-200 px-2 py-1 rounded">ログアウト</button>
            </>
          ) : (
            <button onClick={login} className="text-gray-600 text-sm font-medium border border-gray-300 px-3 py-1 rounded">ログイン</button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <div className="bg-white rounded shadow hover:shadow-lg transition relative overflow-hidden">
                <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
                <div className="p-2">
                  <h2 className="font-bold truncate text-sm">{item.name}</h2>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-red-500 font-bold text-lg">¥{item.price.toLocaleString()}</p>
                    <button 
                      onClick={(e) => toggleLike(e, item.id)}
                      className={`text-xl transition ${userLikes[item.id] ? "text-red-500 scale-110" : "text-gray-300"}`}
                    >
                      {userLikes[item.id] ? "❤️" : "♡"}
                    </button>
                  </div>
                </div>
                {item.status === "sold" && (
                  <div className="absolute top-0 left-0 bg-red-600 text-white px-2 py-1 text-xs font-bold shadow-lg transform -rotate-12">SOLD</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
