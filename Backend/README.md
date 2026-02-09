# Backend Deuna - Banco de Pichincha

API REST para el sistema de transferencias y recargas Deuna.

## 🚀 Instalación

```bash
cd Backend
npm install
```

## ⚙️ Configuración

Crea un archivo `.env` con las siguientes variables:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=deuna_banco
DB_USER=postgres
DB_PASSWORD=tu_password

API_PREFIX=/api/v1
```

## 📦 Iniciar Servidor

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Endpoints Disponibles

### Transferencias
- `POST /api/v1/transferencias` - Crear transferencia
- `GET /api/v1/transferencias/cuenta/:id_cuenta` - Historial de transferencias
- `GET /api/v1/transferencias/:id_transaccion` - Detalle de transferencia
- `POST /api/v1/transferencias/:id_transaccion/reversar` - Reversar transferencia

### Recargas
- `POST /api/v1/recargas` - Crear recarga
- `GET /api/v1/recargas/cuenta/:id_cuenta` - Historial de recargas
- `GET /api/v1/recargas/operadoras` - Operadoras disponibles
- `GET /api/v1/recargas/estadisticas/:id_cuenta` - Estadísticas de recargas
- `GET /api/v1/recargas/:id_transaccion` - Detalle de recarga

### Clientes
- `GET /api/v1/clientes` - Listar clientes
- `GET /api/v1/clientes/:id_cliente` - Detalle de cliente

### Cuentas
- `GET /api/v1/cuentas/cliente/:id_cliente` - Cuentas de un cliente
- `GET /api/v1/cuentas/:id_cuenta` - Detalle de cuenta
- `GET /api/v1/cuentas/:id_cuenta/saldo` - Consultar saldo

### Transacciones
- `GET /api/v1/transacciones` - Listar transacciones
- `GET /api/v1/transacciones/:id_transaccion` - Detalle de transacción

### Alias
- `GET /api/v1/alias/cliente/:id_cliente` - Alias de un cliente
- `GET /api/v1/alias/buscar/:valor_alias` - Buscar por alias

## 🔨 Tecnologías

- Node.js + Express
- PostgreSQL
- express-validator
- CORS
- dotenv
