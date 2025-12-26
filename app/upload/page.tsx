"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const GAS_URL = "https://script.google.com/macros/s/AKfycby-ey-a-JVlePfdJiCRO_aSNfMgUYnwahAaYKyV4909p7Wq4LvbgEu2cplNTjlsdLkA/exec";
const SECRET_API_KEY = "my-secret-token-777";

export default function UploadPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  
  // --- 【修正】画像を配列で管理するように変更 ---
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
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
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context error");
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL("image/jpeg", 0.7);
          resolve(base64.split(",")[1]); 
        };
      };
      reader.onerror = (e) => reject(e);
    });
  };

  // --- 【修正】複数ファイルを選択・追加できるように変更 ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      // 既存の画像リストに追加する
      setImages((prev) => [...prev, ...selectedFiles]);

      // プレビュー用URLを作成して追加
      const newUrls = selectedFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };

  // --- 【追加】選択した画像を削除する機能（あると便利です） ---
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    // images.length でチェック
    if (images.length === 0 || !user || !name || !price || !description) {
      alert("画像と必須項目をすべて入力してください。");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      let userPrefecture = "地域不明";
      if (userSnap.exists()) {
        userPrefecture = userSnap.data().prefecture || "地域不明";
      }

      // --- 【修正】画像の枚数分、GASへのアップロードを繰り返す ---
      const uploadedUrls = [];
      for (let i = 0; i < images.length; i++) {
        const compressedBase64 = await compressImage(images[i]);
        const response = await fetch(GAS_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            key: SECRET_API_KEY,
            img: compressedBase64,
            type: "image/jpeg",
          }),
        });

        if (!response.ok) throw new Error(`${i + 1}枚目のアップロードに失敗しました`);
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        uploadedUrls.push(result.url); // 取得したURLを配列に入れる
      }

      // 4. Firestoreに商品データを保存
      await addDoc(collection(db, "items"), {
        name,
        price: Number(price),
        description,
        imageUrls: uploadedUrls, // 【修正】単数(imageUrl)から複数(imageUrls)へ変更
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
          <h1 className="text-xl font-bold mb-6 text-red-600 tracking-tighter">📸 NOMIに出品する</h1>
          
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
                商品画像（最大10枚程度推奨）
              </label>
              
              {/* 【修正】横スクロールで複数枚表示できるUI */}
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative w-32 h-32 flex-shrink-0 snap-start">
                    <img src={url} alt="Preview" className="w-full h-full object-cover rounded-2xl border" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow-lg"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {/* 画像追加用の枠 */}
                <label className="w-32 h-32 flex-shrink-0 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-red-200 transition">
                  <span className="text-2xl text-gray-400">+</span>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">追加</p>
                  <input 
                    type="file" accept="image/*" multiple // 【重要】multipleを付与
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* --- 以下、商品名などの入力欄は変更なし --- */}
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
              {loading ? `アップロード中 (${images.length}枚)...` : "出品を確定する"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}