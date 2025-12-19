"use client";
import { auth, db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PurchaseButton({ itemId, sellerId }: { itemId: string, sellerId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
    if (!auth.currentUser) return alert("ログインが必要です");
    
    // 【テスト用】自分の商品でも買えるようにチェックを外したままにします
    if (!confirm("【テスト購入】この商品を購入しますか？")) return;

    setLoading(true);
    try {
      const itemRef = doc(db, "items", itemId);
      await updateDoc(itemRef, {
        isSold: true,
        buyerId: auth.currentUser.uid
      });
      alert("購入が完了しました！");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("購入に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePurchase}
      disabled={loading}
      className="w-full bg-red-500 text-white p-4 rounded-full font-bold text-lg hover:bg-red-600 disabled:bg-gray-400 mt-4"
    >
      {loading ? "処理中..." : "購入手続きへ"}
    </button>
  );
}
