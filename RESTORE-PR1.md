# Restaurar PR1 - Comandos de Emergencia

## Abortar operaciones en curso
```bash
git merge --abort || true
git rebase --abort || true
```

## Volver al estado remoto sano de feat/tests
```bash
git fetch --all --prune
git switch feat/tests || git checkout feat/tests
git reset --hard origin/feat/tests
```

## Limpiar TODO lo generado localmente (incluye node_modules)
```bash
git clean -xfd
```

## Reinstalar EXACTO según el lockfile del PR1
```bash
pnpm -w install
```

## Sanity check
```bash
pnpm test
```

## Resultado esperado
- 33 tests pasando
- 0 tests fallando
- PR1 funcionando perfectamente
- Sin archivos de PR2 molestando
