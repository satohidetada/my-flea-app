"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, doc, getDoc, collectionGroup } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [boughtItems, setBoughtItems] = useState<any[]>([]);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(u);
      
      try {
        // 1. 出品した商品を取得
        const qMine = query(collection(db, "items"), where("sellerId", "==", u.uid), orderBy("createdAt", "desc"));
        const mineSnap = await getDocs(qMine);
        setMyItems(mineSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 2. 購入した商品を取得
        const qBought = query(collection(db, "items"), where("buyerId", "==", u.uid), orderBy("soldAt", "desc"));
        const boughtSnap = await getDocs(qBought);
        setBoughtItems(boughtSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 3. いいねした商品を取得
        const likesQuery = query(collectionGroup(db, "likes"), where("userId", "==", u.uid));
        const likesSnap = await getDocs(likesQuery);
        const itemPromises = likesSnap.docs.map(async (likeDoc) => {
          const itemRef = likeDoc.ref.parent.parent;
          if (itemRef) {
            const itemSnap = await getDoc(itemRef);
            return itemSnap.exists() ? { id: itemSnap.id, ...itemSnap.data() } : null;
          }
          return null;
        });
        const items = await Promise.all(itemPromises);
        setLikedItems(items.filter(i => i !== null));

      } catch (e) {
        console.error("データの取得に失敗:", e);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-10 text-center text-black font-bold">読み込み中...</div>;
  if (!user) return <div className="p-10 text-center"><Link href="/" className="text-blue-500">ログインしてください</Link></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20 text-black max-w-lg mx-auto">
      {/* ユーザーヘッダー */}
      <div className="bg-white p-6 border-b flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mb-2 flex items-center justify-center text-2xl">👤</div>
        <h2 className="font-bold">{user.email}</h2>
        <button onClick={() => router.push("/")} className="text-xs text-blue-500 mt-2">← ホームへ戻る</button>
      </div>

      <div className="p-4 space-y-8">
        {/* いいねセクション（横スクロール） */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">❤️ いいね！</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {likedItems.map(item => (
              <Link href={`/items/${item.id}`} key={item.id} className="min-w-[100px] bg-white border rounded-lg overflow-hidden shadow-sm">
                <img src={item.imageUrl} className="w-full aspect-square object-cover" alt="" />
                <div className="p-1.5 text-[10px] font-bold">¥{item.price?.toLocaleString()}</div>
              </Link>
            ))}
            {likedItems.length === 0 && <div className="text-[10px] text-gray-400 p-4 border rounded-lg w-full text-center">なし</div>}
          </div>
        </section>

        {/* 出品中の商品 */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest border-l-4 border-red-500 pl-2">出品・販売状況</h3>
          <div className="space-y-3">
            {myItems.map(item => (
              <Link href={`/items/${item.id}`} key={item.id} className="flex bg-white border rounded-xl overflow-hidden shadow-sm p-2 gap-3">
                <img src={item.imageUrl} className="w-20 h-20 object-cover rounded-lg" alt="" />
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <p className="text-xs font-bold truncate">{item.name}</p>
                    <p className="text-sm font-black text-red-500">¥{item.price?.toLocaleString()}</p>
                  </div>
                  {item.isSold ? (
                    <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full w-fit font-bold">取引成立（受渡待ち）</span>
                  ) : (
                    <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full w-fit font-bold">出品中</span>
                  )}
                </div>
              </Link>
            ))}
            {myItems.length === 0 && <p className="text-center py-6 text-gray-400 text-xs bg-white rounded-xl border border-dashed">出品した商品はありません</p>}
          </div>
        </section>

        {/* 購入した商品 */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest border-l-4 border-blue-500 pl-2">購入した商品</h3>
          <div className="space-y-3">
            {boughtItems.map(item => (
              <Link href={`/items/${item.id}`} key={item.id} className="flex bg-white border rounded-xl overflow-hidden shadow-sm p-2 gap-3 opacity-90">
                <img src={item.imageUrl} className="w-20 h-20 object-cover rounded-lg grayscale-[20%]" alt="" />
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <p className="text-xs font-bold truncate">{item.name}</p>
                    <p className="text-sm font-black">¥{item.price?.toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded-full w-fit font-bold">購入済み（代金準備）</span>
                </div>
              </Link>
            ))}
            {boughtItems.length === 0 && <p className="text-center py-6 text-gray-400 text-xs bg-white rounded-xl border border-dashed">購入した商品はありません</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
