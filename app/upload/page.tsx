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

  // ★1でコピーした「ウェブアプリ URL」をここに貼り付けてください！
  const GAS_URL = "1JaZDcllGXEWqhwn4QwdZFLIw7epwG2CtqHazAKAt86eRLCPv0h5PPmND";
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
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result?.toString().split(",")[1] || "");
        reader.readAsDataURL(image);
      });
      const base64Data = await base64Promise;

      // GASへの送信（リダイレクトを考慮し、フェッチ設定を最適化）
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
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        throw new Error("GASからの応答がJSONではありません。デプロイ設定（全員に公開）を確認してください。");
      }
      
      if (result.error) throw new Error(result.error);

      // Firestoreに保存
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
      alert("エラー: " + error.message);
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
            {loading ? "送信中..." : "出品を確定する"}
          </button>
        </form>
      </div>
    </div>
  );
}
