"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function BuyConfirm() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "items", id)).then(s => s.exists() && setItem({ id: s.id, ...s.data() }));
  }, [id]);

  const handleBuy = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !item) return;

    setLoading(true);
    try {
      // 1. 商品ステータス更新
      await updateDoc(doc(db, "items", id), {
        status: "sold",
        isSold: true,
        buyerId: currentUser.uid,
        soldAt: serverTimestamp(),
      });

      // 2. チャットルーム作成
      await setDoc(doc(db, "chats", id), {
        itemId: id,
        itemName: item.name,
        sellerId: item.sellerId,
        buyerId: currentUser.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      alert("購入が完了しました！取引チャットへ移動します。");

      // ★ここが重要：トップではなくチャットへ直接飛ばす
      router.push(`/chat/${id}`);

    } catch (error: any) {
      alert("エラー: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return <div className="p-10 text-center text-black">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-gray-50 text-black p-4">
      <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow">
        <h1 className="text-xl font-bold mb-4">購入を確定しますか？</h1>
        <div className="flex gap-4 mb-6">
          <img src={item.imageUrl} className="w-20 h-20 object-cover rounded" />
          <div>
            <p className="font-bold">{item.name}</p>
            <p className="text-red-600 font-bold">¥{item.price?.toLocaleString()}</p>
          </div>
        </div>
        <button 
          onClick={handleBuy}
          disabled={loading}
          className="w-full bg-red-600 text-white font-bold py-4 rounded-xl disabled:bg-gray-300"
        >
          {loading ? "処理中..." : "購入を確定する"}
        </button>
      </div>
    </main>
  );
}
