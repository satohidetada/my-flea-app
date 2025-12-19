"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function TransactionMessage({ itemId }: { itemId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // 修正済み: "==" になっています
    const q = query(
      collection(db, "messages"),
      where("itemId", "==", itemId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore Error:", error);
    });
    
    return () => unsubscribe();
  }, [itemId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, "messages"), {
        itemId,
        text: newMessage,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || "ユーザー",
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("送信エラー:", err);
    }
  };

  return (
    <div className="mt-8 border-t pt-6 text-black bg-white p-4 rounded-xl shadow-inner">
      <h3 className="text-xl font-bold mb-4">取引メッセージ</h3>
      <div className="space-y-4 mb-6 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded-lg">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`p-3 rounded-2xl max-w-[80%] ${
              m.senderId === auth.currentUser?.uid 
                ? "ml-auto bg-green-500 text-white" 
                : "mr-auto bg-white border border-gray-200"
            }`}
          >
            <p className="text-sm">{m.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="メッセージを入力..." 
          className="flex-1 p-3 border rounded-full outline-none focus:border-green-500 bg-white"
        />
        <button className="bg-green-500 text-white px-6 py-2 rounded-full font-bold">送信</button>
      </form>
    </div>
  );
}
