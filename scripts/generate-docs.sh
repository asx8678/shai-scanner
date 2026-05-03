#!/bin/bash
set -e
echo "📚 Generating API documentation..."
mkdir -p docs/api
if command -v npx &> /dev/null; then
  echo "Running JSDoc..."
  npx jsdoc src/*.js -d docs/api -R README.md 2>/dev/null || echo "JSDoc not installed as devDep, run: npm i -D jsdoc"
fi
echo "✅ Documentation generation complete!"
echo "📁 Output: docs/api/"