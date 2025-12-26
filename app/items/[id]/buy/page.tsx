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

    // 確認ダイアログ
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
        status: "active", // 取引状態を管理
      }, { merge: true });

      // 3. 通知データを作成（出品者へ）
      await addDoc(collection(db, "users", item.sellerId, "notifications"), {
        type: "buy",
        title: "商品が売れました！",
        body: `「${item.name}」が購入されました。チャットで待ち合わせを決めてください。`,
        link: `/chat/${id}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // 4. 通知データを作成（自分・購入者へ） ★ここを追加
      await addDoc(collection(db, "users", currentUser.uid, "notifications"), {
        type: "purchased",
        title: "購入が完了しました",
        body: `「${item.name}」を購入しました。チャットで挨拶しましょう！`,
        link: `/chat/${id}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      alert("購入が完了しました！");
      router.push(`/chat/${id}`);

    } catch (error: any) {
      alert("エラー: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return <div className="p-10 text-center text-black">読み込み中...</div>;

  const displayThumbnail = (item.imageUrls && item.imageUrls.length > 0) 
    ? item.imageUrls[0] 
    : item.imageUrl;

  return (
    <main className="min-h-screen bg-gray-50 text-black p-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h1 className="text-xl font-bold mb-6 text-center text-red-600">購入内容の最終確認</h1>
        
        <div className="flex gap-4 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 items-center">
          <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-xl overflow-hidden shadow-sm">
            <img 
              src={displayThumbnail} 
              className="w-full h-full object-cover" 
              alt={item.name}
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-bold text-sm text-gray-700">{item.name}</p>
            <p className="text-red-600 font-extrabold text-xl">¥{item.price?.toLocaleString()}</p>
          </div>
        </div>

        {/* 警告文の趣旨を直接取引に合わせて修正 */}
        <div className="bg-orange-50 p-4 rounded-xl mb-8 border border-orange-100">
          <p className="text-[10px] font-bold text-orange-700 uppercase mb-1">⚠️ 重要：取引ルール</p>
          <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
            このアプリに決済機能はありません。代金の支払いは、<b>受け渡し時に直接現金</b>で行ってください。購入確定後、チャットで「いつ・どこで」会うかを相談してください。
          </p>
        </div>

        <button 
          onClick={handleBuy}
          disabled={loading || item.isSold}
          className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-100 active:scale-95 transition disabled:bg-gray-300"
        >
          {loading ? "処理中..." : "購入を確定する"}
        </button>

        <button 
          onClick={() => router.back()}
          className="w-full mt-4 text-gray-400 text-sm font-bold py-2 hover:text-gray-600 transition"
        >
          前の画面に戻る
        </button>
      </div>
    </main>
  );
}