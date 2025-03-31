/**
 * 應用性能優化腳本
 * 
 * 此腳本執行以下操作：
 * 1. 執行數據庫遷移以添加性能優化索引
 * 2. 替換服務文件為優化版本
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exit } = require('process');

// 項目根目錄
const rootDir = path.resolve(__dirname, '..');

// 執行遷移
console.log('執行數據庫遷移以添加性能優化索引...');
try {
  execSync('npx sequelize-cli db:migrate', { cwd: rootDir, stdio: 'inherit' });
  console.log('數據庫遷移成功完成！');
} catch (error) {
  console.error('數據庫遷移失敗:', error.message);
  exit(1);
}

// 替換服務文件
console.log('替換服務文件為優化版本...');

const filesToReplace = [
  {
    source: path.join(rootDir, 'src/services/message-service-optimized.ts'),
    target: path.join(rootDir, 'src/services/message-service.ts'),
    backup: path.join(rootDir, 'src/services/message-service.ts.bak')
  },
  {
    source: path.join(rootDir, 'src/services/knowledge-service-optimized.ts'),
    target: path.join(rootDir, 'src/services/knowledge-service.ts'),
    backup: path.join(rootDir, 'src/services/knowledge-service.ts.bak')
  }
];

// 替換文件
filesToReplace.forEach(file => {
  try {
    // 檢查源文件是否存在
    if (!fs.existsSync(file.source)) {
      console.error(`源文件不存在: ${file.source}`);
      return;
    }

    // 檢查目標文件是否存在
    if (!fs.existsSync(file.target)) {
      console.error(`目標文件不存在: ${file.target}`);
      return;
    }

    // 創建備份
    fs.copyFileSync(file.target, file.backup);
    console.log(`已創建備份: ${file.backup}`);

    // 替換文件
    fs.copyFileSync(file.source, file.target);
    console.log(`已替換文件: ${file.target}`);
  } catch (error) {
    console.error(`替換文件 ${file.target} 時出錯:`, error.message);
  }
});

// 編譯 TypeScript
console.log('編譯 TypeScript...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('TypeScript 編譯成功完成！');
} catch (error) {
  console.error('TypeScript 編譯失敗:', error.message);
  exit(1);
}

console.log('性能優化已成功應用！');
console.log('');
console.log('優化內容:');
console.log('1. 添加了數據庫索引以提高查詢性能');
console.log('2. 優化了消息服務的查詢方法');
console.log('3. 優化了知識庫服務的查詢方法，特別是全文搜索');
console.log('4. 添加了緩存機制以減少數據庫查詢');
console.log('');
console.log('如果需要還原更改，請運行以下命令:');
console.log('node scripts/revert-performance-optimizations.js');