"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // 詳細ページ (/items/[id]) にいるときはナビを表示しない
  if (pathname?.includes("/items/")) return null;

  const navItems = [
    { name: "ホーム", href: "/", icon: "🏠" },
    { name: "出品", href: "/upload", icon: "📷" },
    { name: "マイページ", href: "/mypage", icon: "👤" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center py-2 pb-safe max-w-lg mx-auto z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center w-full ${isActive ? "text-red-500" : "text-gray-500"}`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-bold">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
