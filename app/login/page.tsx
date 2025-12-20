"use client";
import { auth, db } from "@/lib/firebase/config";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLineBrowser, setIsLineBrowser] = useState(false);
  const isProcessing = useRef(false); // 重複処理防止用

  useEffect(() => {
    // 1. LINE判定
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("line") !== -1 || ua.indexOf("fban") !== -1 || ua.indexOf("fbav") !== -1 || ua.indexOf("instagram") !== -1) {
      setIsLineBrowser(true);
    }

    // 2. ログイン状態の監視 (これがループ防止に最も効きます)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isProcessing.current) {
        router.push("/");
      }
    });

    // 3. リダイレクト結果の処理
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user && !isProcessing.current) {
          isProcessing.current = true;
          setLoading(true);
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
        console.error("Redirect Error:", error);
        setLoading(false);
      }
    };

    checkRedirect();
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error(error);
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
          
          {isLineBrowser && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
              <p className="text-[11px] font-black text-red-600 mb-1 flex items-center gap-1">⚠️ ブラウザを切り替えてください</p>
              <p className="text-[10px] text-red-500 leading-relaxed font-bold">
                LINE等のアプリ内では制限されています。右上の「︙」から<span className="underline">「デフォルトのブラウザで開く」</span>を選択してください。
              </p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold transition active:scale-95 shadow-sm ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            {loading ? "認証中..." : "Googleでログイン"}
          </button>
        </div>
      </main>
    </div>
  );
}