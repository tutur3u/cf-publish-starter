#!/bin/bash
# Double-click this file on macOS (first time: right-click > Open).
# Bấm đúp vào file này trên macOS (lần đầu: chuột phải > Open).
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "Chưa cài Node.js. Tải bản LTS tại https://nodejs.org rồi chạy lại."
  echo "Node.js is not installed. Get the LTS from https://nodejs.org and try again."
  echo
  read -r -p "Nhấn Enter để đóng / Press Enter to close " _
  exit 1
fi
npm run share
echo
read -r -p "Nhấn Enter để đóng / Press Enter to close " _
