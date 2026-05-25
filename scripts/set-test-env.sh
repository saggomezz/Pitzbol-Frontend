#!/usr/bin/env bash
# Source this file to set TEST env vars in your current shell:
#   source ./scripts/set-test-env.sh
# This script does NOT persist secrets to disk; it only exports env vars for the current shell.

if [ -z "$TEST_USER_TOKEN" ]; then
  read -s -p "Paste TEST_USER_TOKEN (hidden): " TEST_USER_TOKEN
  echo
fi

if [ -z "$TEST_USER_ID" ]; then
  read -p "Enter TEST_USER_ID: " TEST_USER_ID
fi

if [ -z "$TEST_ALLOW_PAYMENTS" ]; then
  read -p "Enable payments? (true/false) [false]: " TEST_ALLOW_PAYMENTS
  TEST_ALLOW_PAYMENTS=${TEST_ALLOW_PAYMENTS:-false}
fi

export TEST_USER_TOKEN
export TEST_USER_ID
export TEST_ALLOW_PAYMENTS

echo "TEST env vars set in this shell session (not persisted). Run your tests now."
echo "To clear: unset TEST_USER_TOKEN TEST_USER_ID TEST_ALLOW_PAYMENTS"
