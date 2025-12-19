"use client";
import Auth from "@/components/Auth";
import ItemList from "@/components/ItemList";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-4 max-w-lg mx-auto text-black">
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-xl font-black text-red-500 tracking-tighter">my-flea-app</h1>
        <div className="flex gap-2">
          {user ? (
            <>
              <Link href="/mypage" className="text-xs bg-gray-100 px-3 py-2 rounded-lg font-bold">マイページ</Link>
              <button onClick={() => signOut(auth)} className="text-xs bg-red-50 text-red-500 px-3 py-2 rounded-lg font-bold">ログアウト</button>
            </>
          ) : (
            <span className="text-xs text-gray-400 py-2">ゲストさん</span>
          )}
        </div>
      </header>

      {!user && !loading && <Auth />}
      
      <div className="mt-4">
        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">おすすめの商品</h2>
        <ItemList />
      </div>

      {user && (
        <Link href="/upload" className="fixed bottom-6 right-6 bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl text-2xl font-bold hover:scale-110 transition active:scale-95 z-50">
          ＋
        </Link>
      )}
    </main>
  );
}
