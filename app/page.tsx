"use client";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <header className="bg-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-red-600 tracking-tighter">NOMI</h1>
        <div className="space-x-4">
          <Link href="/upload" className="bg-red-500 text-white px-4 py-2 rounded font-bold">出品する</Link>
          <Link href="/mypage" className="text-gray-600 font-medium">マイページ</Link>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <div className="bg-white p-2 rounded shadow hover:shadow-lg transition">
                <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover rounded" />
                <h2 className="mt-2 font-bold truncate">{item.name}</h2>
                <p className="text-red-500 font-bold">¥{item.price.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
