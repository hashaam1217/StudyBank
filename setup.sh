#!/bin/bash

# StudyBank Setup Script
echo "🚀 Setting up StudyBank project..."

# Create project directory structure
echo "📁 Creating directory structure..."
mkdir -p src

# Move files to correct locations
echo "📦 Moving files to src directory..."
mv App.tsx src/
mv App.css src/
mv main.tsx src/
mv index.css src/

echo "✅ Project structure created!"
echo ""
echo "📋 Your project structure:"
echo "studybank/"
echo "├── index.html"
echo "├── package.json"
echo "├── tsconfig.json"
echo "├── tsconfig.node.json"
echo "├── vite.config.ts"
echo "├── README.md"
echo "└── src/"
echo "    ├── main.tsx"
echo "    ├── index.css"
echo "    ├── App.tsx"
echo "    └── App.css"
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Happy studying! 📚⚡"
