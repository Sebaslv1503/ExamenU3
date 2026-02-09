# Frontend Deuna - Banco de Pichincha

Interfaz web para el sistema de transferencias y recargas Deuna.

## 🚀 Instalación

```bash
cd Frontend
npm install
```

## ⚙️ Configuración

Crea un archivo `.env` con:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 📦 Iniciar Aplicación

```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview
```

La aplicación estará disponible en `http://localhost:5173`

## ✨ Características

### Transferencias
- ✅ Transferir a cuentas por número o alias
- ✅ Búsqueda en tiempo real de destinatarios
- ✅ Cálculo automático de comisiones
- ✅ Validación de saldos y límites
- ✅ Confirmación instantánea

### Recargas
- ✅ Recargas a 4 operadoras: Claro, Movistar, CNT, Tuenti
- ✅ Montos predefinidos y personalizados
- ✅ Selección visual de operadoras
- ✅ Código de confirmación inmediato
- ✅ Historial de recargas

## 🎨 Tecnologías

- React 18
- Vite
- Axios
- CSS3 con variables
- Design System del Banco de Pichincha

## 📱 Responsive

La interfaz es completamente responsive y funciona en:
- 💻 Desktop
- 📱 Tablet
- 📲 Mobile
