"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";
import Header from "@/components/Header";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]); // 検索結果用
  const [searchQuery, setSearchQuery] = useState(""); // 検索ワード
  const [user, setUser] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<string[]>([]);

  useEffect(() => {
    // 1. 商品一覧のリアルタイム取得
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsubItems = onSnapshot(q, (s) => {
      const allItems = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(allItems);
      setFilteredItems(allItems);
    });

    // 2. ログイン状態と自分のいいねリストの取得
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        const unsubLikes = onSnapshot(collection(db, "users", u.uid, "likes"), (s) => {
          setUserLikes(s.docs.map(d => d.id));
        });
        return () => unsubLikes();
      } else {
        setUserLikes([]);
      }
    });

    return () => { unsubItems(); unsubAuth(); };
  }, []);

  // 検索フィルタリング
  useEffect(() => {
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const toggleLike = async (e: React.MouseEvent, itemId: string, currentIsLiked: boolean) => {
    e.preventDefault();
    if (!user) return alert("いいねするにはログインが必要です");

    const itemRef = doc(db, "items", itemId);
    const userLikeRef = doc(db, "users", user.uid, "likes", itemId);

    if (currentIsLiked) {
      await deleteDoc(userLikeRef);
      await updateDoc(itemRef, { likeCount: increment(-1) });
    } else {
      await setDoc(userLikeRef, { createdAt: new Date() });
      await updateDoc(itemRef, { likeCount: increment(1) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-black">
      <Header />
      
      {/* 🔍 検索窓（ヘッダー直下に固定） */}
      <div className="sticky top-14 z-10 bg-white/80 backdrop-blur-md p-3 border-b border-gray-100">
        <div className="max-w-4xl mx-auto relative">
          <input 
            type="text"
            placeholder="キーワードから探す"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 py-3 pl-10 pr-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 📱 グリッドレイアウト（可変設定） */}
      <main className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
        {filteredItems.map((item) => {
          const isLiked = userLikes.includes(item.id);
          return (
            <div key={item.id} className="relative group">
              <Link href={`/items/${item.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 block h-full active:scale-[0.98] transition">
                <div className="aspect-square bg-gray-200 relative">
                  <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                  {item.isSold && (
                    <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg shadow-md">SOLD</div>
                  )}
                </div>
                <div className="p-2 pb-10">
                  <p className="text-xs text-gray-500 truncate">{item.name}</p>
                  <p className="font-bold text-sm text-red-600">¥{item.price?.toLocaleString()}</p>
                </div>
              </Link>
              
              <button 
                onClick={(e) => toggleLike(e, item.id, isLiked)}
                className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-100 shadow-sm active:scale-90 transition hover:bg-white"
              >
                <span className={isLiked ? "text-red-500" : "text-gray-300 text-xs"}>
                  {isLiked ? "❤️" : "🤍"}
                </span>
                <span className="text-[10px] font-bold text-gray-500">{item.likeCount || 0}</span>
              </button>
            </div>
          );
        })}
      </main>

      {/* 検索結果ゼロの表示 */}
      {filteredItems.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">💨</p>
          <p className="text-sm italic">該当する商品は見つかりませんでした</p>
        </div>
      )}

      <Link href="/upload" className="fixed bottom-6 right-6 bg-red-600 text-white w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-2xl font-bold text-[10px] active:scale-90 transition-transform z-20">
        <span className="text-2xl mb-[-4px]">📸</span>
        出品
      </Link>
    </div>
  );
}
