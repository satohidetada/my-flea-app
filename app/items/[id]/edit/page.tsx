"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ItemEdit() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      const docSnap = await getDoc(doc(db, "items", id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.sellerId !== auth.currentUser?.uid) {
          alert("編集権限がありません");
          router.push("/");
          return;
        }
        setName(data.name);
        setPrice(data.price.toString());
        setDescription(data.description || "");
      }
      setLoading(false);
    };
    fetchItem();
  }, [id, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "items", id), {
        name,
        price: Number(price),
        description,
      });
      alert("更新しました！");
      router.push(`/items/${id}`);
    } catch (error) {
      alert("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-black">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-white p-4 text-black">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="text-xl">←</button>
        <h1 className="font-bold">商品の編集</h1>
        <div className="w-6"></div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-400 block mb-1">商品名</label>
          <input 
            className="w-full border-b py-2 focus:border-red-500 outline-none transition"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 block mb-1">価格 (¥)</label>
          <input 
            type="number"
            className="w-full border-b py-2 focus:border-red-500 outline-none transition text-2xl font-bold"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 block mb-1">商品の説明</label>
          <textarea 
            className="w-full border rounded-lg p-3 h-32 focus:border-red-500 outline-none transition"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-red-500 text-white font-bold py-4 rounded-lg shadow-lg active:scale-95 transition disabled:bg-gray-300"
        >
          {loading ? "更新中..." : "変更を完了する"}
        </button>
      </form>
    </main>
  );
}
