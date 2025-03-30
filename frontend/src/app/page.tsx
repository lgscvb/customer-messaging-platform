import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold mb-8 text-center">
          全通路客戶訊息管理平台
        </h1>
        
        <p className="text-xl mb-8 text-center max-w-2xl">
          整合多平台客戶訊息，提供 AI 輔助回覆與導購功能，讓您的客服團隊更高效、更智能。
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <Link 
            href="/dashboard" 
            className="card p-6 text-center hover:bg-gray-100 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-3">儀表板 &rarr;</h2>
            <p>查看客戶互動數據和客服績效分析。</p>
          </Link>
          
          <Link 
            href="/messages" 
            className="card p-6 text-center hover:bg-gray-100 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-3">訊息管理 &rarr;</h2>
            <p>管理來自 LINE 和官網的客戶訊息。</p>
          </Link>
          
          <Link 
            href="/customers" 
            className="card p-6 text-center hover:bg-gray-100 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-3">客戶管理 &rarr;</h2>
            <p>查看和管理客戶資料和互動歷史。</p>
          </Link>
          
          <Link 
            href="/knowledge" 
            className="card p-6 text-center hover:bg-gray-100 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-3">知識庫 &rarr;</h2>
            <p>管理和優化 AI 輔助回覆的知識庫。</p>
          </Link>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            版本 0.1.0 | &copy; 2025 全通路客戶訊息管理平台
          </p>
        </div>
      </div>
    </main>
  );
}