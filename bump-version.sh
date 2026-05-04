#!/bin/bash
# Usage: ./bump-version.sh 1.4
# Or: ./bump-version.sh (auto-increments patch: 1.3 → 1.4)

PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"

current_version=$(grep -m1 'MARKETING_VERSION' "$PBXPROJ" | sed 's/.*= //;s/;//;s/ //')
current_build=$(grep -m1 'CURRENT_PROJECT_VERSION' "$PBXPROJ" | sed 's/.*= //;s/;//;s/ //')

if [ -n "$1" ]; then
  new_version="$1"
else
  major=$(echo "$current_version" | cut -d. -f1)
  minor=$(echo "$current_version" | cut -d. -f2)
  new_version="$major.$((minor + 1))"
fi

new_build=$((current_build + 1))

sed -i '' "s/MARKETING_VERSION = $current_version;/MARKETING_VERSION = $new_version;/g" "$PBXPROJ"
sed -i '' "s/CURRENT_PROJECT_VERSION = $current_build;/CURRENT_PROJECT_VERSION = $new_build;/g" "$PBXPROJ"

echo "✓ $current_version (build $current_build) → $new_version (build $new_build)"
