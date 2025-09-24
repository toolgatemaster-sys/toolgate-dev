#!/usr/bin/env bash
# Ejecuta pnpm sin NODE_ENV para evitar installs en "prod" por accidente.
unset NODE_ENV
exec pnpm "$@"
