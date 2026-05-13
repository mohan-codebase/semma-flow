const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace remaining complex boxShadows
    content = content.replace(/boxShadow:\s*focus \? '.*?' : 'none'/g, "boxShadow: 'none'");
    content = content.replace(/boxShadow:\s*tier\.highlight \? '.*?' : 'none'/g, "boxShadow: 'none'");
    content = content.replace(/boxShadow:\s*habitColor === c \? `.*?` : 'none'/g, "boxShadow: 'none'");
    
    // Check for inline assignment
    content = content.replace(/\.style\.boxShadow =[\s\S]*?;/g, ".style.boxShadow = 'none';");
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated: ' + filePath);
    }
  }
}

walkDir(path.join(__dirname, 'components'), processFile);
walkDir(path.join(__dirname, 'app'), processFile);
