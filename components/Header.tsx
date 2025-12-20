"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function Header() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // userIdのみでフィルタリング（これならインデックス不要）
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", u.uid)
        );
        const unsubNoti = onSnapshot(q, (snapshot) => {
          // プログラム側で未読をカウントする
          const unreads = snapshot.docs.filter(doc => doc.data().isRead === false);
          setUnreadCount(unreads.length);
        });
        return () => unsubNoti();
      }
    });
    return () => unsubAuth();
  }, []);

  return (
    <header className="bg-white border-b sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
      <Link href="/" className="text-red-600 font-black text-2xl tracking-tighter italic">NOMI</Link>
      
      <div className="flex items-center gap-5">
        {user && (
          <Link href="/mypage" className="relative p-1">
            <span className="text-2xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </Link>
        )}
        <Link href="/mypage" className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden border">
          {user?.photoURL ? <img src={user.photoURL} alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">👤</div>}
        </Link>
      </div>
    </header>
  );
}
