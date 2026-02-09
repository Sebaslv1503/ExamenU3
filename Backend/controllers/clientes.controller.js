const { query } = require('../config/database');

// Obtener todos los clientes
const obtenerClientes = async (req, res) => {
    const { limite = 20, pagina = 1, buscar } = req.query;

    try {
        let queryText = `
            SELECT c.*, 
                COUNT(DISTINCT cu.id_cuenta) as total_cuentas,
                COALESCE(SUM(cu.saldo_disponible), 0) as saldo_total
            FROM clientes c
            LEFT JOIN cuentas cu ON c.id_cliente = cu.id_cliente
        `;

        const params = [];
        let paramIndex = 1;

        if (buscar) {
            queryText += ` WHERE (c.nombres ILIKE $${paramIndex} OR c.apellidos ILIKE $${paramIndex} OR c.numero_documento ILIKE $${paramIndex})`;
            params.push(`%${buscar}%`);
            paramIndex++;
        }

        queryText += ` GROUP BY c.id_cliente ORDER BY c.id_cliente DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limite, (pagina - 1) * limite);

        const resultado = await query(queryText, params);

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes'
        });
    }
};

// Obtener un cliente por ID
const obtenerClientePorId = async (req, res) => {
    const { id_cliente } = req.params;

    try {
        const resultado = await query(
            `SELECT c.*
            FROM clientes c
            WHERE c.id_cliente = $1`,
            [id_cliente]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        // Obtener cuentas del cliente
        const cuentas = await query(
            'SELECT * FROM cuentas WHERE id_cliente = $1',
            [id_cliente]
        );

        // Obtener alias del cliente
        const alias = await query(
            'SELECT * FROM alias_pago WHERE id_cliente = $1 AND activo = TRUE',
            [id_cliente]
        );

        res.json({
            success: true,
            data: {
                ...resultado.rows[0],
                cuentas: cuentas.rows,
                alias: alias.rows
            }
        });

    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos del cliente'
        });
    }
};

module.exports = {
    obtenerClientes,
    obtenerClientePorId
};
