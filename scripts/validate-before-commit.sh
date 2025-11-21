#!/bin/bash

# Pre-commit validation script
# Run this before committing to ensure migrations are in sync

echo "🔍 Validating database migrations..."
npm run migration:validate

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Migration validation failed!"
  echo "Please fix the issues before committing."
  echo ""
  echo "See docs/DATABASE-SYNC.md for help."
  exit 1
fi

echo ""
echo "✅ All validations passed. Safe to commit!"

