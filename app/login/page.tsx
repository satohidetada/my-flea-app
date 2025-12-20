"use client";
import { auth, db } from "@/lib/firebase/config";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLineBrowser, setIsLineBrowser] = useState(false);

  useEffect(() => {
    // 1. LINEなどのアプリ内ブラウザ判定
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("line") !== -1 || ua.indexOf("fban") !== -1 || ua.indexOf("fbav") !== -1 || ua.indexOf("instagram") !== -1) {
      setIsLineBrowser(true);
    }

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
    // 毎回アカウント選択を出すことでフリーズを防ぐ
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
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
          
          {/* LINEユーザー向けの警告表示 */}
          {isLineBrowser && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
              <p className="text-[11px] font-black text-red-600 mb-1 flex items-center gap-1">
                ⚠️ ブラウザを切り替えてください
              </p>
              <p className="text-[10px] text-red-500 leading-relaxed font-bold">
                LINE等のアプリ内ではGoogleログインが制限されています。「︙」から<span className="underline">「デフォルトのブラウザで開く」</span>または<span className="underline">「Safariで開く」</span>を選択してください。
              </p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold transition active:scale-95 shadow-sm ${loading ? "opacity-50" : "hover:bg-gray-50"}`}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            {loading ? "読み込み中..." : "Googleでログイン"}
          </button>

          <p className="mt-8 text-[10px] text-gray-400 font-medium leading-relaxed">
            ログインすることで、利用規約および<br />プライバシーポリシーに同意したものとみなされます。
          </p>
        </div>
      </main>
    </div>
  );
}