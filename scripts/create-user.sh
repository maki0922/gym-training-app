#!/bin/bash
#
# ユーザー作成スクリプト
# Usage: ./scripts/create-user.sh <email> <password> <display_name> <role>
#   role: owner | trainer
#
# Example:
#   ./scripts/create-user.sh demo@gmail.com Demo1234 "デモユーザー" owner
#

set -euo pipefail

if [ $# -ne 4 ]; then
  echo "Usage: $0 <email> <password> <display_name> <role>"
  echo "  role: owner | trainer"
  echo ""
  echo "Example:"
  echo "  $0 demo@gmail.com Demo1234 \"デモユーザー\" owner"
  exit 1
fi

EMAIL="$1"
PASSWORD="$2"
DISPLAY_NAME="$3"
ROLE="$4"

if [[ "$ROLE" != "owner" && "$ROLE" != "trainer" ]]; then
  echo "Error: role must be 'owner' or 'trainer'"
  exit 1
fi

if [ ${#PASSWORD} -lt 8 ]; then
  echo "Error: password must be at least 8 characters"
  exit 1
fi

# .env.local から環境変数を読み込み
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env.local not found at $ENV_FILE"
  exit 1
fi

source "$ENV_FILE"

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
  exit 1
fi

echo "Creating user: $EMAIL ($DISPLAY_NAME, $ROLE)..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"display_name\": \"${DISPLAY_NAME}\",
      \"role\": \"${ROLE}\"
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  USER_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "unknown")
  echo ""
  echo "User created successfully!"
  echo "  ID:    $USER_ID"
  echo "  Email: $EMAIL"
  echo "  Name:  $DISPLAY_NAME"
  echo "  Role:  $ROLE"
else
  ERROR_MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('msg','unknown error'))" 2>/dev/null || echo "$BODY")
  echo ""
  echo "Error ($HTTP_CODE): $ERROR_MSG"
  exit 1
fi
