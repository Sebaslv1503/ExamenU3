const { query } = require('../config/database');

// Obtener alias de un cliente
const obtenerAliasPorCliente = async (req, res) => {
    const { id_cliente } = req.params;

    try {
        const resultado = await query(
            `SELECT a.*,
                c.numero_cuenta,
                c.tipo_cuenta
            FROM alias_pago a
            JOIN cuentas c ON a.id_cuenta = c.id_cuenta
            WHERE a.id_cliente = $1 AND a.activo = TRUE
            ORDER BY a.fecha_creacion DESC`,
            [id_cliente]
        );

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {
        console.error('Error al obtener alias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener alias del cliente'
        });
    }
};

// Buscar cuenta por alias
const buscarPorAlias = async (req, res) => {
    const { valor_alias } = req.params;

    try {
        const resultado = await query(
            `SELECT a.*, 
                c.numero_cuenta,
                c.tipo_cuenta,
                cl.nombres || ' ' || cl.apellidos as titular
            FROM alias_pago a
            JOIN cuentas c ON a.id_cuenta = c.id_cuenta
            JOIN clientes cl ON a.id_cliente = cl.id_cliente
            WHERE a.valor_alias = $1 AND a.activo = TRUE`,
            [valor_alias]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Alias no encontrado'
            });
        }

        res.json({
            success: true,
            data: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al buscar alias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar alias'
        });
    }
};

module.exports = {
    obtenerAliasPorCliente,
    buscarPorAlias
};
