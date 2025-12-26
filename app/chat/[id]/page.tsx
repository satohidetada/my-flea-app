"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/config";
import { collection, doc, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

// GASの設定
const GAS_URL = "https://script.google.com/macros/s/AKfycby-ey-a-JVlePfdJiCRO_aSNfMgUYnwahAaYKyV4909p7Wq4LvbgEu2cplNTjlsdLkA/exec";
const SECRET_API_KEY = "my-secret-token-777";

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 追加: 評価用ステート ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/"); return; }
      setUser(u);

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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          const MAX_SIZE = 1000;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.6).split(",")[1]);
        };
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || chatInfo?.status === "closed") return;

    setLoading(true);
    try {
      const base64 = await compressImage(file);
      const res = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ key: SECRET_API_KEY, img: base64, type: "image/jpeg" }),
      });
      const result = await res.json();

      if (result.url) {
        await addDoc(collection(db, "chats", id as string, "messages"), {
          image: result.url,
          senderId: user.uid,
          senderName: user.displayName || "ユーザー",
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      alert("画像の送信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || chatInfo?.status === "closed") return;
    
    const text = input;
    setInput("");

    await addDoc(collection(db, "chats", id as string, "messages"), {
      text: text,
      senderId: user.uid,
      senderName: user.displayName || "ユーザー",
      createdAt: serverTimestamp(),
    });
  };

  // --- 追加: 評価を投稿して取引を完了する ---
  const handleSubmitReview = async () => {
    if (!user || !chatInfo) return;
    setLoading(true);
    try {
      // 1. 相手（出品者）の評価コレクションに保存
      await addDoc(collection(db, "users", chatInfo.sellerId, "reviews"), {
        fromId: user.uid,
        fromName: user.displayName || "匿名ユーザー",
        rating: rating,
        comment: reviewComment,
        itemId: chatInfo.itemId,
        itemName: chatInfo.itemName,
        createdAt: serverTimestamp(),
      });

      // 2. チャットと商品のステータスを更新
      await updateDoc(doc(db, "chats", id as string), { status: "closed" });
      await updateDoc(doc(db, "items", chatInfo.itemId), { status: "completed" });

      // 3. 出品者へ「評価が届きました」通知
      await addDoc(collection(db, "users", chatInfo.sellerId, "notifications"), {
        type: "review",
        title: "評価が届きました！",
        body: `「${chatInfo.itemName}」の取引相手から評価が届きました。`,
        link: "/mypage",
        isRead: false,
        createdAt: serverTimestamp(),
      });

      alert("取引が完了しました！評価ありがとうございます。");
      setShowReviewModal(false);
    } catch (err) {
      console.error(err);
      alert("処理中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-black">
      <header className="bg-white p-4 shadow-sm font-bold flex items-center border-b justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => router.push(`/items/${id}`)} className="mr-4 text-gray-500 text-xl active:scale-90 transition">←</button>
          <span className="text-base truncate max-w-[150px]">{chatInfo?.itemName || "取引チャット"}</span>
        </div>
        {user?.uid === chatInfo?.buyerId && chatInfo?.status !== "closed" && (
          <button 
            onClick={() => setShowReviewModal(true)} 
            className="bg-red-600 text-white text-xs px-3 py-2 rounded-lg font-bold active:scale-95 transition"
          >
            受取評価する
          </button>
        )}
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isMe = m.senderId === user?.uid;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%] flex flex-col">
                <div className={`rounded-2xl shadow-sm ${
                  isMe ? "bg-red-500 text-white rounded-tr-none" : "bg-white text-black rounded-tl-none border border-gray-100"
                } ${m.image ? "p-1" : "p-3"}`}>
                  {m.text && <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>}
                  {m.image && (
                    <img src={m.image} className="rounded-xl max-w-full h-auto" alt="sent" referrerPolicy="no-referrer" />
                  )}
                </div>
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
        <div ref={scrollRef} />
      </div>

      {chatInfo?.status !== "closed" && (
        <div className="p-4 bg-white border-t pb-8">
          <form onSubmit={sendMessage} className="flex gap-2 items-center">
            <label className="flex-shrink-0 cursor-pointer p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
              <span className="text-xl">📷</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={loading} />
            </label>
            
            <input 
              value={input} onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 text-sm"
              placeholder={loading ? "アップロード中..." : "メッセージを入力..."}
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading} 
              className="bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold text-sm disabled:bg-gray-300 active:scale-95 transition"
            >
              送信
            </button>
          </form>
        </div>
      )}

      {/* --- 追加: 評価モーダル --- */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-center mb-6">受取評価</h2>
            
            <p className="text-[10px] text-gray-400 font-bold text-center mb-4 uppercase tracking-widest">出品者の評価</p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`text-3xl transition ${rating >= star ? "grayscale-0" : "grayscale opacity-30"}`}
                >
                  ⭐
                </button>
              ))}
            </div>

            <textarea 
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="取引の感想を教えてください（任意）"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm outline-none focus:border-red-500 mb-6 h-32 resize-none"
            />

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSubmitReview}
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition disabled:bg-gray-300"
              >
                {loading ? "送信中..." : "評価を送信して取引完了"}
              </button>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="w-full text-gray-400 text-xs font-bold py-2"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}