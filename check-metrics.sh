#!/usr/bin/env bash
set -euo pipefail

# Puertos esperados (ajústalos según tu configuración local)
COLLECTOR_PORT=3001
GATEWAY_PORT=3002
SANITIZER_PORT=3003

check_service() {
  local name=$1
  local port=$2
  local counter=$3

  echo "🔍 Checking $name on port $port ..."
  status=$(curl -s -o /tmp/metrics.$$ -w "%{http_code}" http://127.0.0.1:$port/metrics || echo "000")
  if [[ "$status" != "200" ]]; then
    echo "❌ $name: /metrics returned status $status"
    return 1
  fi

  if ! grep -q "$counter" /tmp/metrics.$$; then
    echo "❌ $name: counter '$counter' not found"
    return 1
  fi

  if ! grep -qi "text/plain" <(curl -sI http://127.0.0.1:$port/metrics); then
    echo "❌ $name: content-type is not text/plain"
    return 1
  fi

  echo "✅ $name metrics OK"
}

check_service "Collector" $COLLECTOR_PORT "collector_http_requests_total"
check_service "Gateway"   $GATEWAY_PORT   "gateway_http_requests_total"
check_service "Sanitizer" $SANITIZER_PORT "sanitizer_http_requests_total"

echo "🎉 All metrics endpoints validated successfully."
