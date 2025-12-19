"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ★ご自身のGASウェブアプリURLをここに貼り付けてください
  const GAS_URL = "ここにGASのURLを貼り付け";
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
    if (!image || !user || !name || !price) {
      alert("必須項目をすべて入力してください。");
      return;
    }

    setLoading(true);
    try {
      // 1. 画像をBase64に変換
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const res = reader.result?.toString().split(",")[1];
          resolve(res || "");
        };
        reader.readAsDataURL(image);
      });
      const base64Data = await base64Promise;

      // 2. GASのコードの変数名（apiKey, imageBase64等）に合わせて送信
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({
          apiKey: SECRET_API_KEY,
          imageBase64: base64Data,
          fileName: image.name,
          userId: user.uid
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // 3. Firestoreに保存（GASから返ってきたURLを使用）
      await addDoc(collection(db, "items"), {
        name,
        price: Number(price),
        description,
        imageUrl: result.url,
        sellerId: user.uid,
        sellerName: user.displayName,
        status: "on_sale",
        createdAt: serverTimestamp(),
      });

      alert("NOMIへの出品が完了しました！");
      router.push("/");
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert("エラーが発生しました: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-black">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-red-600">NOMIに出品</h1>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">商品画像</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">商品名</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">価格 (円)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 rounded" required />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg font-bold text-white ${loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}>
            {loading ? "ドライブへ保存中..." : "出品を確定する"}
          </button>
        </form>
      </div>
    </div>
  );
}
