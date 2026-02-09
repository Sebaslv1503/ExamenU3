const { query } = require('../config/database');

// Obtener cuentas de un cliente
const obtenerCuentasPorCliente = async (req, res) => {
    const { id_cliente } = req.params;

    try {
        const resultado = await query(
            `SELECT c.*,
                cl.nombres || ' ' || cl.apellidos as titular
            FROM cuentas c
            JOIN clientes cl ON c.id_cliente = cl.id_cliente
            WHERE c.id_cliente = $1
            ORDER BY c.fecha_apertura DESC`,
            [id_cliente]
        );

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {
        console.error('Error al obtener cuentas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cuentas del cliente'
        });
    }
};

// Obtener detalle de una cuenta
const obtenerDetalleCuenta = async (req, res) => {
    const { id_cuenta } = req.params;

    try {
        const resultado = await query(
            `SELECT c.*,
                cl.nombres || ' ' || cl.apellidos as titular,
                cl.email,
                cl.telefono,
                cl.numero_documento
            FROM cuentas c
            JOIN clientes cl ON c.id_cliente = cl.id_cliente
            WHERE c.id_cuenta = $1`,
            [id_cuenta]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        // Obtener últimas transacciones
        const transacciones = await query(
            `SELECT * FROM transacciones
            WHERE id_cuenta_origen = $1 OR id_cuenta_destino = $1
            ORDER BY fecha_creacion DESC
            LIMIT 10`,
            [id_cuenta]
        );

        res.json({
            success: true,
            data: {
                ...resultado.rows[0],
                ultimas_transacciones: transacciones.rows
            }
        });

    } catch (error) {
        console.error('Error al obtener cuenta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalles de la cuenta'
        });
    }
};

// Obtener saldo de una cuenta
const obtenerSaldo = async (req, res) => {
    const { id_cuenta } = req.params;

    try {
        const resultado = await query(
            `SELECT id_cuenta, numero_cuenta, tipo_cuenta, saldo_disponible, saldo_bloqueado,
                (saldo_disponible + saldo_bloqueado) as saldo_total,
                estado
            FROM cuentas
            WHERE id_cuenta = $1`,
            [id_cuenta]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.json({
            success: true,
            data: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al obtener saldo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener saldo de la cuenta'
        });
    }
};

module.exports = {
    obtenerCuentasPorCliente,
    obtenerDetalleCuenta,
    obtenerSaldo
};
