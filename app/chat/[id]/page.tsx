"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/config";
import { collection, doc, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null); // ★スクロール用

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/"); return; }
      setUser(u);

      // ★権限チェックを追加
      const chatDoc = await getDoc(doc(db, "chats", id as string));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        if (u.uid !== data.sellerId && u.uid !== data.buyerId) {
          alert("このチャットにアクセスする権限がありません。");
          router.push("/");
        }
      }
    });

    const unsubChat = onSnapshot(doc(db, "chats", id as string), (d) => {
      if (d.exists()) setChatInfo(d.data());
    });

    const q = query(collection(db, "chats", id as string, "messages"), orderBy("createdAt", "asc"));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubAuth(); unsubChat(); unsubMsgs(); };
  }, [id, router]);

  // ★メッセージが追加されたら最下部へスクロール
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || chatInfo?.status === "closed") return;
    
    const text = input;
    setInput(""); // 先に消してUXを高める

    await addDoc(collection(db, "chats", id as string, "messages"), {
      text: text,
      senderId: user.uid,
      senderName: user.displayName || "ユーザー",
      createdAt: serverTimestamp(),
    });
  };

  const completeTransaction = async () => {
    if (!window.confirm("受取評価をして取引を完了しますか？\n完了するとメッセージが送れなくなります。")) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "chats", id as string), { status: "closed" });
      await updateDoc(doc(db, "items", id as string), { status: "completed" });
      alert("取引が完了しました！");
    } catch (err) {
      alert("エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-black">
      <header className="bg-white p-4 shadow-sm font-bold flex items-center border-b justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => router.push("/mypage")} className="mr-4 text-gray-500 text-xl">←</button>
          <span className="text-base truncate max-w-[150px]">{chatInfo?.itemName || "取引チャット"}</span>
        </div>
        {user?.uid === chatInfo?.buyerId && chatInfo?.status !== "closed" && (
          <button 
            onClick={completeTransaction} 
            disabled={loading}
            className="bg-red-600 text-white text-xs px-3 py-2 rounded-lg font-bold active:scale-95 transition"
          >
            受取評価する
          </button>
        )}
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center">
          <p className="text-[10px] bg-gray-200 text-gray-500 inline-block px-3 py-1 rounded-full mb-2">
            取引を開始しました。メッセージで詳細を相談してください。
          </p>
        </div>

        {messages.map((m) => {
          const isMe = m.senderId === user?.uid;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%] flex flex-col">
                <div className={`p-3 rounded-2xl shadow-sm ${
                  isMe ? "bg-red-500 text-white rounded-tr-none" : "bg-white text-black rounded-tl-none border border-gray-100"
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
                {/* ★送信時刻の表示 */}
                <span className={`text-[8px] mt-1 text-gray-400 ${isMe ? "text-right" : "text-left"}`}>
                  {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </span>
              </div>
            </div>
          );
        })}
        {chatInfo?.status === "closed" && (
          <div className="bg-gray-100 text-gray-400 p-6 rounded-2xl text-center text-xs font-bold border border-dashed border-gray-300">
            この取引は完了しました
          </div>
        )}
        <div ref={scrollRef} /> {/* ★スクロール先 */}
      </div>

      {chatInfo?.status !== "closed" && (
        <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2 pb-8">
          <input 
            value={input} onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 text-sm"
            placeholder="メッセージを入力..."
          />
          <button 
            type="submit" 
            disabled={!input.trim()} 
            className="bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold text-sm disabled:bg-gray-300 active:scale-95 transition"
          >
            送信
          </button>
        </form>
      )}
    </div>
  );
}