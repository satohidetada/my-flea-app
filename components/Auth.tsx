"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) { alert(e.message); }
  };

  if (user) return (
    <div className="p-4 border rounded bg-white mb-4 shadow-sm">
      <p className="text-sm mb-2 text-black font-medium">ログイン中: {user.email}</p>
      <button onClick={() => signOut(auth)} className="w-full bg-red-500 text-white py-1 rounded hover:bg-red-600 transition">ログアウト</button>
    </div>
  );

  return (
    <div className="p-4 border rounded bg-white mb-4 text-black shadow-sm">
      <h2 className="font-bold mb-4 text-lg border-b pb-2">{isLogin ? "ログイン" : "新規登録"}</h2>
      <input type="email" placeholder="メールアドレス" className="w-full p-2 mb-2 border rounded" onChange={(e)=>setEmail(e.target.value)} />
      <input type="password" placeholder="パスワード" className="w-full p-2 mb-4 border rounded" onChange={(e)=>setPassword(e.target.value)} />
      <button onClick={handleAuth} className="w-full bg-blue-600 text-white py-2 rounded mb-2 font-bold hover:bg-blue-700 transition">{isLogin ? "ログイン" : "登録する"}</button>
      <button onClick={()=>setIsLogin(!isLogin)} className="w-full text-xs text-blue-500 underline">{isLogin ? "アカウントをお持ちでない方" : "ログインはこちら"}</button>
    </div>
  );
}
