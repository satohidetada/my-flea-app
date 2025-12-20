"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, doc, getDoc, or } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sellingItems, setSellingItems] = useState<any[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("selling");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        
        // 1. プロフィール情報取得 (ここを最速で終わらせる)
        try {
          const profileSnap = await getDoc(doc(db, "users", u.uid));
          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          }
        } catch (e) { console.error("Profile fetch error:", e); }

        // 各種データの取得（1つがエラーになっても他を表示できるようにtry-catchを分ける）
        
        // 2. 出品した商品
        try {
          const qSelling = query(collection(db, "items"), where("sellerId", "==", u.uid), orderBy("createdAt", "desc"));
          const snapSelling = await getDocs(qSelling);
          setSellingItems(snapSelling.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error("Selling items error (Index might be missing):", e); }

        // 3. 購入済の商品
        try {
          const qPurchased = query(collection(db, "items"), where("buyerId", "==", u.uid), orderBy("soldAt", "desc"));
          const snapPurchased = await getDocs(qPurchased);
          setPurchasedItems(snapPurchased.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error("Purchased items error:", e); }

        // 4. いいねした商品
        try {
          const qLikes = query(collection(db, "users", u.uid, "likes"));
          const snapLikes = await getDocs(qLikes);
          const likedItemIds = snapLikes.docs.map(d => d.id);
          if (likedItemIds.length > 0) {
            const itemsData = await Promise.all(
              likedItemIds.map(async (id) => {
                const d = await getDoc(doc(db, "items", id));
                return d.exists() ? { id: d.id, ...d.data() } : null;
              })
            );
            setLikedItems(itemsData.filter(i => i !== null));
          }
        } catch (e) { console.error("Likes error:", e); }

        // 5. 取引チャット一覧
        try {
          const qChats = query(
            collection(db, "chats"),
            or(where("sellerId", "==", u.uid), where("buyerId", "==", u.uid)),
            orderBy("updatedAt", "desc")
          );
          const snapChats = await getDocs(qChats);
          setChats(snapChats.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error("Chat error:", e); }

        setLoading(false);
      } else {
        router.push("/login");
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

  if (loading) return <div className="p-10 text-center text-black font-bold">読み込み中...</div>;

  const ItemCard = ({ item }: { item: any }) => (
    <Link href={`/items/${item.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 block transition active:scale-95">
      <div className="relative aspect-square">
        <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
        {item.isSold && (
          <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg shadow-md">SOLD</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[10px] text-gray-500 truncate">{item.name}</p>
        <p className="font-bold text-red-600">¥{item.price?.toLocaleString()}</p>
      </div>
    </Link>
  );

  const ChatCard = ({ chat }: { chat: any }) => (
    <Link href={`/chat/${chat.id}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 mb-3 active:scale-95 transition shadow-sm">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl shadow-inner">💬</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{chat.itemName || "取引チャット"}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            chat.status === "closed" ? "bg-gray-100 text-gray-400" : "bg-green-100 text-green-600"
          }`}>
            {chat.status === "closed" ? "取引完了" : "進行中"}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            {chat.sellerId === user.uid ? "出品" : "購入"}
          </span>
        </div>
      </div>
      <span className="text-gray-300">›</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Header />
      <main className="max-w-2xl mx-auto p-4 pb-20">
        
        {/* プロフィールセクション */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mb-4 bg-gray-100 shadow-md flex items-center justify-center">
            {/* 修正点: profile.photoURL を最優先にし、キャッシュを考慮 */}
            {(profile?.photoURL || user?.photoURL) ? (
              <img 
                src={profile?.photoURL || user?.photoURL} 
                className="w-full h-full object-cover" 
                alt="Profile"
                key={profile?.photoURL} // URLが変わった時に再レンダリングを強制
              />
            ) : (
              <div className="text-gray-300 text-4xl">👤</div>
            )}
          </div>
          
          <h2 className="text-xl font-bold mb-1">{profile?.displayName || user?.displayName || "ユーザー"}</h2>
          
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-3 font-bold">
            <span className="text-red-500">📍</span>
            <span>{profile?.prefecture || "活動エリア未設定"}</span>
          </div>
          {profile?.bio && <p className="text-xs text-gray-600 text-center leading-relaxed mb-6 px-4 italic whitespace-pre-wrap">{profile.bio}</p>}
          
          <div className="flex gap-2 w-full max-w-xs">
            <Link href="/profile" className="flex-1 bg-gray-900 text-white text-center py-3 rounded-2xl text-xs font-bold active:scale-95 transition">プロフィール編集</Link>
            <button onClick={handleLogout} className="flex-1 border border-gray-200 text-gray-400 py-3 rounded-2xl text-xs font-bold active:scale-95 transition">ログアウト</button>
          </div>
        </div>

        {/* タブ切り替えメニュー */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-2xl px-2">
          {[
            { id: "selling", label: "出品", count: sellingItems.length },
            { id: "chat", label: "取引中", count: chats.filter(c => c.status !== "closed").length },
            { id: "purchased", label: "取引済", count: purchasedItems.length },
            { id: "liked", label: "いいね", count: likedItems.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-[10px] sm:text-xs font-bold transition-all relative ${
                activeTab === tab.id ? "text-red-600" : "text-gray-400"
              }`}
            >
              {tab.label} <span className="ml-0.5 opacity-60">{tab.count}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
            </button>
          ))}
        </div>

        {/* 表示エリア */}
        <div>
          {activeTab === "selling" && (
            <div className="grid grid-cols-2 gap-3">
              {sellingItems.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex flex-col">
              {chats.map(chat => <ChatCard key={chat.id} chat={chat} />)}
            </div>
          )}

          {activeTab === "purchased" && (
            <div className="grid grid-cols-2 gap-3">
              {purchasedItems.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}

          {activeTab === "liked" && (
            <div className="grid grid-cols-2 gap-3">
              {likedItems.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}

          {/* 空の状態の表示ロジック修正 */}
          {((activeTab === "selling" && sellingItems.length === 0) ||
            (activeTab === "chat" && chats.length === 0) ||
            (activeTab === "purchased" && purchasedItems.length === 0) ||
            (activeTab === "liked" && likedItems.length === 0)) && (
            <div className="py-20 text-center text-gray-400 text-sm bg-white rounded-b-3xl border border-dashed border-gray-200 font-bold">
              表示する項目がありません
            </div>
          )}
        </div>
      </main>
    </div>
  );
}