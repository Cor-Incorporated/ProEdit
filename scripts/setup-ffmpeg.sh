#!/bin/bash
# Setup FFmpeg files for ProEdit
# Matches omniclip's copy-assets and copy-coi approach

FFMPEG_DIR="public/ffmpeg"
FFMPEG_VERSION="0.12.6"
BASE_URL="https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_VERSION}/dist/esm"

echo "Setting up FFmpeg files for ProEdit..."

# Create directory if it doesn't exist
mkdir -p "$FFMPEG_DIR"

# Copy COI Service Worker (matches omniclip's copy-coi)
echo "Copying coi-serviceworker.js..."
cp node_modules/coi-serviceworker/coi-serviceworker.js public/

# Download FFmpeg core files
echo "Downloading ffmpeg-core.js..."
curl -L -o "$FFMPEG_DIR/ffmpeg-core.js" "$BASE_URL/ffmpeg-core.js"

echo "Downloading ffmpeg-core.wasm..."
curl -L -o "$FFMPEG_DIR/ffmpeg-core.wasm" "$BASE_URL/ffmpeg-core.wasm"

echo "✅ FFmpeg setup complete!"
echo "  - coi-serviceworker.js: public/"
echo "  - FFmpeg files: $FFMPEG_DIR"
