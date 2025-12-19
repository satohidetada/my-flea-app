"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/");
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (confirm("本当にログアウトしますか？")) {
      await signOut(auth);
      router.push("/");
    }
  };

  if (!user) return <div className="p-8 text-black">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <header className="flex justify-between items-center mb-8">
        <Link href="/" className="text-red-600 font-bold text-xl">NOMI</Link>
        <h1 className="text-lg font-bold">マイページ</h1>
      </header>

      <div className="flex flex-col items-center py-10 border-b">
        <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden">
          {user.photoURL && <img src={user.photoURL} alt="profile" />}
        </div>
        <h2 className="text-xl font-bold">{user.displayName}</h2>
        <p className="text-gray-500 text-sm">{user.email}</p>
      </div>

      <div className="mt-8 space-y-4">
        <button className="w-full text-left p-4 border rounded-lg font-medium hover:bg-gray-50">
          出品した商品
        </button>
        <button className="w-full text-left p-4 border rounded-lg font-medium hover:bg-gray-50">
          購入した商品
        </button>
        <button className="w-full text-left p-4 border rounded-lg font-medium hover:bg-gray-50">
          いいね！一覧
        </button>
        
        <button 
          onClick={handleLogout}
          className="w-full mt-10 p-4 bg-gray-100 text-red-600 rounded-lg font-bold hover:bg-gray-200 transition"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
