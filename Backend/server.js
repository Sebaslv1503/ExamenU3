const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rutas
const clientesRoutes = require('./routes/clientes.routes');
const cuentasRoutes = require('./routes/cuentas.routes');
const transferenciasRoutes = require('./routes/transferencias.routes');
const recargasRoutes = require('./routes/recargas.routes');
const transaccionesRoutes = require('./routes/transacciones.routes');
const aliasRoutes = require('./routes/alias.routes');
const authRoutes = require('./routes/auth.routes');

// Prefijo de APIs
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(`${API_PREFIX}/clientes`, clientesRoutes);
app.use(`${API_PREFIX}/cuentas`, cuentasRoutes);
app.use(`${API_PREFIX}/transferencias`, transferenciasRoutes);
app.use(`${API_PREFIX}/recargas`, recargasRoutes);
app.use(`${API_PREFIX}/transacciones`, transaccionesRoutes);
app.use(`${API_PREFIX}/alias`, aliasRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({
        message: '🏦 API Deuna - Banco de Pichincha',
        version: '1.0.0',
        endpoints: {
            clientes: `${API_PREFIX}/clientes`,
            cuentas: `${API_PREFIX}/cuentas`,
            transferencias: `${API_PREFIX}/transferencias`,
            recargas: `${API_PREFIX}/recargas`,
            transacciones: `${API_PREFIX}/transacciones`,
            alias: `${API_PREFIX}/alias`
        }
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
    });
});

// Manejo de errores general
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor Deuna corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}${API_PREFIX}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
