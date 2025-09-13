# Toolgate - Estructura del Proyecto

## 📁 Estructura General
```
toolgate/
├── apps/
│   ├── web/                    # Aplicación Next.js (Frontend)
│   └── gate/                   # Cloudflare Worker (API Gateway)
├── packages/
│   └── core/                   # Paquete compartido (Lógica común)
├── md/                         # Documentación
└── pnpm-workspace.yaml         # Configuración del monorepo
```

## 🚀 Apps

### `apps/web` - Aplicación Web (Next.js)
```
apps/web/
├── app/
│   ├── globals.css             # Estilos globales + variables CSS
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Página principal
│   ├── api/
│   │   └── sanitize/
│   │       └── route.ts        # API endpoint de sanitización
│   └── styles/
│       └── tokens.css          # Sistema de tokens de diseño
├── components/
│   ├── ThemeRoot.tsx           # Componente de tema (light/dark)
│   └── ui/
│       └── button.tsx          # Componente Button (shadcn/ui)
├── lib/
│   └── utils.ts                # Utilidades (cn function)
├── tailwind.config.ts          # Configuración de Tailwind CSS
├── next.config.mjs             # Configuración de Next.js
├── postcss.config.js           # Configuración de PostCSS
└── package.json                # Dependencias del web app
```

### `apps/gate` - API Gateway (Cloudflare Worker)
```
apps/gate/
├── src/
│   └── index.ts                # Lógica del Worker (Hono)
├── wrangler.toml               # Configuración del Worker
└── package.json                # Dependencias del gate
```

## 📦 Packages

### `packages/core` - Lógica Compartida
```
packages/core/
├── src/
│   └── index.ts                # Funciones de sanitización y HMAC
├── test/
│   └── core.test.ts            # Tests unitarios
├── tsconfig.json               # Configuración TypeScript
└── package.json                # Dependencias del core
```

## 🎨 Sistema de Diseño

### Tokens CSS (`apps/web/app/styles/tokens.css`)
- **Colores**: Sistema completo de colores con variantes (400, 500, 600, etc.)
- **Temas**: Soporte para light/dark mode
- **Variables**: Definidas en `:root, .light, [data-theme=light]`

### Tailwind Config (`apps/web/tailwind.config.ts`)
- **Brand colors**: Configuración de colores de marca
- **Shadcn/ui**: Integración con componentes
- **Dark mode**: Configuración de tema oscuro

### Estilos Globales (`apps/web/app/globals.css`)
- **Fuentes**: Geist Sans y Geist Mono
- **Variables**: Mapeo de tokens a variables de Tailwind
- **Imports**: Carga de fuentes y tokens

## 🔧 Configuración

### Monorepo (`pnpm-workspace.yaml`)
```yaml
packages:
  - apps/*
  - packages/*
```

### Dependencias Principales
- **Next.js 15.5.2**: Framework web
- **Tailwind CSS 3.4.x**: Sistema de estilos
- **Hono**: Framework para Cloudflare Workers
- **shadcn/ui**: Componentes de UI
- **Vitest**: Testing

## 🚦 Funcionalidades

### Core Package
- `defangLinks()`: Sanitización de enlaces
- `spotlight()`: Análisis de contenido
- `analyze()`: Análisis general
- `hmacSign()`: Firma HMAC-SHA256
- `hmacVerify()`: Verificación HMAC

### Web App
- **Sanitizador**: Interfaz para sanitizar contenido
- **Tema**: Switch entre modo claro/oscuro
- **API**: Endpoint `/api/sanitize`

### Gate Worker
- **Egress Control**: Control de salida de requests
- **HMAC Signing**: Firma de requests
- **Policy Management**: Gestión de políticas de seguridad

## 📋 Estado Actual

### ✅ Funcionando
- Estructura del monorepo
- Core package con tests
- Web app básica
- Gate worker
- Sistema de tokens
- Fuentes Geist

### 🔧 En Desarrollo
- Integración completa de tokens con Tailwind
- Estilos del botón con colores de marca
- Configuración de temas

## 🛠️ Comandos

### Desarrollo
```bash
# Web app
cd apps/web && pnpm dev

# Gate worker
cd apps/gate && pnpm dev

# Core package
cd packages/core && pnpm build
```

### Testing
```bash
# Core package
cd packages/core && pnpm test
```

### Build
```bash
# Todo el proyecto
pnpm -w build
```
