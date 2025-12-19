import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import PurchaseButton from "@/components/PurchaseButton";
import TransactionMessage from "@/components/TransactionMessage";
import Link from "next/link";

export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const itemId = resolvedParams.id;

  const docRef = doc(db, "items", itemId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return <div className="p-10 text-center">商品が見つかりません</div>;
  }

  const item = docSnap.data();

  return (
    <div className="max-w-2xl mx-auto p-4 text-black bg-gray-50 min-h-screen">
      <Link href="/" className="text-blue-500 mb-4 inline-block hover:underline">← 戻る</Link>
      
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {item.imageUrl && (
          <div className="relative h-96 w-full bg-gray-100">
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-gray-800">{item.name}</h1>
            <p className="text-3xl font-black text-red-600">¥{item.price?.toLocaleString()}</p>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-bold text-lg mb-2 text-gray-700">商品の説明</h2>
            <div className="bg-gray-50 p-4 rounded-xl text-gray-600 leading-relaxed whitespace-pre-wrap">
              {item.description || "説明はありません"}
            </div>
          </div>

          <div className="pt-4">
            {item.isSold ? (
              <div className="space-y-6">
                <div className="w-full bg-gray-400 text-white p-4 rounded-full font-bold text-center text-xl shadow-inner">
                  売り切れました
                </div>
                {/* 売り切れ（購入後）の場合のみメッセージ欄を表示 */}
                <TransactionMessage itemId={itemId} />
              </div>
            ) : (
              <PurchaseButton itemId={itemId} sellerId={item.sellerId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
