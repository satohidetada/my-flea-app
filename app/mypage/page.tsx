"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [sellingItems, setSellingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);

      // 1. 自分が購入者の商品を監視
      const qPurchased = query(
        collection(db, "items"),
        where("buyerId", "==", currentUser.uid)
      );
      const unsubPurchases = onSnapshot(qPurchased, (snapshot) => {
        setPurchasedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // 2. 自分が出品者の商品を監視
      const qSelling = query(
        collection(db, "items"),
        where("sellerId", "==", currentUser.uid)
      );
      const unsubSelling = onSnapshot(qSelling, (snapshot) => {
        setSellingItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      return () => {
        unsubPurchases();
        unsubSelling();
      };
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (confirm("ログアウトしますか？")) {
      await signOut(auth);
      router.push("/");
    }
  };

  if (!user) return <div className="p-8 text-black text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black p-4 pb-20">
      <header className="flex justify-between items-center mb-6 px-2">
        <Link href="/" className="text-red-600 font-bold text-2xl tracking-tighter">NOMI</Link>
        <h1 className="text-lg font-bold">マイページ</h1>
      </header>

      {/* プロフィール */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border mb-8 flex flex-col items-center">
        <div className="w-20 h-20 bg-gray-200 rounded-full mb-3 overflow-hidden border-2 border-white shadow-md">
          {user.photoURL ? <img src={user.photoURL} alt="profile" /> : <div className="w-full h-full bg-red-100 flex items-center justify-center text-red-400 text-2xl font-bold">{user.displayName?.[0]}</div>}
        </div>
        <h2 className="text-xl font-bold">{user.displayName || "ユーザー"}</h2>
        <p className="text-gray-400 text-sm">{user.email}</p>
      </div>

      {/* 出品した商品セクション */}
      <section className="mb-10">
        <h3 className="text-lg font-bold mb-4 px-2 flex items-center justify-between">
          <span>📤 出品した商品</span>
          <span className="text-xs font-normal text-gray-500">{sellingItems.length}件</span>
        </h3>
        {sellingItems.length > 0 ? (
          <div className="space-y-3">
            {sellingItems.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-2xl flex items-center shadow-sm border">
                <img src={item.imageUrl} className="w-16 h-16 object-cover rounded-xl mr-4" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <p className="text-gray-500 text-xs">¥{item.price.toLocaleString()}</p>
                  {item.isSold ? (
                    <Link href={`/chat/${item.id}`} className="text-red-500 text-xs font-bold mt-1 inline-block bg-red-50 px-2 py-1 rounded">
                      売却済：取引画面へ
                    </Link>
                  ) : (
                    <Link href={`/items/${item.id}/edit`} className="text-blue-500 text-xs font-bold mt-1 inline-block bg-blue-50 px-2 py-1 rounded">
                      出品中：編集する
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl border border-dashed">出品した商品はありません</p>
        )}
      </section>

      {/* 購入した商品セクション */}
      <section className="mb-10">
        <h3 className="text-lg font-bold mb-4 px-2 flex items-center justify-between">
          <span>🛍️ 購入した商品</span>
          <span className="text-xs font-normal text-gray-500">{purchasedItems.length}件</span>
        </h3>
        {purchasedItems.length > 0 ? (
          <div className="space-y-3">
            {purchasedItems.map((item) => (
              <Link key={item.id} href={`/chat/${item.id}`} className="bg-white p-3 rounded-2xl flex items-center shadow-sm border active:bg-gray-50 block">
                <img src={item.imageUrl} className="w-16 h-16 object-cover rounded-xl mr-4" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <p className="text-blue-500 text-xs font-bold mt-1">取引画面で連絡する</p>
                </div>
                <span className="text-gray-300">〉</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl border border-dashed">購入した商品はありません</p>
        )}
      </section>

      <button onClick={handleLogout} className="w-full p-4 bg-white text-red-500 rounded-2xl font-bold border-2 border-red-50 shadow-sm active:bg-red-50">
        ログアウト
      </button>
    </div>
  );
}
