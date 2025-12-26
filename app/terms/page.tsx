import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800 p-6 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 border-b-2 border-red-500 pb-2 text-red-600">利用規約</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-lg mb-2">第1条（目的）</h2>
            <p>本規約は、本サービス内での物品の出品、購入、およびユーザー間コミュニケーションのルールを定めるものです。</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">第2条（売買契約と支払いルール）</h2>
            <p>1. 本サービスは売買の場を提供するものであり、購入者が購入手続きを完了した時点で、ユーザー間に売買契約が成立するものとします。</p>
            <p className="mt-2 text-red-600 font-bold">2. 代金の支払いは、商品の引き渡し時に「対面での現金手渡し」を行うことを原則とします。運営者が認めた決済手段以外での「銀行振込」等の先払いは、詐欺被害防止のため禁止します。</p>
            <p className="mt-2 text-red-600 font-bold">3. 運営者は契約の当事者ではなく、ユーザー間の取引、対面での引き渡し、メッセージのやり取り、金銭の授受、および発生したトラブルについて一切の責任を負いません。すべて当事者間で直接解決するものとします。</p>
            <p className="mt-2">4. 運営者は、出品された商品の品質、安全性、適法性、および真実性について一切保証しません。</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">第3条（禁止事項）</h2>
            <p>以下の行為を禁止します。違反した場合、予告なく投稿削除やアカウント停止を行うことがあります。</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>法令、公序良俗に反する商品の出品（盗品、危険物、公序良俗に反する物品など）</li>
              <li className="font-bold text-red-600">古物営業法に抵触する営業目的での無許可転売（せどり行為等）</li>
              <li className="font-bold text-red-600">銀行振込を要求する行為、またはそれに応じる行為</li>
              <li>他人の知的財産権（著作権、商標権等）を侵害する物品の出品（海賊版、偽ブランド品等）</li>
              <li>虚偽の内容を含む投稿、または他者への誹謗中傷、迷惑行為</li>
              <li>他のユーザーに対する過度な勧誘、または公序良俗に反する出会い目的の利用</li>
              <li>その他、運営が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">第4条（利用料と広告）</h2>
            <p>1. 本サービスの利用は原則無料ですが、運営者は将来的に特定の機能を有料化、または販売手数料を導入する権利を留保します。</p>
            <p>2. 運営者は、本サービス上に運営者または第三者の広告を掲載することができるものとします。</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">第5条（反社会的勢力の排除）</h2>
            <p>ユーザーは、自らが暴力団等の反社会的勢力に該当しないこと、および将来にわたっても該当しないことを表明し、保証するものとします。違反が判明した場合、直ちに利用を停止します。</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">第6条（サービスの停止・変更）</h2>
            <p>運営者は、システムの保守、点検、または障害等により、ユーザーに事前通知することなく本サービスを停止、変更、または終了できるものとします。</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">第7条（規約の変更）</h2>
            <p>運営者は、必要に応じて本規約を変更できるものとします。変更後の規約は本ページに掲載した時点から効力を生じ、ユーザーが変更後に本サービスを利用した場合、同意したものとみなします。</p>
          </section>

          <div className="mt-10 pt-10 border-t text-center">
            <Link href="/mypage" className="text-red-500 font-bold hover:underline">
              マイページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}