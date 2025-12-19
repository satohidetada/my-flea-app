"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, doc, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [chatInfo, setChatInfo] = useState<any>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        alert("ログインが必要です");
        router.push("/");
      }
      setUser(u);
    });

    const fetchChat = async () => {
      const d = await getDoc(doc(db, "chats", id as string));
      if (d.exists()) {
        setChatInfo(d.data());
      }
    };
    fetchChat();

    // メッセージをリアルタイム取得
    const q = query(collection(db, "chats", id as string, "messages"), orderBy("createdAt", "asc"));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAuth();
      unsubMsgs();
    };
  }, [id, router]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    await addDoc(collection(db, "chats", id as string, "messages"), {
      text: input,
      senderId: user.uid,
      senderName: user.displayName,
      createdAt: serverTimestamp(),
    });
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f5] text-black">
      {/* ヘッダー */}
      <header className="bg-white p-4 shadow-sm font-bold flex items-center border-b">
        <Link href="/" className="mr-4 text-gray-500 text-xl">✕</Link>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 font-normal">取引チャット</span>
          <span className="text-base">{chatInfo?.itemName || "読み込み中..."}</span>
        </div>
      </header>
      
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-yellow-100 p-3 rounded-lg text-xs text-center text-gray-600 mb-4">
          取引が開始されました。挨拶をして発送を待ちましょう。
        </div>

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === user?.uid ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
              m.senderId === user?.uid 
                ? "bg-red-500 text-white rounded-tr-none" 
                : "bg-white text-black rounded-tl-none"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 入力エリア */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2 items-center">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 outline-none focus:border-red-500 text-sm"
          placeholder="メッセージを入力..."
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="bg-red-600 text-white px-5 py-2 rounded-full font-bold text-sm disabled:bg-gray-300"
        >
          送信
        </button>
      </form>
    </div>
  );
}
