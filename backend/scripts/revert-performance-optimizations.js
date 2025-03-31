/**
 * 還原性能優化腳本
 * 
 * 此腳本執行以下操作：
 * 1. 還原服務文件為原始版本
 * 2. 回滾數據庫遷移以刪除性能優化索引
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exit } = require('process');

// 項目根目錄
const rootDir = path.resolve(__dirname, '..');

// 還原服務文件
console.log('還原服務文件為原始版本...');

const filesToRestore = [
  {
    backup: path.join(rootDir, 'src/services/message-service.ts.bak'),
    target: path.join(rootDir, 'src/services/message-service.ts')
  },
  {
    backup: path.join(rootDir, 'src/services/knowledge-service.ts.bak'),
    target: path.join(rootDir, 'src/services/knowledge-service.ts')
  }
];

// 還原文件
filesToRestore.forEach(file => {
  try {
    // 檢查備份文件是否存在
    if (!fs.existsSync(file.backup)) {
      console.error(`備份文件不存在: ${file.backup}`);
      return;
    }

    // 還原文件
    fs.copyFileSync(file.backup, file.target);
    console.log(`已還原文件: ${file.target}`);

    // 刪除備份
    fs.unlinkSync(file.backup);
    console.log(`已刪除備份: ${file.backup}`);
  } catch (error) {
    console.error(`還原文件 ${file.target} 時出錯:`, error.message);
  }
});

// 回滾數據庫遷移
console.log('回滾數據庫遷移以刪除性能優化索引...');
try {
  execSync('npx sequelize-cli db:migrate:undo --name add-performance-indexes.js', { cwd: rootDir, stdio: 'inherit' });
  console.log('數據庫遷移回滾成功完成！');
} catch (error) {
  console.error('數據庫遷移回滾失敗:', error.message);
  exit(1);
}

// 編譯 TypeScript
console.log('編譯 TypeScript...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('TypeScript 編譯成功完成！');
} catch (error) {
  console.error('TypeScript 編譯失敗:', error.message);
  exit(1);
}

console.log('性能優化已成功還原！');