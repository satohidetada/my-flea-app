"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

// GASのURLを最新のものに
const GAS_URL = "https://script.google.com/macros/s/AKfycby-ey-a-JVlePfdJiCRO_aSNfMgUYnwahAaYKyV4909p7Wq4LvbgEu2cplNTjlsdLkA/exec";
const SECRET_API_KEY = "my-secret-token-777";

export default function UploadPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  // --- 【追加】画像をブラウザ側で圧縮する関数 ---
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

          // 商品画像は1200px程度あれば十分高精細
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context error");
          ctx.drawImage(img, 0, 0, width, height);

          // 画質0.7のJPEGに変換（劇的に軽くなります）
          const base64 = canvas.toDataURL("image/jpeg", 0.7);
          resolve(base64.split(",")[1]); 
        };
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !user || !name || !price || !description) {
      alert("必須項目をすべて入力してください。");
      return;
    }

    setLoading(true);
    try {
      // 1. ユーザーの地域情報を取得
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      let userPrefecture = "地域不明";
      if (userSnap.exists()) {
        userPrefecture = userSnap.data().prefecture || "地域不明";
      }

      // 2. 画像の圧縮実行
      const compressedBase64 = await compressImage(image);

      // 3. GAS経由で画像をアップロード (キー名をGAS側に合わせる)
      const response = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          key: SECRET_API_KEY,      // apiKey から key へ
          img: compressedBase64,    // imageBase64 から img へ
          type: "image/jpeg",       // 圧縮後は常にjpeg
        }),
      });

      if (!response.ok) throw new Error("ネットワーク応答が正常ではありません");
      
      const result = await response.json();
      if (result.error) throw new Error(result.error);

      // 4. Firestoreに商品データを保存
      await addDoc(collection(db, "items"), {
        name,
        price: Number(price),
        description,
        imageUrl: result.url,
        sellerId: user.uid,
        sellerName: user.displayName || "匿名ユーザー",
        sellerPrefecture: userPrefecture,
        status: "on_sale",
        isSold: false,
        likeCount: 0,
        createdAt: serverTimestamp(),
      });

      alert(`出品が完了しました！`);
      router.push("/");
    } catch (error: any) {
      console.error("Upload Error:", error);
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
          <h1 className="text-xl font-bold mb-6 text-red-600 font-sans tracking-tighter">📸 NOMIに出品する</h1>
          
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">商品画像</label>
              <div className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center group transition hover:border-red-200">
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <p className="text-white text-xs font-bold">変更する</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <span className="text-4xl">📷</span>
                    <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">タップして追加</p>
                  </div>
                )}
                <input 
                  type="file" accept="image/*" 
                  onChange={handleImageChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  required={!previewUrl}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">商品名</label>
              <input 
                type="text" value={name} onChange={(e) => setName(e.target.value)} 
                className="w-full border-b py-2 outline-none focus:border-red-500 transition text-lg font-medium bg-transparent" 
                placeholder="例: ハンドメイドのアクセサリー" required 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">価格 (円)</label>
              <input 
                type="number" value={price} onChange={(e) => setPrice(e.target.value)} 
                className="w-full border-b py-2 outline-none focus:border-red-500 transition text-lg font-medium bg-transparent" 
                placeholder="3000" required 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">商品の詳細説明</label>
              <textarea 
                value={description} onChange={(e) => setDescription(e.target.value)} 
                className="w-full border rounded-2xl p-4 text-sm h-40 outline-none focus:border-red-500 bg-gray-50 transition border-gray-100 resize-none" 
                placeholder="商品の状態、色、サイズ、発送方法など..." required 
              />
            </div>

            <button 
              type="submit" disabled={loading} 
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition active:scale-95 ${
                loading ? "bg-gray-300" : "bg-black hover:bg-gray-800"
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