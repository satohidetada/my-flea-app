"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import PurchaseButton from "@/components/PurchaseButton";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

export default function ItemDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));

    // リアルタイムで商品情報を監視
    const unsub = onSnapshot(doc(db, "items", id as string), (doc) => {
      if (doc.exists()) {
        setItem({ id: doc.id, ...doc.data() });
      }
    });
    return () => unsub();
  }, [id]);

  if (!item) return <div className="p-10 text-center text-black">読み込み中...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 text-black bg-gray-50 min-h-screen">
      <button onClick={() => router.push("/")} className="text-blue-500 mb-4 inline-block hover:underline">← 戻る</button>
      
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {item.imageUrl && (
          <div className="relative h-96 w-full bg-gray-100 text-center">
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain mx-auto" />
          </div>
        )}
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-gray-800">{item.name}</h1>
            <p className="text-3xl font-black text-red-600">¥{item.price?.toLocaleString()}</p>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-bold text-lg mb-2 text-gray-700">商品の説明</h2>
            <div className="bg-gray-50 p-4 rounded-xl text-gray-600 whitespace-pre-wrap">
              {item.description || "説明はありません"}
            </div>
          </div>

          <div className="pt-4">
            {item.isSold || item.status === "sold" ? (
              <div className="space-y-4">
                <div className="w-full bg-gray-400 text-white p-4 rounded-xl font-bold text-center text-xl">
                  売り切れました
                </div>
                {/* 自分が購入者か出品者ならチャットボタンを出す */}
                {(user?.uid === item.buyerId || user?.uid === item.sellerId) && (
                  <button 
                    onClick={() => router.push(`/chat/${id}`)}
                    className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-center text-xl shadow-lg animate-bounce"
                  >
                    取引画面（チャット）へ移動
                  </button>
                )}
              </div>
            ) : (
              <PurchaseButton itemId={id as string} sellerId={item.sellerId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
