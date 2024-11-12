#!/bin/sh

# Check if a date argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 YYYY-MM-DD"
  exit 1
fi

# Function to get the week number on Linux
get_week_number_linux() {
  date -d "$1" +%V
}

# Function to get the week number on macOS
get_week_number_mac() {
  date -j -f "%Y-%m-%d" "$1" +%V
}

# Detect operating system and calculate week number
if date --version >/dev/null 2>&1; then
  # Linux system
  week_number=$(get_week_number_linux "$1")
else
  # macOS system
  week_number=$(get_week_number_mac "$1")
fi

echo "Week number: $week_number"
