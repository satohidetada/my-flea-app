import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800 p-6 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 border-b-2 border-red-500 pb-2 text-red-600">プライバシーポリシー</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-lg mb-2">1. 取得する個人情報</h2>
            <p>本アプリは、以下の情報を取得します。</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>ログインに関する情報（メールアドレス、Googleアカウント等の識別子）</li>
              <li>プロフィール情報（表示名、居住エリア、アイコン画像等）</li>
              <li>サービス利用データ（出品内容、取引メッセージ、評価内容）</li>
              <li>アクセスログ情報（端末情報、IPアドレス、クッキー等の技術的識別子）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">2. 利用目的</h2>
            <p>取得した情報は、以下の目的で利用します。</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>本サービス提供時の本人確認およびユーザー認証</li>
              <li>商品の売買、取引連絡の円滑化</li>
              <li>不具合の修正、不正利用の防止、およびセキュリティ維持</li>
              <li>ユーザーからのお問い合わせへの対応</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">3. 第三者への提供と外部サービス</h2>
            <p>1. 法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。</p>
            <p className="mt-2">2. 本アプリは、認証およびデータベース基盤としてGoogle Cloud Platform（Firebase）を利用しています。これらのサービス提供会社において、情報の管理・保管が行われる場合があります。</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">4. データの管理・削除</h2>
            <p>ユーザーは、アプリ内のプロフィール編集画面から情報を修正できるほか、情報の削除（退会）を希望する場合は、お問い合わせフォームより申請できるものとします。</p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">5. お問い合わせ窓口</h2>
            <p>
              個人情報の取り扱いに関するお問い合わせ、および特定商取引法に基づく表記の開示請求は、アプリ内の「お問い合わせ」フォームよりご連絡ください。内容を確認後、速やかに対応いたします。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">6. プライバシーポリシーの改定</h2>
            <p>本ポリシーの内容は、必要に応じて変更することがあります。変更した内容は本ページに掲載した時点から有効となります。</p>
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