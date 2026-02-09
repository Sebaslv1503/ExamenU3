# ⚡ Guía Rápida de Ejecución - Sistema Deuna

## 🎯 Pasos para Ejecutar el Proyecto Completo

### 1️⃣ Base de Datos (2 minutos)

```powershell
# Abrir PostgreSQL
psql -U postgres

# Ejecutar el script (automáticamente crea todo)
\i 'C:/Users/Sebas/Desktop/ESPE 5.0/SABD/ExamenU3/database_deuna.sql'

# O desde PowerShell directamente:
psql -U postgres -f "database_deuna.sql"

# Verificar que se creó correctamente
\c deuna_banco
\dt
```

**El script crea automáticamente:**
- ✅ Base de datos `deuna_banco`
- ✅ 9 tablas con sus relaciones
- ✅ 10 registros de prueba en cada tabla
- ✅ Funciones y triggers de automatización
- ✅ Vistas e índices

### 2️⃣ Backend (1 minuto)

```powershell
# Ir a la carpeta Backend
cd Backend

# Instalar dependencias (solo la primera vez)
npm install

# IMPORTANTE: Verificar archivo .env
# Editar Backend/.env con tu contraseña de PostgreSQL
# DB_PASSWORD=tu_password_aqui

# Iniciar servidor
npm run dev

# Deberías ver:
# ✅ Servidor Deuna corriendo en http://localhost:3000
# ✅ Conectado a la base de datos PostgreSQL
```

### 3️⃣ Frontend (1 minuto)

```powershell
# Abrir NUEVA terminal PowerShell
# Ir a la carpeta Frontend
cd Frontend

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar aplicación React
npm run dev

# Deberías ver:
# ➜  Local:   http://localhost:5173/
```

### 4️⃣ Probar el Sistema

1. **Abrir navegador** en: http://localhost:5173

2. **Hacer una Transferencia:**
   - Selecciona cuenta: `2202567891234` (tiene $5,000)
   - Destino: `2202789123456` o usa alias `@carlosg`
   - Monto: `100`
   - Click en "Transferir Ahora"
   - ✅ Verás confirmación con referencia

3. **Hacer una Recarga:**
   - Selecciona cuenta: `2202567891234`
   - Operadora: Claro
   - Teléfono: `0998877665`
   - Monto: `10` o selecciona un monto rápido
   - Click en "Recargar Ahora"
   - ✅ Verás código de confirmación

## 🔍 Verificar en Base de Datos

```sql
-- Ver transacciones recientes
SELECT * FROM vista_transacciones_completa 
ORDER BY fecha_creacion DESC LIMIT 5;

-- Ver saldo actualizado
SELECT numero_cuenta, tipo_cuenta, saldo_disponible 
FROM cuentas 
WHERE id_cuenta = 1;

-- Ver auditoría
SELECT * FROM auditoria 
ORDER BY fecha_accion DESC LIMIT 5;
```

## 🛠️ Solución de Problemas

### Backend no conecta a PostgreSQL
```powershell
# Verificar que PostgreSQL está corriendo
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Si no está corriendo
Start-Service postgresql-x64-14  # Ajusta el nombre según tu versión

# Verificar credenciales en Backend/.env
# DB_USER=postgres
# DB_PASSWORD=tu_password
# DB_NAME=deuna_banco
```

### Frontend no carga
```powershell
# Verificar que el backend está corriendo
# Debe estar en http://localhost:3000

# Verificar Frontend/.env
# VITE_API_URL=http://localhost:3000/api/v1

# Limpiar caché y reinstalar
Remove-Item node_modules -Recurse -Force
npm install
npm run dev
```

### Error CORS
```
El backend ya tiene CORS habilitado.
Si persiste, verifica que:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
```

## 📋 Checklist de Verificación

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `deuna_banco` creada
- [ ] 10 registros en tabla `clientes`
- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173
- [ ] Transferencia exitosa realizada
- [ ] Recarga exitosa realizada
- [ ] Saldos actualizados correctamente
- [ ] Auditoría registrada

## 🎬 Demo Rápida

### Transferencia de Prueba
```json
POST http://localhost:3000/api/v1/transferencias
{
  "id_cuenta_origen": 1,
  "identificador_destino": "2202789123456",
  "monto": 100,
  "descripcion": "Prueba de transferencia"
}
```

### Recarga de Prueba
```json
POST http://localhost:3000/api/v1/recargas
{
  "id_cuenta_origen": 1,
  "numero_telefono": "0998877665",
  "operadora": "CLARO",
  "monto": 10
}
```

## 📊 Datos de Prueba Útiles

### Cuentas Disponibles
```
Cuenta 1: 2202567891234 - $5,000.00 (Juan Pérez)
Cuenta 2: 2202678912345 - $12,000.00 (María Rodríguez)
Cuenta 3: 2202789123456 - $3,500.00 (Carlos Gómez)
```

### Alias Disponibles
```
@carlosg → Cuenta 2202789123456
@patriramirez → Cuenta 2202123456789
@sofiortiz → Cuenta 2202567890123
0998765432 → Cuenta 2202567891234
```

## 🎯 Puntos Clave del Proyecto

✅ **Base de Datos (6 pts)**: ENUMs, 9 tablas, 10 registros cada una
✅ **Backend (7 pts)**: API REST, consultas avanzadas, joins, validaciones
✅ **Automatización (5 pts)**: Triggers, funciones, auditoría automática
✅ **Interfaz (2 pts)**: React, transferencias y recargas funcionales

**Total: 20 puntos**

---

## 🚀 ¡Listo para Usar!

Una vez completados los 3 pasos anteriores, el sistema está 100% funcional.

**URLs Importantes:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Documentación API: Ver Backend/README.md

**Para más detalles:** Consulta el [README.md](./README.md) principal
