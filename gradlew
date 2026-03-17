#!/usr/bin/env sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLASSPATH="$SCRIPT_DIR/gradle/wrapper/gradle-wrapper.jar"

if [ -f "$SCRIPT_DIR/scripts/android/env.sh" ]; then
  # shellcheck source=/dev/null
  . "$SCRIPT_DIR/scripts/android/env.sh"
fi

if [ -x "$SCRIPT_DIR/scripts/android/ensure-local-properties.sh" ]; then
  "$SCRIPT_DIR/scripts/android/ensure-local-properties.sh" >/dev/null 2>&1 || true
fi

if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
  JAVA_CMD="$JAVA_HOME/bin/java"
else
  JAVA_CMD="java"
fi

exec "$JAVA_CMD" -Dorg.gradle.appname=gradlew -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
