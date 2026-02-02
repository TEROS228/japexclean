#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories to process
const directories = [
  'pages',
  'components',
  'lib',
  'context',
  'hooks'
];

// Patterns to remove (but keep console.error)
const removePatterns = [
  /console\.log\([^)]*\);?\n?/g,
  /console\.debug\([^)]*\);?\n?/g,
  /console\.warn\([^)]*\);?\n?/g,
];

// More complex multiline pattern
const multilinePattern = /console\.(log|debug|warn)\([^;]*?\);?\n?/gs;

let totalRemoved = 0;
let filesModified = 0;

function processFile(filePath) {
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let removedInFile = 0;

  // Remove console.log/debug/warn statements
  newContent = newContent.replace(multilinePattern, (match) => {
    removedInFile++;
    return '';
  });

  // Clean up extra blank lines
  newContent = newContent.replace(/\n\n\n+/g, '\n\n');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
    totalRemoved += removedInFile;
    console.log(`✓ ${filePath} (removed ${removedInFile} console statements)`);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file === 'node_modules' || file === '.next') continue;
      walkDirectory(filePath);
    } else {
      processFile(filePath);
    }
  }
}

console.log('Removing console.log, console.debug, and console.warn...\n');

const rootDir = path.join(__dirname, '..');

directories.forEach(dir => {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`\nProcessing ${dir}/...`);
    walkDirectory(fullPath);
  }
});

console.log(`\n✅ Done! Modified ${filesModified} files, removed ${totalRemoved} console statements`);
