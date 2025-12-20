"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

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
      // 1. 商品を売り切れにする
      await updateDoc(doc(db, "items", id), {
        status: "sold",
        isSold: true,
        buyerId: currentUser.uid,
        soldAt: serverTimestamp(),
      });

      // 2. チャットルームを作る
      await setDoc(doc(db, "chats", id), {
        itemId: id,
        itemName: item.name,
        sellerId: item.sellerId,
        buyerId: currentUser.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // ★ 3. 重要：通知データを作成する
      await addDoc(collection(db, "notifications"), {
        userId: item.sellerId, // 出品者のID
        title: "商品が売れました！",
        body: `「${item.name}」が購入されました。`,
        link: `/chat/${id}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      alert("購入が完了しました！通知を確認してください。");
      router.push("/"); // ベルを確認するためにトップへ

    } catch (error: any) {
      alert("エラー: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return <div className="p-10 text-center text-black">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-gray-50 text-black p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border">
        <h1 className="text-xl font-bold mb-6 text-center">購入の最終確認</h1>
        <div className="flex gap-4 mb-8 p-4 bg-gray-50 rounded-2xl">
          <img src={item.imageUrl} className="w-16 h-16 object-cover rounded-xl" />
          <div>
            <p className="font-bold text-sm">{item.name}</p>
            <p className="text-red-600 font-bold">¥{item.price?.toLocaleString()}</p>
          </div>
        </div>
        <button 
          onClick={handleBuy}
          disabled={loading}
          className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg disabled:bg-gray-300"
        >
          {loading ? "処理中..." : "購入を確定する"}
        </button>
      </div>
    </main>
  );
}
