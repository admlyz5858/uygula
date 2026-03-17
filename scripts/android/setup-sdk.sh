#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -n "${ANDROID_SDK_ROOT:-}" ]; then
  SDK_ROOT="${ANDROID_SDK_ROOT}"
elif [ -n "${ANDROID_HOME:-}" ]; then
  SDK_ROOT="${ANDROID_HOME}"
else
  SDK_ROOT="${HOME}/android-sdk"
fi

TOOLS_VERSION="${ANDROID_CMDLINE_TOOLS_VERSION:-13114758}"
TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-${TOOLS_VERSION}_latest.zip"

mkdir -p "${SDK_ROOT}/cmdline-tools"

if [ ! -x "${SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager" ]; then
  TMP_DIR=$(mktemp -d)
  ZIP_PATH="${TMP_DIR}/cmdline-tools.zip"

  echo "Downloading Android command-line tools..."
  curl -fL "${TOOLS_URL}" -o "${ZIP_PATH}"
  unzip -oq "${ZIP_PATH}" -d "${TMP_DIR}"

  rm -rf "${SDK_ROOT}/cmdline-tools/latest"
  mv "${TMP_DIR}/cmdline-tools" "${SDK_ROOT}/cmdline-tools/latest"
  rm -rf "${TMP_DIR}"
fi

export ANDROID_SDK_ROOT="${SDK_ROOT}"
export ANDROID_HOME="${SDK_ROOT}"
export PATH="${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${PATH}"

yes | sdkmanager --sdk_root="${ANDROID_SDK_ROOT}" --licenses >/dev/null
sdkmanager --sdk_root="${ANDROID_SDK_ROOT}" \
  "platform-tools" \
  "platforms;android-35" \
  "build-tools;35.0.0"

"${SCRIPT_DIR}/ensure-local-properties.sh" "${ANDROID_SDK_ROOT}"

echo "Android SDK ready at: ${ANDROID_SDK_ROOT}"
echo "Add to shell profile:"
echo "  export ANDROID_SDK_ROOT=\"${ANDROID_SDK_ROOT}\""
echo "  export ANDROID_HOME=\"${ANDROID_SDK_ROOT}\""
echo "  export PATH=\"\$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:\$ANDROID_SDK_ROOT/platform-tools:\$PATH\""
