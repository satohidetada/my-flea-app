"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function UploadPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const GAS_URL = "https://script.google.com/macros/s/AKfycby8EALWBchN8UKI4_jbSOWTmfkheV4oUAfE1Wes687iBg612rOzO0PVc1vlmY8uTcU/exec";
  const SECRET_API_KEY = "my-secret-token-777";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        alert("出品するにはログインが必要です。");
        router.push("/");
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !user || !name || !price || !description) {
      alert("必須項目をすべて入力してください。");
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result?.toString().split(",")[1] || "");
        reader.readAsDataURL(image);
      });
      const base64Data = await base64Promise;

      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({
          apiKey: SECRET_API_KEY,
          imageBase64: base64Data,
          fileName: image.name,
          userId: user.uid
        }),
      });

      const text = await response.text();
      let result = JSON.parse(text);
      if (result.error) throw new Error(result.error);

      await addDoc(collection(db, "items"), {
        name,
        price: Number(price),
        description,
        imageUrl: result.url,
        sellerId: user.uid,
        sellerName: user.displayName || "匿名ユーザー",
        status: "on_sale",
        isSold: false,
        likeCount: 0,
        createdAt: serverTimestamp(),
      });

      alert("出品が完了しました！");
      router.push("/");
    } catch (error: any) {
      alert("エラー: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black pb-10">
      <Header />
      <main className="p-4 flex flex-col items-center">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-xl font-bold mb-6 text-red-600">📸 NOMIに出品する</h1>
          
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">商品画像</label>
              <input 
                type="file" accept="image/*" 
                onChange={(e) => setImage(e.target.files?.[0] || null)} 
                className="w-full text-sm border-2 border-dashed p-4 rounded-2xl bg-gray-50 border-gray-200" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">商品名</label>
              <input 
                type="text" value={name} onChange={(e) => setName(e.target.value)} 
                className="w-full border-b-2 py-2 outline-none focus:border-red-500 transition text-lg" 
                placeholder="例: ハンドメイドのアクセサリー" required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">価格 (円)</label>
              <input 
                type="number" value={price} onChange={(e) => setPrice(e.target.value)} 
                className="w-full border-b-2 py-2 outline-none focus:border-red-500 transition text-lg" 
                placeholder="3000" required 
              />
            </div>

            {/* ★ ここが追加されていることを確認してください！ */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">商品の詳細説明</label>
              <textarea 
                value={description} onChange={(e) => setDescription(e.target.value)} 
                className="w-full border-2 rounded-2xl p-4 text-sm h-40 outline-none focus:border-red-500 bg-gray-50 transition border-gray-100" 
                placeholder="商品の状態、色、サイズ、発送方法などを詳しく書いてください" required 
              />
            </div>

            <button 
              type="submit" disabled={loading} 
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition active:scale-95 ${
                loading ? "bg-gray-300" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? "アップロード中..." : "出品を確定する"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
