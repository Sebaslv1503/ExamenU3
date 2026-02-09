# 🏦 Sistema Deuna - Banco de Pichincha

Sistema completo de transferencias y recargas instantáneas para Banco de Pichincha utilizando PostgreSQL, Node.js (Express) y React.

## 📋 Descripción del Proyecto

Deuna es un módulo de pagos y transferencias inmediatas que permite:

- ✅ **Transferencias**: Envío de dinero instantáneo entre cuentas usando número de cuenta o alias
- ✅ **Recargas**: Recargas de saldo a operadoras móviles (Claro, Movistar, CNT, Tuenti)
- ✅ **Gestión de Alias**: Vinculación de cuentas con identificadores de pago rápido
- ✅ **Automatización**: Triggers, funciones y procesos automáticos para auditoría
- ✅ **Validaciones**: Saldo, límites, estados de cuenta en tiempo real
- ✅ **Trazabilidad**: Auditoría completa de todas las operaciones

## 🗂️ Estructura del Proyecto

```
ExamenU3/
├── database_deuna.sql          # Script SQL completo de la base de datos
├── script.sql                  # Script adicional (si existe)
├── Backend/                    # API REST Node.js + Express
│   ├── config/                 # Configuración de BD
│   ├── controllers/            # Controladores (lógica de negocio)
│   ├── routes/                 # Rutas de la API
│   ├── .env                    # Variables de entorno
│   ├── package.json            # Dependencias del backend
│   ├── server.js               # Servidor principal
│   └── README.md               # Documentación del backend
└── Frontend/                   # Aplicación React + Vite
    ├── src/
    │   ├── components/         # Componentes React
    │   ├── services/           # Servicios de API
    │   ├── App.jsx             # Componente principal
    │   └── main.jsx            # Punto de entrada
    ├── .env                    # Variables de entorno
    ├── package.json            # Dependencias del frontend
    ├── vite.config.js          # Configuración de Vite
    └── README.md               # Documentación del frontend
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **PostgreSQL** 12 o superior
- **Node.js** 18 o superior
- **npm** 8 o superior

### 1. Base de Datos

#### Crear la base de datos:

```bash
# Opción 1: Desde la consola de PostgreSQL
psql -U postgres

# Opción 2: Ejecutar el script directamente
psql -U postgres -f database_deuna.sql
```

#### El script automáticamente:
- Elimina y crea la base de datos `deuna_banco`
- Crea todos los tipos de datos (ENUMs)
- Crea 9 tablas principales
- Inserta 10 registros de prueba por tabla
- Crea funciones y triggers de automatización
- Crea vistas e índices de optimización

### 2. Backend (API REST)

```bash
# Ir a la carpeta del backend
cd Backend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Editar el archivo .env con tus credenciales de PostgreSQL
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=deuna_banco
# DB_USER=postgres
# DB_PASSWORD=tu_password

# Iniciar el servidor
npm run dev
```

El servidor estará disponible en: **http://localhost:3000**

### 3. Frontend (React)

```bash
# Ir a la carpeta del frontend
cd Frontend

# Instalar dependencias
npm install

# Configurar variables de entorno (opcional, ya está configurado)
# VITE_API_URL=http://localhost:3000/api/v1

# Iniciar la aplicación
npm run dev
```

La aplicación estará disponible en: **http://localhost:5173**

## 📊 Modelo de Base de Datos

### Tablas Principales

1. **clientes** - Información de clientes del banco
2. **cuentas** - Cuentas bancarias (ahorros, corriente, maestra)
3. **tarjetas** - Tarjetas de débito/crédito asociadas
4. **alias_pago** - Alias Deuna para pagos rápidos
5. **transacciones** - Registro de todas las transacciones
6. **comisiones** - Configuración de comisiones por tipo
7. **recargas** - Detalles específicos de recargas móviles
8. **auditoria** - Trazabilidad de todas las operaciones

### Tipos de Datos Personalizados (ENUMs)

- `tipo_cuenta_enum`: AHORROS, CORRIENTE, MAESTRA
- `estado_transaccion_enum`: PENDIENTE, CONFIRMADA, FALLIDA, REVERSADA, EXPIRADA
- `tipo_transaccion_enum`: TRANSFERENCIA, RECARGA, PAGO_QR, COBRO
- Y más...

### Automatización

#### Funciones:
- `calcular_comision()` - Calcula comisión según tipo y monto
- `validar_saldo()` - Verifica saldo suficiente
- `validar_limites()` - Valida límites diarios y por transacción
- `expirar_transacciones_pendientes()` - Expira transacciones antiguas
- `reversar_transaccion()` - Reversa una transacción confirmada

#### Triggers:
- `trigger_actualizar_saldos` - Actualiza saldos automáticamente
- `trigger_auditoria_transacciones` - Registra auditoría automática

## 🔌 API Endpoints

### Transferencias
```
POST   /api/v1/transferencias                    - Crear transferencia
GET    /api/v1/transferencias/cuenta/:id_cuenta  - Historial
GET    /api/v1/transferencias/:id_transaccion    - Detalle
POST   /api/v1/transferencias/:id/reversar       - Reversar
```

### Recargas
```
POST   /api/v1/recargas                          - Crear recarga
GET    /api/v1/recargas/cuenta/:id_cuenta        - Historial
GET    /api/v1/recargas/operadoras               - Operadoras disponibles
GET    /api/v1/recargas/estadisticas/:id_cuenta  - Estadísticas
GET    /api/v1/recargas/:id_transaccion          - Detalle
```

### Clientes
```
GET    /api/v1/clientes                          - Listar clientes
GET    /api/v1/clientes/:id_cliente              - Detalle cliente
```

### Cuentas
```
GET    /api/v1/cuentas/cliente/:id_cliente       - Cuentas de cliente
GET    /api/v1/cuentas/:id_cuenta                - Detalle cuenta
GET    /api/v1/cuentas/:id_cuenta/saldo          - Consultar saldo
```

### Transacciones
```
GET    /api/v1/transacciones                     - Listar (con filtros)
GET    /api/v1/transacciones/:id_transaccion     - Detalle
```

### Alias
```
GET    /api/v1/alias/cliente/:id_cliente         - Alias de cliente
GET    /api/v1/alias/buscar/:valor_alias         - Buscar por alias
```

## 💻 Uso del Sistema

### Realizar una Transferencia

1. Selecciona tu cuenta de origen
2. Ingresa el destino (número de cuenta o alias como @usuario, teléfono)
3. Ingresa el monto
4. Opcionalmente añade una descripción
5. Revisa el resumen (monto + comisión)
6. Confirma la transferencia

### Realizar una Recarga

1. Selecciona tu cuenta de pago
2. Elige la operadora (Claro, Movistar, CNT, Tuenti)
3. Ingresa el número de teléfono (10 dígitos)
4. Selecciona o ingresa el monto
5. Revisa el resumen con la comisión
6. Confirma la recarga
7. Guarda el código de confirmación

## 📈 Características Avanzadas

### Validaciones Automáticas
- ✅ Saldo disponible suficiente
- ✅ Límites por transacción
- ✅ Límites diarios
- ✅ Estado de cuentas activas
- ✅ Validación de operadoras

### Comisiones Dinámicas
Configuradas en la tabla `comisiones`:
- Transferencias: 0% hasta $100, luego porcentaje + fijo
- Recargas: Fijas o porcentajes según el monto
- Totalmente configurable sin modificar código

### Auditoría Completa
- Registro automático de todas las operaciones
- IP de origen y dispositivo
- Datos anteriores y nuevos (JSONB)
- Timestamp de cada acción

### Estados de Transacciones
- **PENDIENTE**: Creada pero no procesada
- **CONFIRMADA**: Procesada exitosamente
- **FALLIDA**: Error en el procesamiento
- **REVERSADA**: Reversada por el sistema
- **EXPIRADA**: Expirada por timeout

## 🛠️ Tecnologías Utilizadas

### Base de Datos
- **PostgreSQL 12+** con tipos personalizados, triggers y funciones

### Backend
- **Node.js 18+**
- **Express.js 4** - Framework web
- **pg** - Driver PostgreSQL
- **express-validator** - Validación de datos
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Variables de entorno

### Frontend
- **React 18** - Biblioteca UI
- **Vite 5** - Build tool
- **Axios** - Cliente HTTP
- **CSS3** - Estilos modernos con variables

## 📝 Datos de Prueba

El sistema incluye 10 registros de prueba en cada tabla:

- 10 clientes con diferentes tipos de documento
- 10 cuentas con diferentes tipos y saldos
- 10 tarjetas (débito, crédito, prepago)
- 10 alias de pago (teléfono, email, alias, token)
- 10 transacciones de ejemplo (transferencias y recargas)
- 10 configuraciones de comisiones
- Y más...

### Cuenta de Prueba Sugerida
- **Cliente**: Juan Carlos Pérez (ID: 1)
- **Cuenta**: 2202567891234
- **Saldo**: $5,000.00
- **Alias**: 0998765432

## 🔒 Seguridad

- Validación de datos en frontend y backend
- Transacciones atómicas en PostgreSQL
- Auditoría completa de operaciones
- Control de límites y saldos
- Registro de IP y dispositivo
- Estados de transacciones robustos

## 📚 Documentación Adicional

- [Backend README](./Backend/README.md) - Documentación detallada de la API
- [Frontend README](./Frontend/README.md) - Documentación de la interfaz
- [Script SQL](./database_deuna.sql) - Comentarios en el código SQL

## 🎯 Evaluación del Proyecto

### Base de Datos (6 puntos)
- ✅ Modelado con tipos personalizados
- ✅ 9 tablas relacionadas correctamente
- ✅ 10 registros de prueba por tabla
- ✅ Constraints y validaciones
- ✅ Índices de optimización

### Backend / Lógica (7 puntos)
- ✅ API REST completa
- ✅ Controladores con lógica de negocio
- ✅ Consultas avanzadas con filtros y joins
- ✅ Validaciones robustas
- ✅ Manejo de errores

### Automatización (5 puntos)
- ✅ Triggers para actualizar saldos
- ✅ Funciones de validación
- ✅ Auditoría automática
- ✅ Cálculo de comisiones
- ✅ Funciones de reverso y expiración

### Interfaz (2 puntos)
- ✅ Interfaz moderna y responsive
- ✅ Componentes de Transferencia y Recarga
- ✅ Validaciones en tiempo real
- ✅ Feedback visual al usuario

**Total: 20 puntos**

## 👨‍💻 Autor

Sistema desarrollado para el Examen Unidad 3 - Sistemas de Administración de Bases de Datos
ESPE 5.0

## 📞 Soporte

Para dudas o problemas:
1. Revisa los README de Backend y Frontend
2. Verifica que PostgreSQL esté corriendo
3. Verifica las credenciales en los archivos .env
4. Revisa los logs en la consola del backend

---

**¡Gracias por usar el Sistema Deuna!** 🚀
