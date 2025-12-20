"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false); // ログインか登録かの切り替え
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 既にログインしている場合は自動的にトップページへ
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      alert("パスワードは6文字以上で設定してください");
      return;
    }
    setLoading(true);

    try {
      if (isRegister) {
        // --- 新規登録処理 ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Firestoreにユーザー情報を登録
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: email.split("@")[0], // メールの前半部分を仮の名前に
          prefecture: "未設定",
          photoURL: "",
          createdAt: serverTimestamp(),
        });
        alert("アカウントを作成しました！");
      } else {
        // --- ログイン処理 ---
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (error: any) {
      console.error(error);
      // エラーメッセージの日本語化
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        alert("メールアドレスまたはパスワードが正しくありません。");
      } else if (error.code === "auth/email-already-in-use") {
        alert("このメールアドレスは既に登録されています。");
      } else if (error.code === "auth/invalid-email") {
        alert("メールアドレスの形式が正しくありません。");
      } else {
        alert("エラーが発生しました: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Header />
      <main className="flex flex-col items-center justify-center pt-20 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
          <h1 className="text-3xl font-black text-red-600 mb-2 text-center italic tracking-tighter">NOMI</h1>
          <p className="text-gray-400 text-[10px] font-bold mb-8 text-center uppercase tracking-[0.2em]">
            {isRegister ? "Create Account" : "Member Login"}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 ml-2 mb-1 block">EMAIL</label>
              <input
                type="email"
                placeholder="example@mail.com"
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-red-500/20 text-sm font-medium border border-transparent focus:border-red-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 ml-2 mb-1 block">PASSWORD</label>
              <input
                type="password"
                placeholder="6文字以上"
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-red-500/20 text-sm font-medium border border-transparent focus:border-red-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-200 transition active:scale-95 mt-4 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"}`}
            >
              {loading ? "処理中..." : (isRegister ? "登録して始める" : "ログイン")}
            </button>
          </form>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="w-full mt-6 text-xs text-gray-500 font-bold hover:text-red-600 transition text-center"
          >
            {isRegister ? "すでにアカウントをお持ちの方はこちら" : "新しくアカウントを作成する"}
          </button>
        </div>
      </main>
    </div>
  );
}