#!/bin/sh

if [ -z "$1" ]; then
  echo "Uso: $0 YYYY-MM-DD"
  exit 1
fi

week_number=$(date -d "$1" +%V)

echo $week_number
