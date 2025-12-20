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
  const [imageUrl, setImageUrl] = useState(""); // 既存の画像URL
  const [newImageFile, setNewImageFile] = useState<File | null>(null); // 新しく選んだ画像
  const [previewUrl, setPreviewUrl] = useState(""); // プレビュー用
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
        setImageUrl(data.imageUrl || "");
      }
      setLoading(false);
    };
    fetchItem();
  }, [id, router]);

  // 画像が選択された時の処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // ブラウザ上でのプレビュー作成
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      // 新しい画像がある場合、Cloudinaryへアップロード
      if (newImageFile) {
        const formData = new FormData();
        formData.append("file", newImageFile);
        formData.append("upload_preset", "ml_default"); // あなたのプリセット名を確認してください

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        finalImageUrl = data.secure_url;
      }

      // Firestoreを更新
      await updateDoc(doc(db, "items", id), {
        name,
        price: Number(price),
        description,
        imageUrl: finalImageUrl, // 新しいURL（なければ元のURL）で更新
      });

      alert("更新しました！");
      router.push(`/items/${id}`);
    } catch (error) {
      console.error(error);
      alert("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-black">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-white p-4 text-black max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="text-xl p-2">←</button>
        <h1 className="font-bold">商品の編集</h1>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* 画像編集エリア */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block ml-1 uppercase tracking-widest">商品画像</label>
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200">
            <img 
              src={previewUrl || imageUrl} 
              className="w-full h-full object-cover" 
              alt="Preview"
            />
            <label className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer">
              <span className="text-white text-xs font-bold bg-black/50 px-4 py-2 rounded-full">画像を差し替える</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 block mb-1 ml-1 uppercase tracking-widest">商品名</label>
          <input 
            className="w-full bg-gray-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 block mb-1 ml-1 uppercase tracking-widest">価格 (¥)</label>
          <input 
            type="number"
            className="w-full bg-gray-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition text-xl font-bold"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 block mb-1 ml-1 uppercase tracking-widest">商品の説明</label>
          <textarea 
            className="w-full bg-gray-50 border-0 rounded-xl p-4 h-32 focus:ring-2 focus:ring-red-500 outline-none transition resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition disabled:bg-gray-300"
        >
          {loading ? "保存中..." : "変更を保存する"}
        </button>
      </form>
    </main>
  );
}