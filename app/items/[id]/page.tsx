"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/config";
import { 
  doc, onSnapshot, deleteDoc, setDoc, updateDoc, increment, 
  collection, addDoc, serverTimestamp, query, orderBy, getDoc
} from "firebase/firestore";
import Link from "next/link";
import Header from "@/components/Header";

export default function ItemDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null); // 出品者の詳細情報用
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]); 
  const [newComment, setNewComment] = useState("");   

  useEffect(() => {
    // 1. 商品情報のリアルタイム取得
    const unsubItem = onSnapshot(doc(db, "items", id as string), async (s) => {
      if (s.exists()) {
        // 型エラー回避のため as any を付与
        const itemData = { id: s.id, ...s.data() } as any;
        setItem(itemData);

        // 出品者の詳細（県・自己紹介）をFirestoreから取得
        if (itemData.sellerId) {
          const sellerSnap = await getDoc(doc(db, "users", itemData.sellerId));
          if (sellerSnap.exists()) {
            setSeller(sellerSnap.data());
          }
        }
      }
    });

    // 2. コメント一覧のリアルタイム取得
    const qComments = query(
      collection(db, "items", id as string, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubComments = onSnapshot(qComments, (s) => {
      setComments(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. 認証状態の監視
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        const unsubLike = onSnapshot(doc(db, "users", u.uid, "likes", id as string), (s) => {
          setIsLiked(s.exists());
        });
        return () => unsubLike();
      }
    });

    return () => { unsubItem(); unsubComments(); unsubAuth(); };
  }, [id]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("コメントするにはログインが必要です");
    if (!newComment.trim()) return;

    const commentText = newComment;
    setNewComment(""); 

    try {
      await addDoc(collection(db, "items", id as string, "comments"), {
        text: commentText,
        senderId: user.uid,
        senderName: user.displayName || "匿名ユーザー",
        senderPhoto: user.photoURL || "",
        createdAt: serverTimestamp(),
      });

      if (user.uid !== item.sellerId) {
        try {
          await addDoc(collection(db, "users", item.sellerId, "notifications"), {
            type: "comment",
            title: "商品にコメントが届きました",
            body: `${user.displayName || "誰か"}さんが「${item.name}」にコメントしました。`,
            link: `/items/${id}`,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        } catch (notifError) {
          console.error("Notification failed:", notifError);
        }
      }
    } catch (e) {
      console.error("Comment failed:", e);
      alert("送信に失敗しました。");
      setNewComment(commentText); 
    }
  };

  const toggleLike = async () => {
    if (!user) return alert("いいねするにはログインが必要です");
    const itemRef = doc(db, "items", id as string);
    const userLikeRef = doc(db, "users", user.uid, "likes", id as string);
    if (isLiked) {
      await deleteDoc(userLikeRef);
      await updateDoc(itemRef, { likeCount: increment(-1) });
    } else {
      await setDoc(userLikeRef, { createdAt: new Date() });
      await updateDoc(itemRef, { likeCount: increment(1) });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("この出品を削除してもよろしいですか？")) return;
    try {
      await deleteDoc(doc(db, "items", id as string));
      alert("削除しました");
      router.push("/");
    } catch (e) {
      alert("削除に失敗しました");
    }
  };

  if (!item) return <div className="p-10 text-center text-black font-bold">読み込み中...</div>;
  const isSeller = user?.uid === item.sellerId;

  // 画像のリストを作成（新旧データ両対応）
  const displayImages = item.imageUrls || [item.imageUrl];

  return (
    <div className="min-h-screen bg-gray-50 text-black pb-20">
      <Header />
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* 画像エリア */}
        <div className="relative aspect-square bg-gray-100">
<div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
  {displayImages.map((url, index) => (
    <div key={index} className="w-full h-full flex-shrink-0 snap-center">
      <img 
        src={url} 
        className="w-full h-full object-cover" 
        referrerPolicy="no-referrer"
      />
    </div>
  ))}
</div>
          {item.isSold && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-black text-4xl border-4 border-white p-4 -rotate-12">SOLD OUT</span>
            </div>
          )}
          <button 
            onClick={toggleLike}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg flex items-center gap-2 active:scale-90 transition"
          >
            <span className={isLiked ? "text-red-500" : "text-gray-400"}>{isLiked ? "❤️" : "🤍"}</span>
            <span className="text-xs font-bold">{item.likeCount || 0}</span>
          </button>
        </div>

        {/* 商品情報 */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-1">{item.name}</h1>
          
          {/* 📍 出品者の活動エリアを表示 */}
          <div className="flex items-center gap-1 text-gray-500 text-xs mb-4 font-bold">
            <span className="text-red-500 text-sm">📍</span>
            <span>取引場所: {seller?.prefecture || "未設定"}</span>
          </div>

          <p className="text-3xl font-black text-red-600 mb-6">¥{item.price?.toLocaleString()}</p>
          
          <div className="bg-gray-50 p-4 rounded-2xl mb-6">
            <h2 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">商品説明</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>

          {isSeller ? (
            <div className="space-y-3">
              <Link href={`/items/${id}/edit`} className="block w-full bg-gray-800 text-white text-center font-bold py-4 rounded-2xl shadow-lg">商品の編集</Link>
              <button onClick={handleDelete} className="w-full bg-white text-red-600 border-2 border-red-50 font-bold py-4 rounded-2xl">この出品を削除する</button>
            </div>
          ) : (
            <Link 
              href={item.isSold ? "#" : `/items/${id}/buy`}
              className={`block w-full text-center font-bold py-4 rounded-2xl shadow-lg transition ${
                item.isSold ? "bg-gray-300 cursor-not-allowed" : "bg-red-600 text-white active:scale-95"
              }`}
            >
              {item.isSold ? "売り切れました" : "購入手続きへ"}
            </Link>
          )}

          {/* 出品者プロフィールカード */}
          <div className="mt-10 p-5 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 mb-4 tracking-widest uppercase">出品者プロフィール</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                {seller?.photoURL ? (
                  <img src={seller.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold">{seller?.displayName || "匿名ユーザー"}</p>
                <p className="text-[10px] text-gray-400 font-medium">📍 {seller?.prefecture || "未設定"}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed italic whitespace-pre-wrap">
              {seller?.bio || "自己紹介はまだありません。"}
            </p>
          </div>
        </div>

        {/* コメントセクション */}
        <div className="p-6 bg-gray-50">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <span>💬</span> コメント ({comments.length})
          </h2>
          
          <div className="space-y-4 mb-6">
            {comments.map((c) => (
              <div key={c.id} className={`flex gap-3 ${c.senderId === item.sellerId ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {c.senderPhoto ? <img src={c.senderPhoto} className="w-full h-full object-cover" /> : <div className="text-center pt-1 text-xs">👤</div>}
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  c.senderId === item.sellerId ? "bg-red-100 text-red-800 rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-200"
                }`}>
                  <p className="text-[10px] font-bold mb-1 opacity-60">{c.senderName} {c.senderId === item.sellerId && "(出品者)"}</p>
                  <p>{c.text}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-center text-xs text-gray-400 py-4 font-medium italic">コメントはまだありません</p>}
          </div>

          {!item.isSold && (
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input 
                type="text" 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="質問してみる..." 
                className="flex-1 bg-white border border-gray-200 px-4 py-3 rounded-full text-sm outline-none focus:border-red-500 transition"
              />
              <button className="bg-gray-900 text-white px-5 py-3 rounded-full text-sm font-bold active:scale-90 transition shadow-md">送信</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}