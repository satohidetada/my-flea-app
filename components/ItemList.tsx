"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function ItemList() {
  const [items, setItems] = useState<any[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    // 商品一覧を最新順に取得
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemsData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Link 
          href={`/items/${item.id}`} 
          key={item.id} 
          className="bg-white border rounded-lg overflow-hidden shadow-sm active:opacity-70 transition block"
        >
          <div className="relative aspect-square">
            <img 
              src={item.imageUrl} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
              alt={item.name} 
            />
            {item.isSold && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold text-sm border-2 border-white px-2 py-0.5 rotate-[-15deg]">SOLD</span>
              </div>
            )}
          </div>
          <div className="p-2">
            <p className="text-sm text-gray-700 truncate">{item.name}</p>
            <p className="text-lg font-black text-black">¥{Number(item.price).toLocaleString()}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
