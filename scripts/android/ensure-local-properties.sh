#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)

# shellcheck source=/dev/null
. "${SCRIPT_DIR}/env.sh"

if [ -n "${1:-}" ]; then
  SDK_ROOT="$1"
elif [ -n "${ANDROID_SDK_ROOT:-}" ]; then
  SDK_ROOT="${ANDROID_SDK_ROOT}"
elif [ -n "${ANDROID_HOME:-}" ]; then
  SDK_ROOT="${ANDROID_HOME}"
else
  SDK_ROOT=""
fi

if [ -z "${SDK_ROOT}" ] || [ ! -d "${SDK_ROOT}" ]; then
  echo "Android SDK not found; skipping local.properties generation."
  exit 0
fi

LOCAL_PROPERTIES="${ROOT_DIR}/local.properties"
TEMP_FILE="${ROOT_DIR}/local.properties.tmp"

if [ -f "${LOCAL_PROPERTIES}" ]; then
  : > "${TEMP_FILE}"
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      sdk.dir=*) ;;
      *) printf "%s\n" "$line" >> "${TEMP_FILE}" ;;
    esac
  done < "${LOCAL_PROPERTIES}"
else
  : > "${TEMP_FILE}"
fi

printf "sdk.dir=%s\n" "${SDK_ROOT}" >> "${TEMP_FILE}"
mv "${TEMP_FILE}" "${LOCAL_PROPERTIES}"

echo "local.properties updated: sdk.dir=${SDK_ROOT}"
