"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from "firebase/firestore";
import Link from "next/link";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        // 未読通知を監視
        const q = query(
          collection(db, "users", u.uid, "notifications"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        return onSnapshot(q, (s) => {
          setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      }
    });
    return () => unsubAuth();
  }, []);

  const hasUnread = notifications.some(n => !n.isRead);

  const markAsRead = async (n: any) => {
    if (!n.isRead) {
      await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { isRead: true });
    }
    setShowNotif(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
      {/* 左側：ロゴとキャッチコピー */}
      <div className="flex items-baseline gap-2">
        <Link href="/" className="text-2xl font-black text-red-600 tracking-tighter">NOMI</Link>
        <span className="text-[10px] font-bold text-gray-400 leading-none pb-0.5 hidden xs:inline">
          梱包いらず、手軽な街の蚤の市
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative">
            {/* ベルマーク */}
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2">
              <span className="text-xl">🔔</span>
              {hasUnread && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>

            {/* 通知ドロップダウン */}
            {showNotif && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">お知らせ</div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && <p className="p-6 text-center text-xs text-gray-400">通知はありません</p>}
                  {notifications.map(n => {
                    // ★ URLが正しく解釈されるようスラッシュを補完
                    const safeLink = n.link ? (n.link.startsWith('/') ? n.link : `/${n.link}`) : "/mypage";
                    
                    return (
                      <Link 
                        key={n.id} 
                        href={safeLink} 
                        onClick={() => markAsRead(n)} 
                        className={`block p-4 border-b last:border-0 hover:bg-gray-50 transition ${!n.isRead ? "bg-red-50/30" : ""}`}
                      >
                        <p className={`text-xs ${!n.isRead ? "font-bold text-black" : "text-gray-500"}`}>{n.body}</p>
                        <p className="text-[9px] text-gray-400 mt-1">たった今</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <Link href="/mypage" className="w-8 h-8 rounded-full bg-gray-100 border border-gray-100 overflow-hidden inline-block ml-2 align-middle">
              {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="text-center pt-1">👤</div>}
            </Link>
          </div>
        ) : (
          <Link href="/login" className="text-xs font-bold text-gray-500 border px-3 py-2 rounded-full">ログイン</Link>
        )}
      </div>
    </header>
  );
}