import Link from 'next/link';
import Header from "@/components/Header";

export default function TokushoPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Header />
      <main className="max-w-2xl mx-auto p-4 pb-20">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mt-6">
          <h1 className="text-xl font-black mb-6 border-b-2 border-red-500 pb-2 text-red-600 inline-block">
            特定商取引法に基づく表記
          </h1>

          <div className="bg-red-50 p-4 rounded-2xl mb-8">
            <p className="text-[11px] text-red-700 font-bold leading-relaxed">
              ※運営者の氏名・住所・電話番号については、特定商取引法に基づき、消費者様からの請求があった場合に遅滞なく電子メール等の方法で提供いたします。
            </p>
          </div>

          <div className="space-y-6">
            <section className="border-b border-gray-50 pb-4">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">サービス名</h2>
              <p className="text-sm font-bold">NOMI</p>
            </section>

            <section className="border-b border-gray-50 pb-4">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">運営責任者・所在地・連絡先</h2>
              <p className="text-sm font-bold">
                「
                <Link href="/contact" className="text-red-500 underline underline-offset-4">
                  お問い合わせフォーム
                </Link>
                」よりご請求ください。内容を確認後、速やかに開示いたします。
              </p>
            </section>

            <section className="border-b border-gray-50 pb-4">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">販売価格</h2>
              <p className="text-sm font-bold">各商品の詳細ページに表示された価格（消費税込み）に基づきます。</p>
            </section>

            <section className="border-b border-gray-50 pb-4">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">商品代金以外に必要な費用</h2>
              <p className="text-sm font-bold">
                現在はシステム利用料および販売手数料は無料です。<br />
                ※対面取引の際の交通費等はユーザー様のご負担となります。
              </p>
            </section>

            <section className="border-b border-gray-50 pb-4">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">代金の支払い時期・方法</h2>
              <p className="text-sm font-bold">アプリ内での購入確定時、または対面引渡時の直接支払いなど、ユーザー間で合意した方法によります。</p>
            </section>

            <section className="border-b border-gray-50 pb-4">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">商品の引き渡し時期</h2>
              <p className="text-sm font-bold">購入完了後、出品者と購入者間のチャット協議により決定した日時・場所にて、対面または合意した方法で引き渡されます。</p>
            </section>

            <section className="pb-4">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">返品・交換・キャンセル</h2>
              <p className="text-sm font-bold leading-relaxed">
                対面引渡時の商品確認後のキャンセルは原則として認められません。商品の不備等がある場合は、その場で確認を行うか、利用規約に基づき当事者間で直接解決するものとします。
              </p>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            <Link 
              href="/mypage" 
              className="inline-block bg-gray-50 text-gray-500 px-8 py-3 rounded-2xl text-xs font-bold active:scale-95 transition"
            >
              マイページに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}