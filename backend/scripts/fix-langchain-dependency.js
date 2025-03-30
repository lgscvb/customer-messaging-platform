/**
 * LangChain 依賴修復腳本
 * 
 * 這個腳本用於解決 LangChain 與 OpenAI 版本不兼容的問題。
 * 當 LangChain 依賴於舊版本的 OpenAI 包時，這個腳本會修改 package.json 和 package-lock.json
 * 以確保使用正確的版本。
 */

const fs = require('fs');
const path = require('path');

console.log('開始修復 LangChain 依賴問題...');

// 路徑定義
const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageLockJsonPath = path.join(rootDir, 'package-lock.json');
const nodeModulesDir = path.join(rootDir, 'node_modules');

// 檢查文件是否存在
if (!fs.existsSync(packageJsonPath)) {
  console.error(`錯誤: 找不到 package.json 文件: ${packageJsonPath}`);
  process.exit(1);
}

if (!fs.existsSync(packageLockJsonPath)) {
  console.error(`錯誤: 找不到 package-lock.json 文件: ${packageLockJsonPath}`);
  process.exit(1);
}

// 讀取 package.json
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error(`錯誤: 無法解析 package.json: ${error.message}`);
  process.exit(1);
}

// 讀取 package-lock.json
let packageLockJson;
try {
  packageLockJson = JSON.parse(fs.readFileSync(packageLockJsonPath, 'utf8'));
} catch (error) {
  console.error(`錯誤: 無法解析 package-lock.json: ${error.message}`);
  process.exit(1);
}

// 檢查 LangChain 和 OpenAI 版本
const langchainVersion = packageJson.dependencies.langchain;
const openaiVersion = packageJson.dependencies['@langchain/openai'];

console.log(`當前 LangChain 版本: ${langchainVersion}`);
console.log(`當前 @langchain/openai 版本: ${openaiVersion || '未安裝'}`);

// 修復依賴
let modified = false;

// 確保使用最新版本的 LangChain
if (langchainVersion !== '^0.1.17') {
  console.log(`更新 LangChain 版本為 ^0.1.17`);
  packageJson.dependencies.langchain = '^0.1.17';
  modified = true;
}

// 確保使用最新版本的 @langchain/openai
if (!openaiVersion || openaiVersion !== '^0.0.14') {
  console.log(`更新 @langchain/openai 版本為 ^0.0.14`);
  packageJson.dependencies['@langchain/openai'] = '^0.0.14';
  modified = true;
}

// 如果有修改，保存 package.json
if (modified) {
  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`已更新 package.json`);
  } catch (error) {
    console.error(`錯誤: 無法寫入 package.json: ${error.message}`);
    process.exit(1);
  }
}

// 修復 package-lock.json 中的依賴
let lockModified = false;

// 檢查 package-lock.json 中的 LangChain 依賴
if (packageLockJson.packages && packageLockJson.packages['node_modules/langchain']) {
  const lockLangchain = packageLockJson.packages['node_modules/langchain'];
  
  // 檢查 LangChain 的依賴
  if (lockLangchain.dependencies && lockLangchain.dependencies.openai) {
    console.log(`從 package-lock.json 中移除 LangChain 對 openai 的直接依賴`);
    delete lockLangchain.dependencies.openai;
    lockModified = true;
  }
  
  // 更新 LangChain 版本
  if (lockLangchain.version !== '0.1.17') {
    console.log(`更新 package-lock.json 中的 LangChain 版本為 0.1.17`);
    lockLangchain.version = '0.1.17';
    lockModified = true;
  }
}

// 如果有修改，保存 package-lock.json
if (lockModified) {
  try {
    fs.writeFileSync(packageLockJsonPath, JSON.stringify(packageLockJson, null, 2));
    console.log(`已更新 package-lock.json`);
  } catch (error) {
    console.error(`錯誤: 無法寫入 package-lock.json: ${error.message}`);
    process.exit(1);
  }
}

// 檢查 node_modules 中的 LangChain 依賴
const langchainNodeModulesDir = path.join(nodeModulesDir, 'langchain');
const langchainPackageJsonPath = path.join(langchainNodeModulesDir, 'package.json');

if (fs.existsSync(langchainPackageJsonPath)) {
  try {
    const langchainPackageJson = JSON.parse(fs.readFileSync(langchainPackageJsonPath, 'utf8'));
    
    // 檢查 LangChain 的依賴
    if (langchainPackageJson.dependencies && langchainPackageJson.dependencies.openai) {
      console.log(`從 node_modules/langchain/package.json 中移除對 openai 的直接依賴`);
      delete langchainPackageJson.dependencies.openai;
      
      // 保存修改後的 package.json
      fs.writeFileSync(langchainPackageJsonPath, JSON.stringify(langchainPackageJson, null, 2));
      console.log(`已更新 node_modules/langchain/package.json`);
    }
  } catch (error) {
    console.error(`警告: 無法修改 node_modules/langchain/package.json: ${error.message}`);
    console.log('建議重新安裝依賴: npm ci');
  }
}

console.log('LangChain 依賴修復完成!');
console.log('如果問題仍然存在，請嘗試刪除 node_modules 目錄並重新安裝依賴: rm -rf node_modules && npm ci');