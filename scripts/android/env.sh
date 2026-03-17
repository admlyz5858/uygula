#!/usr/bin/env sh

# Resolves Android SDK location and exports env vars.

if [ -n "${ANDROID_SDK_ROOT:-}" ] && [ -d "${ANDROID_SDK_ROOT}" ]; then
  SDK_ROOT="${ANDROID_SDK_ROOT}"
elif [ -n "${ANDROID_HOME:-}" ] && [ -d "${ANDROID_HOME}" ]; then
  SDK_ROOT="${ANDROID_HOME}"
elif [ -d "${HOME}/android-sdk" ]; then
  SDK_ROOT="${HOME}/android-sdk"
elif [ -d "/home/ubuntu/android-sdk" ]; then
  SDK_ROOT="/home/ubuntu/android-sdk"
else
  SDK_ROOT=""
fi

if [ -n "${SDK_ROOT}" ]; then
  export ANDROID_SDK_ROOT="${SDK_ROOT}"
  export ANDROID_HOME="${SDK_ROOT}"

  case ":${PATH}:" in
    *":${ANDROID_SDK_ROOT}/platform-tools:"*) ;;
    *) PATH="${ANDROID_SDK_ROOT}/platform-tools:${PATH}" ;;
  esac

  case ":${PATH}:" in
    *":${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:"*) ;;
    *) PATH="${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${PATH}" ;;
  esac

  export PATH
fi
