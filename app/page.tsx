"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";
import Header from "@/components/Header";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県",
  "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [showOnlyLikes, setShowOnlyLikes] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [user, setUser] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsubItems = onSnapshot(q, (s) => {
      setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        const unsubLikes = onSnapshot(collection(db, "users", u.uid, "likes"), (s) => {
          setUserLikes(s.docs.map(d => d.id));
        });
        return () => unsubLikes();
      } else {
        setUserLikes([]);
        setShowOnlyLikes(false);
      }
    });
    return () => { unsubItems(); unsubAuth(); };
  }, []);

  useEffect(() => {
    let result = [...items];

    if (searchQuery) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedPrefs.length > 0) {
      result = result.filter(item => selectedPrefs.includes(item.sellerPrefecture));
    }

    if (showOnlyLikes) {
      result = result.filter(item => userLikes.includes(item.id));
    }

    result.sort((a, b) => {
      if (sortBy === "newest") return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "likes") return (b.likeCount || 0) - (a.likeCount || 0);
      return 0;
    });

    setFilteredItems(result);
  }, [searchQuery, selectedPrefs, showOnlyLikes, sortBy, items, userLikes]);

  const togglePref = (pref: string) => {
    setSelectedPrefs(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

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
      
      <div className="sticky top-14 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto p-3 space-y-3">
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text"
                placeholder="キーワード検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20 font-medium"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-100 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 outline-none border-none appearance-none cursor-pointer"
            >
              <option value="newest">新着順</option>
              <option value="price_asc">安い順</option>
              <option value="price_desc">高い順</option>
              <option value="likes">いいね順</option>
            </select>
          </div>

          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 shrink-0 max-w-full">
              {user && (
                <button 
                  onClick={() => setShowOnlyLikes(!showOnlyLikes)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                    showOnlyLikes 
                      ? "bg-red-50 border-red-200 text-red-600 shadow-sm" 
                      : "bg-white border-gray-200 text-gray-500"
                  }`}
                >
                  {showOnlyLikes ? "❤️ いいね済み" : "🤍 いいね済み"}
                </button>
              )}

              <div className="w-[1px] h-4 bg-gray-200 self-center mx-1" />

              <button 
                onClick={() => { setSelectedPrefs([]); setShowOnlyLikes(false); }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
                  (selectedPrefs.length === 0 && !showOnlyLikes) ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                すべて
              </button>
              {PREFECTURES.map(pref => (
                <button 
                  key={pref}
                  onClick={() => togglePref(pref)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                    selectedPrefs.includes(pref) 
                      ? "bg-gray-800 text-white shadow-md scale-105" 
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
        {filteredItems.map((item) => {
          const isLiked = userLikes.includes(item.id);
          return (
            <div key={item.id} className="relative group">
              <Link href={`/items/${item.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 block h-full active:scale-[0.98] transition">
                <div className="aspect-square bg-gray-50 relative">
                  {/* ★ Googleドライブの画像表示をスマホで許可するための設定を追加 */}
            <img 
  src={item.imageUrls ? item.imageUrls[0] : item.imageUrl} 
  className="w-full h-full object-cover" 
  alt={item.name} 
  loading="lazy" 
  referrerPolicy="no-referrer"
/>
                  {item.isSold && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-sm rotate-[-10deg] shadow-lg">SOLD OUT</span>
                    </div>
                  )}
                </div>
                <div className="p-2 pb-10">
                  <p className="text-[10px] text-gray-400 font-bold mb-0.5">{item.sellerPrefecture || "地域不明"}</p>
                  <p className="text-xs text-gray-700 truncate font-medium">{item.name}</p>
                  <p className="font-black text-sm text-red-600 mt-1">¥{item.price?.toLocaleString()}</p>
                </div>
              </Link>
              
              <button 
                onClick={(e) => toggleLike(e, item.id, isLiked)}
                className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm shadow-md px-2.5 py-1 rounded-full border border-gray-50 active:scale-90 transition"
              >
                <span className="text-xs">{isLiked ? "❤️" : "🤍"}</span>
                <span className="text-[10px] font-extrabold text-gray-600">{item.likeCount || 0}</span>
              </button>
            </div>
          );
        })}
      </main>

      {filteredItems.length === 0 && (
        <div className="text-center py-32 text-gray-300">
          <p className="text-5xl mb-4">{showOnlyLikes ? "❤️" : "🏜️"}</p>
          <p className="text-xs font-bold">
            {showOnlyLikes ? "いいねした商品はまだありません" : "条件に合う商品が見つかりませんでした"}
          </p>
        </div>
      )}

      <Link href="/upload" className="fixed bottom-6 right-6 bg-red-600 text-white w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-2xl font-black text-[9px] active:scale-90 transition z-30">
        <span className="text-xl">📸</span> 出品
      </Link>
    </div>
  );
}