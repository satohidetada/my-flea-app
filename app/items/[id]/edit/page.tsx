"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// GASの設定（Uploadページと共通）
const GAS_URL = "https://script.google.com/macros/s/AKfycby-ey-a-JVlePfdJiCRO_aSNfMgUYnwahAaYKyV4909p7Wq4LvbgEu2cplNTjlsdLkA/exec";
const SECRET_API_KEY = "my-secret-token-777";

export default function ItemEdit() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  // 画像関連のステート
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]); // すでに登録されている画像
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);           // 新しく選んだファイル
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);       // 新規ファイルのプレビュー
  
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
        
        // 新旧データ形式（imageUrl または imageUrls）に対応
        const images = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
        setExistingImageUrls(images);
      }
      setLoading(false);
    };
    fetchItem();
  }, [id, router]);

  // 画像圧縮ロジック（Uploadページと同じ）
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas error");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
        };
      };
    });
  };

  // 画像が追加された時
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImageFiles(prev => [...prev, ...files]);
      const urls = files.map(file => URL.createObjectURL(file));
      setNewPreviewUrls(prev => [...prev, ...urls]);
    }
  };

  // 既存画像の削除
  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 新規追加予定画像の削除
  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingImageUrls.length === 0 && newImageFiles.length === 0) {
      return alert("画像は1枚以上必要です");
    }
    setLoading(true);

    try {
      const uploadedUrls = [];
      // 新しい画像のみアップロード処理を行う
      for (const file of newImageFiles) {
        const base64 = await compressImage(file);
        const res = await fetch(GAS_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ key: SECRET_API_KEY, img: base64, type: "image/jpeg" }),
        });
        const result = await res.json();
        if (result.url) uploadedUrls.push(result.url);
      }

      // 最終的な画像リスト（残した既存画像 + 新規アップロード画像）
      const finalImageUrls = [...existingImageUrls, ...uploadedUrls];

      // Firestoreを更新
      await updateDoc(doc(db, "items", id), {
        name,
        price: Number(price),
        description,
        imageUrls: finalImageUrls, // 複数配列として保存
        imageUrl: finalImageUrls[0], // 互換性のために1枚目も保存
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
    <main className="min-h-screen bg-white p-4 text-black max-w-md mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="text-xl p-2">←</button>
        <h1 className="font-bold">商品の編集</h1>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* 画像編集エリア：グリッド形式 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block ml-1 uppercase tracking-widest">商品画像</label>
          <div className="grid grid-cols-3 gap-2">
            {/* 登録済みの画像 */}
            {existingImageUrls.map((url, i) => (
              <div key={`old-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border">
                <img src={url} className="w-full h-full object-cover" alt="existing" />
                <button 
                  type="button" 
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow-lg"
                >
                  ✕
                </button>
              </div>
            ))}
            {/* 新しく追加した画像 */}
            {newPreviewUrls.map((url, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-red-200">
                <img src={url} className="w-full h-full object-cover" alt="new preview" />
                <button 
                  type="button" 
                  onClick={() => removeNewImage(i)}
                  className="absolute top-1 right-1 bg-black text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow-lg"
                >
                  ✕
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-red-500 text-[8px] text-white text-center py-0.5 font-bold">追加分</div>
              </div>
            ))}
            {/* 画像追加ボタン */}
            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition active:scale-95">
              <span className="text-2xl text-gray-300">+</span>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          <p className="text-[10px] text-gray-400 ml-1">※画像は複数選択・追加できます</p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 block mb-1 ml-1 uppercase tracking-widest">商品名</label>
          <input 
            className="w-full bg-gray-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition border-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 block mb-1 ml-1 uppercase tracking-widest">価格 (¥)</label>
          <input 
            type="number"
            className="w-full bg-gray-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition text-xl font-bold border-none"
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
          {loading ? "更新中..." : "変更を保存する"}
        </button>
      </form>
    </main>
  );
}