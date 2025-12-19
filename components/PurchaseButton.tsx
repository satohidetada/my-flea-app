"use client";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";

export default function PurchaseButton({ itemId, sellerId }: { itemId: string; sellerId: string }) {
  const router = useRouter();
  const user = auth.currentUser;

  const handleClick = () => {
    if (!user) {
      alert("ログインが必要です");
      return;
    }
    if (user.uid === sellerId) {
      alert("自分の商品は購入できません");
      return;
    }
    // 購入確認画面へ移動
    router.push(`/items/${itemId}/buy`);
  };

  return (
    <button 
      onClick={handleClick}
      className="w-full bg-red-600 text-white p-4 rounded-xl font-bold text-center text-xl shadow-lg hover:bg-red-700 transition"
    >
      購入手続きへ
    </button>
  );
}
