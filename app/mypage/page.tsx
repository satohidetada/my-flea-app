"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [sellingItems, setSellingItems] = useState<any[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("selling");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        
        // 1. 出品した商品
        const qSelling = query(collection(db, "items"), where("sellerId", "==", u.uid), orderBy("createdAt", "desc"));
        const snapSelling = await getDocs(qSelling);
        setSellingItems(snapSelling.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // 2. 購入（取引済）した商品
        const qPurchased = query(collection(db, "items"), where("buyerId", "==", u.uid), orderBy("soldAt", "desc"));
        const snapPurchased = await getDocs(qPurchased);
        setPurchasedItems(snapPurchased.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // 3. いいねした商品
        const qLikes = query(collection(db, "users", u.uid, "likes"));
        const snapLikes = await getDocs(qLikes);
        const likedItemIds = snapLikes.docs.map(d => d.id);
        
        if (likedItemIds.length > 0) {
          const itemsData = await Promise.all(
            likedItemIds.map(async (id) => {
              const d = await getDocs(query(collection(db, "items"), where("__name__", "==", id)));
              return d.docs[0] ? { id: d.docs[0].id, ...d.docs[0].data() } : null;
            })
          );
          setLikedItems(itemsData.filter(i => i !== null));
        }
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if(confirm("ログアウトしますか？")) {
      await signOut(auth);
      router.push("/");
    }
  };

  if (!user) return <div className="p-10 text-center text-black">読み込み中...</div>;

  const ItemCard = ({ item }: { item: any }) => (
    <Link href={`/items/${item.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 block">
      <div className="relative aspect-square">
        <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
        {item.isSold && (
          <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg shadow-md">SOLD</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-500 truncate">{item.name}</p>
        <p className="font-bold text-red-600">¥{item.price?.toLocaleString()}</p>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Header />
      <main className="max-w-2xl mx-auto p-4 pb-20">
        
        {/* プロフィールセクション */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mb-4 bg-gray-100 shadow-md">
            {user.photoURL ? (
              <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">👤</div>
            )}
          </div>
          <h2 className="text-xl font-bold mb-1">{user.displayName || "ユーザー"}</h2>
          <p className="text-xs text-gray-400 mb-6">{user.email}</p>
          
          <div className="flex gap-2 w-full max-w-xs">
            <Link href="/profile" className="flex-1 bg-gray-900 text-white text-center py-3 rounded-2xl text-xs font-bold active:scale-95 transition">
              プロフィール編集
            </Link>
            <button onClick={handleLogout} className="flex-1 border border-gray-200 text-gray-400 py-3 rounded-2xl text-xs font-bold active:scale-95 transition">
              ログアウト
            </button>
          </div>
        </div>

        {/* サポートボタン（目立つ位置に配置） */}
        <Link 
          href="/contact" 
          className="flex justify-between items-center p-5 bg-white rounded-2xl text-sm font-bold shadow-sm border border-red-50 mb-6 hover:bg-red-50 transition active:scale-95"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💡</span>
            <span className="text-gray-700">運営への要望・不具合報告</span>
          </div>
          <span className="text-red-400">›</span>
        </Link>

        {/* タブ切り替えメニュー */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-2xl px-2">
          {[
            { id: "selling", label: "出品", count: sellingItems.length },
            { id: "purchased", label: "取引済", count: purchasedItems.length },
            { id: "liked", label: "いいね", count: likedItems.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-xs font-bold transition-all relative ${
                activeTab === tab.id ? "text-red-600" : "text-gray-400"
              }`}
            >
              {tab.label} <span className="ml-1 opacity-60">{tab.count}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
            </button>
          ))}
        </div>

        {/* 商品一覧グリッド */}
        <div className="grid grid-cols-2 gap-3">
          {activeTab === "selling" && sellingItems.map(item => <ItemCard key={item.id} item={item} />)}
          {activeTab === "purchased" && purchasedItems.map(item => <ItemCard key={item.id} item={item} />)}
          {activeTab === "liked" && likedItems.map(item => <ItemCard key={item.id} item={item} />)}
        </div>

        {/* 空の状態の表示 */}
        {((activeTab === "selling" && sellingItems.length === 0) ||
          (activeTab === "purchased" && purchasedItems.length === 0) ||
          (activeTab === "liked" && likedItems.length === 0)) && (
          <div className="py-20 text-center text-gray-400 text-sm bg-white rounded-3xl border border-dashed border-gray-200">
            表示する商品がありません
          </div>
        )}
      </main>
    </div>
  );
}
