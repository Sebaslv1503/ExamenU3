const { transaction, query } = require('../config/database');

// Crear una nueva recarga
const crearRecarga = async (req, res) => {
    const {
        id_cuenta_origen,
        numero_telefono,
        operadora,
        monto,
        tipo_recarga = 'PREPAGO',
        ip_origen,
        dispositivo
    } = req.body;

    try {
        const resultado = await transaction(async (client) => {
            // 1. Validar cuenta origen
            const cuentaOrigenQuery = await client.query(
                'SELECT * FROM cuentas WHERE id_cuenta = $1 AND estado = $2',
                [id_cuenta_origen, 'ACTIVA']
            );

            if (cuentaOrigenQuery.rows.length === 0) {
                throw new Error('Cuenta de origen no válida o inactiva');
            }

            // 2. Validar operadora
            const operadorasValidas = ['CLARO', 'MOVISTAR', 'CNT', 'TUENTI'];
            if (!operadorasValidas.includes(operadora.toUpperCase())) {
                throw new Error('Operadora no válida. Operadoras disponibles: CLARO, MOVISTAR, CNT, TUENTI');
            }

            // 3. Validar monto de recarga (generalmente entre $1 y $100)
            if (monto < 1 || monto > 100) {
                throw new Error('El monto de recarga debe estar entre $1 y $100');
            }

            // 4. Calcular comisión
            const comisionQuery = await client.query(
                "SELECT calcular_comision('RECARGA'::tipo_transaccion_enum, $1) as comision",
                [monto]
            );
            const comision = parseFloat(comisionQuery.rows[0].comision);
            const monto_total = parseFloat(monto) + comision;

            // 5. Validar saldo suficiente
            const saldoQuery = await client.query(
                'SELECT validar_saldo($1, $2) as tiene_saldo',
                [id_cuenta_origen, monto_total]
            );

            if (!saldoQuery.rows[0].tiene_saldo) {
                throw new Error('Saldo insuficiente para realizar la recarga');
            }

            // 6. Validar límites
            const limitesQuery = await client.query(
                'SELECT validar_limites($1, $2) as dentro_limites',
                [id_cuenta_origen, monto]
            );

            if (!limitesQuery.rows[0].dentro_limites) {
                throw new Error('La recarga excede los límites permitidos');
            }

            // 7. Generar referencia única y códigos
            const referencia = `RCG-${new Date().getFullYear()}-${Date.now()}`;
            const codigo_recarga = `${operadora.substring(0, 3).toUpperCase()}-RCG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
            const codigo_confirmacion = `CONF-${new Date().getFullYear()}-${operadora.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

            // 8. Crear la transacción
            const transaccionQuery = await client.query(
                `INSERT INTO transacciones 
                (tipo_transaccion, id_cuenta_origen, monto, comision, monto_total, 
                referencia, descripcion, estado, ip_origen, dispositivo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`,
                [
                    'RECARGA',
                    id_cuenta_origen,
                    monto,
                    comision,
                    monto_total,
                    referencia,
                    `Recarga ${operadora} - ${numero_telefono}`,
                    'PENDIENTE',
                    ip_origen || req.ip,
                    dispositivo || req.get('User-Agent')
                ]
            );

            const transaccion = transaccionQuery.rows[0];

            // 9. Crear el registro de recarga
            const recargaQuery = await client.query(
                `INSERT INTO recargas 
                (id_transaccion, numero_telefono, operadora, tipo_recarga, codigo_recarga, codigo_confirmacion)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    transaccion.id_transaccion,
                    numero_telefono,
                    operadora.toUpperCase(),
                    tipo_recarga,
                    codigo_recarga,
                    codigo_confirmacion
                ]
            );

            // 10. Procesar la recarga (actualizar estado a CONFIRMADA)
            // El trigger actualizar_saldos_transaccion se encargará de actualizar el saldo
            await client.query(
                'UPDATE transacciones SET estado = $1 WHERE id_transaccion = $2',
                ['CONFIRMADA', transaccion.id_transaccion]
            );

            // 11. Obtener la recarga completa con todos los datos
            const recargaFinalQuery = await client.query(
                `SELECT t.*, r.*, 
                    c.numero_cuenta,
                    (SELECT saldo_disponible FROM cuentas WHERE id_cuenta = $1) as saldo_actual
                FROM transacciones t
                JOIN recargas r ON t.id_transaccion = r.id_transaccion
                JOIN cuentas c ON t.id_cuenta_origen = c.id_cuenta
                WHERE t.id_transaccion = $2`,
                [id_cuenta_origen, transaccion.id_transaccion]
            );

            return recargaFinalQuery.rows[0];
        });

        res.status(201).json({
            success: true,
            message: 'Recarga procesada exitosamente',
            data: resultado
        });

    } catch (error) {
        console.error('Error al crear recarga:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al procesar la recarga'
        });
    }
};

// Obtener historial de recargas de una cuenta
const obtenerRecargas = async (req, res) => {
    const { id_cuenta } = req.params;
    const { limite = 20, pagina = 1, operadora, fecha_desde, fecha_hasta } = req.query;

    try {
        let queryText = `
            SELECT t.*, r.*,
                c.numero_cuenta,
                cl.nombres || ' ' || cl.apellidos as titular
            FROM transacciones t
            JOIN recargas r ON t.id_transaccion = r.id_transaccion
            JOIN cuentas c ON t.id_cuenta_origen = c.id_cuenta
            JOIN clientes cl ON c.id_cliente = cl.id_cliente
            WHERE t.tipo_transaccion = 'RECARGA'
            AND t.id_cuenta_origen = $1
        `;

        const params = [id_cuenta];
        let paramIndex = 2;

        if (operadora) {
            queryText += ` AND r.operadora = $${paramIndex}`;
            params.push(operadora.toUpperCase());
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

        // Contar total de registros
        let countQuery = `
            SELECT COUNT(*) 
            FROM transacciones t
            JOIN recargas r ON t.id_transaccion = r.id_transaccion
            WHERE t.tipo_transaccion = 'RECARGA'
            AND t.id_cuenta_origen = $1
        `;
        const countParams = [id_cuenta];
        const countResult = await query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: resultado.rows,
            pagination: {
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                total: total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Error al obtener recargas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial de recargas'
        });
    }
};

// Obtener detalles de una recarga específica
const obtenerDetalleRecarga = async (req, res) => {
    const { id_transaccion } = req.params;

    try {
        const resultado = await query(
            `SELECT t.*, r.*,
                c.numero_cuenta,
                cl.nombres || ' ' || cl.apellidos as titular,
                cl.email
            FROM transacciones t
            JOIN recargas r ON t.id_transaccion = r.id_transaccion
            JOIN cuentas c ON t.id_cuenta_origen = c.id_cuenta
            JOIN clientes cl ON c.id_cliente = cl.id_cliente
            WHERE t.id_transaccion = $1 AND t.tipo_transaccion = 'RECARGA'`,
            [id_transaccion]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recarga no encontrada'
            });
        }

        res.json({
            success: true,
            data: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al obtener detalle de recarga:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalles de la recarga'
        });
    }
};

// Consultar operadoras disponibles
const obtenerOperadoras = async (req, res) => {
    try {
        const operadoras = [
            {
                codigo: 'CLARO',
                nombre: 'Claro Ecuador',
                montos_disponibles: [5, 10, 15, 20, 25, 30, 50, 100],
                comision_base: 0.30
            },
            {
                codigo: 'MOVISTAR',
                nombre: 'Movistar Ecuador',
                montos_disponibles: [5, 10, 15, 20, 25, 30, 50, 100],
                comision_base: 0.30
            },
            {
                codigo: 'CNT',
                nombre: 'CNT Ecuador',
                montos_disponibles: [5, 10, 15, 20, 25, 30, 50, 100],
                comision_base: 0.30
            },
            {
                codigo: 'TUENTI',
                nombre: 'Tuenti Ecuador',
                montos_disponibles: [5, 10, 15, 20, 25, 30, 50],
                comision_base: 0.30
            }
        ];

        res.json({
            success: true,
            data: operadoras
        });

    } catch (error) {
        console.error('Error al obtener operadoras:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener operadoras disponibles'
        });
    }
};

// Obtener estadísticas de recargas
const obtenerEstadisticasRecargas = async (req, res) => {
    const { id_cuenta } = req.params;
    const { fecha_desde, fecha_hasta } = req.query;

    try {
        let queryText = `
            SELECT 
                r.operadora,
                COUNT(*) as total_recargas,
                SUM(t.monto) as monto_total,
                AVG(t.monto) as monto_promedio,
                SUM(t.comision) as comisiones_totales
            FROM transacciones t
            JOIN recargas r ON t.id_transaccion = r.id_transaccion
            WHERE t.tipo_transaccion = 'RECARGA'
            AND t.id_cuenta_origen = $1
            AND t.estado = 'CONFIRMADA'
        `;

        const params = [id_cuenta];
        let paramIndex = 2;

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

        queryText += ` GROUP BY r.operadora ORDER BY total_recargas DESC`;

        const resultado = await query(queryText, params);

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de recargas'
        });
    }
};

module.exports = {
    crearRecarga,
    obtenerRecargas,
    obtenerDetalleRecarga,
    obtenerOperadoras,
    obtenerEstadisticasRecargas
};
