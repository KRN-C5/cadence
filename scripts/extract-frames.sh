#!/usr/bin/env bash
# usage: bash scripts/extract-frames.sh path/to/original-video.mp4
SRC="$1"
OUT="public/assets/film-new"
N=151

mkdir -p "$OUT"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
FPS=$(python3 -c "print($N/$DUR)")

ffmpeg -i "$SRC" \
  -vf "fps=$FPS,scale=1920:-2:flags=lanczos" \
  -frames:v $N \
  -c:v libwebp -quality 90 -compression_level 6 -preset picture \
  "$OUT/frame-%03d.webp"

ls "$OUT" | wc -l