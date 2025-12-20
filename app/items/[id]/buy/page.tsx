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

    // ★ ここで確認ダイアログを表示
    const ok = window.confirm(`「${item.name}」を購入しますか？\n※この操作は取り消せません。`);
    if (!ok) return;

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

      // 3. 通知データを作成
      await addDoc(collection(db, "notifications"), {
        userId: item.sellerId,
        title: "商品が売れました！",
        body: `「${item.name}」が購入されました。`,
        link: `/chat/${id}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      alert("購入が完了しました！");
      router.push(`/chat/${id}`); // 購入後はそのままチャットへ飛ばすのがスムーズです

    } catch (error: any) {
      alert("エラー: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return <div className="p-10 text-center text-black">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-gray-50 text-black p-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border">
        <h1 className="text-xl font-bold mb-6 text-center text-red-600">購入内容の最終確認</h1>
        
        <div className="flex gap-4 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <img src={item.imageUrl} className="w-20 h-20 object-cover rounded-xl shadow-sm" alt="" />
          <div className="flex flex-col justify-center">
            <p className="font-bold text-sm text-gray-700">{item.name}</p>
            <p className="text-red-600 font-extrabold text-xl">¥{item.price?.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl mb-8 text-xs text-yellow-700 leading-relaxed">
          <p>⚠️ <b>ご注意：</b></p>
          <p>購入後のキャンセルは出品者との合意が必要です。内容をよくご確認の上、手続きを完了してください。</p>
        </div>

        <button 
          onClick={handleBuy}
          disabled={loading || item.isSold}
          className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition disabled:bg-gray-300"
        >
          {loading ? "決済処理中..." : "購入を確定する"}
        </button>

        <button 
          onClick={() => router.back()}
          className="w-full mt-4 text-gray-400 text-sm font-bold py-2 hover:text-gray-600"
        >
          前の画面に戻る
        </button>
      </div>
    </main>
  );
}
