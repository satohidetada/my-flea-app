"use client";
import { auth, db } from "@/lib/firebase/config";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth"; // 変更
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // useEffect追加
import Header from "@/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // リダイレクトから戻ってきた時の処理
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const user = result.user;
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              prefecture: "未設定",
              createdAt: serverTimestamp(),
            });
          }
          router.push("/");
        }
      } catch (error) {
        console.error(error);
      }
    };
    checkRedirect();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // ポップアップではなくリダイレクトを使用
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      alert("ログインエラー: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Header />
      <main className="flex flex-col items-center justify-center pt-20 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 text-center">
          <h1 className="text-3xl font-black text-red-600 mb-2 tracking-tighter italic">NOMI</h1>
          <p className="text-gray-400 text-[10px] font-bold mb-8 uppercase tracking-[0.2em]">Marketplace Login</p>
          
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold hover:bg-gray-50 transition active:scale-95 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            {loading ? "Googleへ移動中..." : "Googleでログイン"}
          </button>
        </div>
      </main>
    </div>
  );
}