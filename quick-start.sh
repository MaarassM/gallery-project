#!/bin/bash

# Quick Start Script for Photo Gallery Application
# Run this script to set up everything automatically

set -e

echo "🚀 Photo Gallery - Quick Start Setup"
echo "===================================="
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/5: Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Start PostgreSQL
echo "🐘 Step 2/5: Starting PostgreSQL..."
pnpm docker:up -d
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10
echo "✅ PostgreSQL started"
echo ""

# Step 3: Generate Prisma client
echo "🔧 Step 3/5: Generating Prisma client..."
pnpm db:generate
echo "✅ Prisma client generated"
echo ""

# Step 4: Run migrations
echo "🗄️  Step 4/5: Running database migrations..."
pnpm db:migrate -- --name init
echo "✅ Migrations completed"
echo ""

# Step 5: Seed database
echo "🌱 Step 5/5: Seeding database..."
pnpm db:seed
echo "✅ Database seeded"
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm dev' to start the development server"
echo "  2. Open http://localhost:5173 in your browser"
echo "  3. Check DESIGN_PATTERNS.md for pattern documentation"
echo ""
echo "Happy coding! 🎉"
