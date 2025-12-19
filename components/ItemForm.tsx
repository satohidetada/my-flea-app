"use client";
import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function ItemForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !auth.currentUser) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", image);
      const res = await fetch("https://new-proxy.d-h-lemooons.workers.dev", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("アップロード失敗");
      const data = await res.json() as { url: string };
      await addDoc(collection(db, "items"), {
        name,
        price: Number(price),
        description,
        imageUrl: data.url,
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || "匿名ユーザー",
        createdAt: new Date(),
        isSold: false,
      });
      alert("出品完了！");
      window.location.href = "/";
    } catch (e: any) {
      alert("エラー: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow rounded mt-10">
      <form onSubmit={handleUpload} className="space-y-4 text-black">
        <h2 className="text-xl font-bold">商品を出品する</h2>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} required />
        <input type="text" placeholder="商品名" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border" required />
        <input type="number" placeholder="価格" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border" required />
        <textarea placeholder="説明" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border" />
        <button disabled={loading} className="w-full bg-red-500 text-white p-3 rounded font-bold">
          {loading ? "アップロード中..." : "出品を確定する"}
        </button>
      </form>
    </div>
  );
}
