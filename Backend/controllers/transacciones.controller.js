const { query } = require('../config/database');

// Obtener todas las transacciones (con filtros)
const obtenerTransacciones = async (req, res) => {
    const { limite = 20, pagina = 1, tipo, estado, id_cuenta, fecha_desde, fecha_hasta } = req.query;

    try {
        let queryText = `
            SELECT t.*,
                co.numero_cuenta as cuenta_origen,
                cd.numero_cuenta as cuenta_destino
            FROM transacciones t
            JOIN cuentas co ON t.id_cuenta_origen = co.id_cuenta
            LEFT JOIN cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (tipo) {
            queryText += ` AND t.tipo_transaccion = $${paramIndex}`;
            params.push(tipo.toUpperCase());
            paramIndex++;
        }

        if (estado) {
            queryText += ` AND t.estado = $${paramIndex}`;
            params.push(estado.toUpperCase());
            paramIndex++;
        }

        if (id_cuenta) {
            queryText += ` AND (t.id_cuenta_origen = $${paramIndex} OR t.id_cuenta_destino = $${paramIndex})`;
            params.push(id_cuenta);
            paramIndex++;
        }

        if (fecha_desde) {
            queryText += ` AND t.fecha_creacion >= $${paramIndex}`;
            params.push(fecha_desde);
            paramIndex++;
        }

        if (fecha_hasta) {
            queryText += ` AND t.fecha_creacion <= $${paramIndex}`;
            params.push(fecha_hasta);
            paramIndex++;
        }

        queryText += ` ORDER BY t.fecha_creacion DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limite, (pagina - 1) * limite);

        const resultado = await query(queryText, params);

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {
        console.error('Error al obtener transacciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener transacciones'
        });
    }
};

// Obtener detalle de una transacción
const obtenerTransaccionPorId = async (req, res) => {
    const { id_transaccion } = req.params;

    try {
        const resultado = await query(
            `SELECT * FROM vista_transacciones_completa
            WHERE id_transaccion = $1`,
            [id_transaccion]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }

        res.json({
            success: true,
            data: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al obtener transacción:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalles de la transacción'
        });
    }
};

module.exports = {
    obtenerTransacciones,
    obtenerTransaccionPorId
};
