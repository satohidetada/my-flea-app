"use client";
import { useEffect, useState, Suspense } from "react"; // Suspenseを追加
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, doc, getDoc, or } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation"; // useSearchParamsを追加
import Link from "next/link";
import Header from "@/components/Header";

// useSearchParamsを使用するため、コンポーネントを分割してSuspenseで囲うのがNext.jsの推奨です
function MyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URLに ?tab=review がある場合はそれを初期値にする。なければ selling
  const initialTab = searchParams.get("tab") || "selling";

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sellingItems, setSellingItems] = useState<any[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        
        // 1. プロフィール情報取得
        try {
          const profileSnap = await getDoc(doc(db, "users", u.uid));
          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          }
        } catch (e) { console.error("Profile fetch error:", e); }

        // 2. 出品した商品
        try {
          const qSelling = query(collection(db, "items"), where("sellerId", "==", u.uid), orderBy("createdAt", "desc"));
          const snapSelling = await getDocs(qSelling);
          setSellingItems(snapSelling.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error("Selling items error:", e); }

        // 3. 購入済の商品
        try {
          const qPurchased = query(collection(db, "items"), where("buyerId", "==", u.uid));
          const snapPurchased = await getDocs(qPurchased);
          const purchasedList = snapPurchased.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPurchasedItems(purchasedList.sort((a:any, b:any) => (b.soldAt || 0) - (a.soldAt || 0)));
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
            or(where("sellerId", "==", u.uid), where("buyerId", "==", u.uid))
          );
          const snapChats = await getDocs(qChats);
          const chatList = snapChats.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setChats(chatList.sort((a:any, b:any) => (b.updatedAt || 0) - (a.updatedAt || 0)));
        } catch (e) { console.error("Chat error:", e); }

        // 6. 評価（レビュー）の取得
        try {
          const qReviews = query(
            collection(db, "users", u.uid, "reviews"),
            orderBy("createdAt", "desc")
          );
          const snapReviews = await getDocs(qReviews);
          setReviews(snapReviews.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error("Reviews error:", e); }

        setLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const handleLogout = async () => {
    if(confirm("ログアウトしますか？")) {
      await signOut(auth);
      router.push("/");
    }
  };

  if (loading) return <div className="p-10 text-center text-black font-bold">読み込み中...</div>;

  const ItemCard = ({ item }: { item: any }) => {
    const displayThumbnail = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : item.imageUrl;
    return (
      <Link href={`/items/${item.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 block transition active:scale-95">
        <div className="relative aspect-square bg-gray-50">
          <img src={displayThumbnail} className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
          {(item.status === "completed" || item.isSold) && (
            <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg backdrop-blur-sm">SOLD</div>
          )}
        </div>
        <div className="p-3">
          <p className="text-[10px] text-gray-500 truncate mb-0.5">{item.name}</p>
          <p className="font-black text-red-600">¥{item.price?.toLocaleString()}</p>
        </div>
      </Link>
    );
  };

  const ChatCard = ({ chat }: { chat: any }) => (
    <Link href={`/chat/${chat.id}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 mb-3 active:scale-95 transition shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${chat.status === "closed" ? "bg-gray-50" : "bg-red-50"}`}>
        {chat.status === "closed" ? "🏁" : "💬"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{chat.itemName || "取引チャット"}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
            chat.status === "closed" ? "bg-gray-100 text-gray-400" : 
            chat.status === "buyer_reviewed" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
          }`}>
            {chat.status === "closed" ? "取引完了" : chat.status === "buyer_reviewed" ? "評価待ち" : "進行中"}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
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
        
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mb-4 bg-gray-100 shadow-md flex items-center justify-center">
              {(profile?.photoURL || user?.photoURL) ? (
                <img src={profile?.photoURL || user?.photoURL} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="text-gray-300 text-4xl">👤</div>
              )}
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-1">{profile?.displayName || user?.displayName || "ユーザー"}</h2>
          
          <div className="flex items-center gap-1 mb-2 bg-gray-50 px-3 py-1 rounded-full">
            <span className="text-yellow-400 text-sm">⭐</span>
            <span className="text-sm font-black">{averageRating}</span>
            <span className="text-gray-400 text-[10px] ml-1 font-bold">({reviews.length})</span>
          </div>

          <div className="flex items-center gap-1 text-gray-400 text-xs mb-3 font-bold">
            <span className="text-red-500">📍</span>
            <span>{profile?.prefecture || "活動エリア未設定"}</span>
          </div>
          {profile?.bio && <p className="text-xs text-gray-500 text-center leading-relaxed mb-6 px-4 italic whitespace-pre-wrap">{profile.bio}</p>}
          
          <div className="flex gap-2 w-full max-w-xs mb-4">
            <Link href="/profile" className="flex-1 bg-black text-white text-center py-3 rounded-2xl text-xs font-bold active:scale-95 transition shadow-lg">編集</Link>
            <button onClick={handleLogout} className="flex-1 border border-gray-200 text-gray-400 py-3 rounded-2xl text-xs font-bold active:scale-95 transition">ログアウト</button>
          </div>

          <Link 
            href="/contact" 
            className="w-full max-w-xs bg-gray-50 text-gray-500 text-center py-3 rounded-2xl text-[10px] font-bold border border-gray-100 active:scale-95 transition flex items-center justify-center gap-2 mb-6"
          >
            <span>💡</span> アプリへのご意見・ご要望はこちら
          </Link>

          {/* ★ grid-cols-3 に変更して特商法を追加 */}
          <div className="w-full max-w-xs grid grid-cols-3 gap-2">
            <Link 
              href="/terms" 
              className="bg-gray-100 text-gray-600 text-center py-2.5 rounded-xl text-[9px] font-bold active:scale-95 transition border border-gray-200"
            >
              利用規約
            </Link>
            <Link 
              href="/privacy" 
              className="bg-gray-100 text-gray-600 text-center py-2.5 rounded-xl text-[9px] font-bold active:scale-95 transition border border-gray-200"
            >
              プライバシー
            </Link>
            <Link 
              href="/tokusho" 
              className="bg-gray-100 text-gray-600 text-center py-2.5 rounded-xl text-[9px] font-bold active:scale-95 transition border border-gray-200"
            >
              特商法
            </Link>
          </div>
          
          <p className="text-[9px] text-gray-300 mt-4 font-bold tracking-widest uppercase">© 2025 my-flea-app</p>
        </div> 

        <div className="flex border-b border-gray-100 mb-6 bg-white rounded-t-[2rem] px-2 overflow-x-auto no-scrollbar">
          {[
            { id: "selling", label: "出品中", count: sellingItems.filter(i => i.status !== "completed").length },
            { id: "chat", label: "取引中", count: chats.filter(c => c.status !== "closed").length },
            { id: "purchased", label: "購入済", count: purchasedItems.length },
            { id: "review", label: "評価", count: reviews.length },
            { id: "liked", label: "いいね", count: likedItems.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[70px] py-4 text-[10px] font-bold transition-all relative ${
                activeTab === tab.id ? "text-red-600" : "text-gray-400"
              }`}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span>{tab.label}</span>
                <span className="text-[9px] opacity-60">{tab.count}</span>
              </div>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
            </button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {activeTab === "selling" && (
            <div className="grid grid-cols-2 gap-3">
              {sellingItems.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex flex-col">
              {chats.filter(c => c.status !== "closed").map(chat => <ChatCard key={chat.id} chat={chat} />)}
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

          {activeTab === "review" && (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-[10px] ${i < rev.rating ? "text-yellow-400" : "text-gray-200"}`}>⭐</span>
                        ))}
                      </div>
                      <span className="text-[11px] font-black text-gray-800">{rev.fromName} さん</span>
                    </div>
                    <span className="text-[9px] text-gray-300 font-bold">{rev.createdAt?.toDate()?.toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3 whitespace-pre-wrap">{rev.comment || "コメントなし"}</p>
                  <div className="bg-gray-50 p-2 rounded-xl inline-block">
                    <p className="text-[9px] text-gray-400 font-bold">📦 {rev.itemName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {((activeTab === "selling" && sellingItems.length === 0) || (activeTab === "chat" && chats.filter(c => c.status !== "closed").length === 0) || (activeTab === "purchased" && purchasedItems.length === 0) || (activeTab === "review" && reviews.length === 0) || (activeTab === "liked" && likedItems.length === 0)) && (
            <div className="py-20 text-center text-gray-300 text-xs bg-white rounded-[2rem] border border-dashed border-gray-100 font-bold">データがありません</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-black font-bold">読み込み中...</div>}>
      <MyPageContent />
    </Suspense>
  );
}