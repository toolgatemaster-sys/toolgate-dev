# Day 7 Setup Guide - UI Approvals

## Problema Común
Cada vez que cambias de rama, las dependencias se pierden y necesitas reinstalar todo.

## Solución Sistemática

### 1. Verificar estructura del proyecto
```bash
# SIEMPRE primero revisar qué existe
list_dir target_directory .
```

### 2. Instalar dependencias del workspace
```bash
./scripts/pnpm-dev.sh -w install --prod=false
```

### 3. Instalar componentes de shadcn/ui
```bash
# Ir al directorio de la web app
cd apps/web

# Inicializar shadcn (si no existe components.json)
../../scripts/pnpm-dev.sh dlx shadcn@latest init

# Agregar componentes necesarios
../../scripts/pnpm-dev.sh dlx shadcn@latest add card button badge input label select switch separator table toast
```

### 4. Crear lib/utils.ts (si no existe)
```bash
mkdir -p apps/web/lib
cat > apps/web/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF
```

### 5. Levantar servidor con NODE_ENV correcto
```bash
# MATAR procesos anteriores
pkill -f "next dev"

# Levantar con NODE_ENV=development
cd apps/web && NODE_ENV=development pnpm dev
```

### 6. Verificar que funciona
```bash
# Probar página
curl -s http://localhost:3000/approvals

# Ejecutar tests
pnpm test
```

## Archivos que DEBEN existir
- `apps/web/lib/utils.ts` - Para componentes shadcn/ui
- `apps/web/components/ui/*.tsx` - Componentes de shadcn/ui
- `apps/web/hooks/use-toast.ts` - Hook de toast
- `apps/web/components.json` - Configuración de shadcn/ui

## Errores comunes y soluciones
- **"Cannot find module '@/lib/utils'"** → Crear `apps/web/lib/utils.ts`
- **"Module parse failed: Unexpected character '@'"** → Usar `NODE_ENV=development`
- **"Internal Server Error"** → Reiniciar servidor después de crear `lib/utils.ts`

## Comando rápido para todo
```bash
# Limpiar y reinstalar todo
./scripts/pnpm-dev.sh -w install --prod=false
cd apps/web && ../../scripts/pnpm-dev.sh dlx shadcn@latest add card button badge input label select switch separator table toast
mkdir -p lib && echo 'import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}' > lib/utils.ts
pkill -f "next dev" && NODE_ENV=development pnpm dev
```

## Verificación final
- ✅ Servidor en http://localhost:3000
- ✅ Página /approvals responde con HTML
- ✅ Tests pasan: `pnpm test`
