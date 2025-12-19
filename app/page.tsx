"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import Header from "@/components/Header";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="p-4 grid grid-cols-2 gap-3 max-w-2xl mx-auto">
        {items.map((item) => (
          <Link href={`/items/${item.id}`} key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div className="aspect-square bg-gray-200 relative">
              <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
              {item.isSold && (
                <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg shadow-md">SOLD</div>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs text-gray-500 truncate">{item.name}</p>
              <p className="font-bold text-sm">¥{item.price?.toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </main>

      <Link href="/upload" className="fixed bottom-6 right-6 bg-red-600 text-white w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-2xl font-bold text-[10px] active:scale-90 transition-transform">
        <span className="text-2xl mb-[-4px]">📸</span>
        出品
      </Link>
    </div>
  );
}
