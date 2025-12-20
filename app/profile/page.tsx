"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { updateProfile, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const GAS_URL = "https://script.google.com/macros/s/AKfycby-ey-a-JVlePfdJiCRO_aSNfMgUYnwahAaYKyV4909p7Wq4LvbgEu2cplNTjlsdLkA/exec";
const SECRET_API_KEY = "my-secret-token-777"; 

export default function ProfileEdit() {
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [prefecture, setPrefecture] = useState("東京都");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setName(user.displayName || "");
        setPhotoURL(user.photoURL || "");
        
        // Firestoreから追加情報を取得
        const docRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPrefecture(data.prefecture || "東京都");
            setBio(data.bio || "");
            // Firestoreに保存されているURLがあればそれを優先
            if (data.photoURL) {
              setPhotoURL(data.photoURL);
            }
          }
        } catch (error) {
          console.error("Firestoreデータ取得失敗:", error);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 画像アップロード処理
  const uploadImage = async (file: File) => {
    if (file.size > 1024 * 1024 * 5) { // 5MB制限
      alert("ファイルサイズは5MB以下にしてください");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = async () => {
      const base64Data = reader.result?.toString().split(",")[1];
      if (!base64Data) {
        setUploading(false);
        return;
      }

      try {
        const res = await fetch(GAS_URL, {
          method: "POST",
          mode: "cors", // 明示的にCORSを許可
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            img: base64Data,
            type: file.type,
            key: SECRET_API_KEY,
          }),
        });

        if (!res.ok) throw new Error("サーバーとの通信に失敗しました");

        const data = await res.json();
        
        if (data.url) {
          console.log("アップロード成功:", data.url);
          // 確実に状態を更新するために、直前の状態に依存しない形式でセット
          setPhotoURL(() => data.url);
        } else if (data.error) {
          throw new Error(data.error);
        }
      } catch (e: any) {
        console.error("アップロードエラー詳細:", e);
        alert("画像アップロードに失敗しました: " + e.message);
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      alert("ファイルの読み込みに失敗しました");
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);

    try {
      // 1. Authの更新
      await updateProfile(user, { 
        displayName: name, 
        photoURL: photoURL 
      });

      // 2. Firestoreの更新
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        photoURL: photoURL,
        prefecture: prefecture,
        bio: bio,
        updatedAt: new Date()
      }, { merge: true });

      alert("プロフィールを更新しました！");
      router.push("/mypage");
    } catch (e: any) {
      console.error("更新エラー:", e);
      alert("更新エラー: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Header />
      <main className="p-6 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-6 tracking-tighter">プロフィール編集</h1>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
          
          {/* 写真変更セクション */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center">
              {photoURL ? (
                <img 
                  src={photoURL} 
                  className="w-full h-full object-cover" 
                  alt="Profile Preview"
                  onError={(e) => {
                    console.error("画像読み込みエラー");
                    setPhotoURL(""); // エラー時はプレースホルダーに戻す
                  }}
                />
              ) : (
                <div className="text-4xl text-gray-300">👤</div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-bold">
                  UP中...
                </div>
              )}
            </div>
            <label className="text-xs font-bold text-red-600 bg-red-50 px-4 py-2 rounded-full cursor-pointer hover:bg-red-100 transition inline-block">
              {uploading ? "処理中..." : "写真を変更"}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }} 
              />
            </label>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">ニックネーム</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full border-b py-2 focus:border-red-500 outline-none text-lg bg-transparent" 
                required 
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">主な活動エリア</label>
              <select 
                value={prefecture} 
                onChange={(e) => setPrefecture(e.target.value)}
                className="w-full border-b py-2 bg-transparent outline-none text-lg"
              >
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">自己紹介</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                placeholder="直接手渡し希望です！"
                className="w-full border rounded-2xl p-4 mt-2 h-32 text-sm bg-gray-50 outline-none focus:border-red-500 transition resize-none"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || uploading} 
              className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition disabled:bg-gray-300"
            >
              {loading ? "保存中..." : "変更を確定する"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}