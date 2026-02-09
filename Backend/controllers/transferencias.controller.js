const { transaction, query } = require('../config/database');

// Crear una nueva transferencia
const crearTransferencia = async (req, res) => {
    const {
        id_cuenta_origen,
        identificador_destino, // Puede ser número de cuenta o alias
        monto,
        descripcion,
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

            const cuentaOrigen = cuentaOrigenQuery.rows[0];

            // 2. Buscar cuenta destino (por número de cuenta o alias)
            let cuentaDestino;
            
            // Primero intentar buscar por número de cuenta
            let cuentaDestinoQuery = await client.query(
                'SELECT * FROM cuentas WHERE numero_cuenta = $1 AND estado = $2',
                [identificador_destino, 'ACTIVA']
            );

            if (cuentaDestinoQuery.rows.length > 0) {
                cuentaDestino = cuentaDestinoQuery.rows[0];
            } else {
                // Si no se encuentra, buscar por alias
                const aliasQuery = await client.query(
                    'SELECT id_cuenta FROM alias_pago WHERE valor_alias = $1 AND activo = TRUE',
                    [identificador_destino]
                );

                if (aliasQuery.rows.length === 0) {
                    throw new Error('Cuenta de destino no encontrada');
                }

                const id_cuenta_destino = aliasQuery.rows[0].id_cuenta;
                
                cuentaDestinoQuery = await client.query(
                    'SELECT * FROM cuentas WHERE id_cuenta = $1 AND estado = $2',
                    [id_cuenta_destino, 'ACTIVA']
                );

                if (cuentaDestinoQuery.rows.length === 0) {
                    throw new Error('Cuenta de destino no válida o inactiva');
                }

                cuentaDestino = cuentaDestinoQuery.rows[0];
            }

            // 3. Validar que no sea la misma cuenta
            if (cuentaOrigen.id_cuenta === cuentaDestino.id_cuenta) {
                throw new Error('No se puede transferir a la misma cuenta');
            }

            // 4. Calcular comisión
            const comisionQuery = await client.query(
                "SELECT calcular_comision('TRANSFERENCIA'::tipo_transaccion_enum, $1) as comision",
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
                throw new Error('Saldo insuficiente para realizar la transferencia');
            }

            // 6. Validar límites
            const limitesQuery = await client.query(
                'SELECT validar_limites($1, $2) as dentro_limites',
                [id_cuenta_origen, monto]
            );

            if (!limitesQuery.rows[0].dentro_limites) {
                throw new Error('La transferencia excede los límites permitidos');
            }

            // 7. Generar referencia única
            const referencia = `TRF-${new Date().getFullYear()}-${Date.now()}`;

            // 8. Crear la transacción
            const transaccionQuery = await client.query(
                `INSERT INTO transacciones 
                (tipo_transaccion, id_cuenta_origen, id_cuenta_destino, monto, comision, 
                monto_total, referencia, descripcion, estado, ip_origen, dispositivo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *`,
                [
                    'TRANSFERENCIA',
                    id_cuenta_origen,
                    cuentaDestino.id_cuenta,
                    monto,
                    comision,
                    monto_total,
                    referencia,
                    descripcion || 'Transferencia Deuna',
                    'PENDIENTE',
                    ip_origen || req.ip,
                    dispositivo || req.get('User-Agent')
                ]
            );

            const transaccion = transaccionQuery.rows[0];

            // 9. Procesar la transferencia (actualizar estado a CONFIRMADA)
            // El trigger actualizar_saldos_transaccion se encargará de actualizar los saldos
            await client.query(
                'UPDATE transacciones SET estado = $1 WHERE id_transaccion = $2',
                ['CONFIRMADA', transaccion.id_transaccion]
            );

            // 10. Obtener la transacción actualizada con saldos
            const transaccionFinalQuery = await client.query(
                `SELECT t.*, 
                    co.numero_cuenta as cuenta_origen_numero,
                    cd.numero_cuenta as cuenta_destino_numero,
                    (SELECT saldo_disponible FROM cuentas WHERE id_cuenta = $1) as saldo_actual
                FROM transacciones t
                JOIN cuentas co ON t.id_cuenta_origen = co.id_cuenta
                JOIN cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
                WHERE t.id_transaccion = $2`,
                [id_cuenta_origen, transaccion.id_transaccion]
            );

            return transaccionFinalQuery.rows[0];
        });

        res.status(201).json({
            success: true,
            message: 'Transferencia realizada exitosamente',
            data: resultado
        });

    } catch (error) {
        console.error('Error al crear transferencia:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al procesar la transferencia'
        });
    }
};

// Obtener historial de transferencias de una cuenta
const obtenerTransferencias = async (req, res) => {
    const { id_cuenta } = req.params;
    const { limite = 20, pagina = 1, estado, fecha_desde, fecha_hasta } = req.query;

    try {
        let queryText = `
            SELECT t.*, 
                co.numero_cuenta as cuenta_origen_numero,
                cd.numero_cuenta as cuenta_destino_numero,
                clo.nombres || ' ' || clo.apellidos as titular_origen,
                cld.nombres || ' ' || cld.apellidos as titular_destino
            FROM transacciones t
            JOIN cuentas co ON t.id_cuenta_origen = co.id_cuenta
            LEFT JOIN cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
            JOIN clientes clo ON co.id_cliente = clo.id_cliente
            LEFT JOIN clientes cld ON cd.id_cliente = cld.id_cliente
            WHERE t.tipo_transaccion = 'TRANSFERENCIA'
            AND (t.id_cuenta_origen = $1 OR t.id_cuenta_destino = $1)
        `;

        const params = [id_cuenta];
        let paramIndex = 2;

        if (estado) {
            queryText += ` AND t.estado = $${paramIndex}`;
            params.push(estado);
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
            WHERE t.tipo_transaccion = 'TRANSFERENCIA'
            AND (t.id_cuenta_origen = $1 OR t.id_cuenta_destino = $1)
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
        console.error('Error al obtener transferencias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial de transferencias'
        });
    }
};

// Obtener detalles de una transferencia específica
const obtenerDetalleTransferencia = async (req, res) => {
    const { id_transaccion } = req.params;

    try {
        const resultado = await query(
            `SELECT t.*, 
                co.numero_cuenta as cuenta_origen_numero,
                cd.numero_cuenta as cuenta_destino_numero,
                clo.nombres || ' ' || clo.apellidos as titular_origen,
                clo.email as email_origen,
                cld.nombres || ' ' || cld.apellidos as titular_destino,
                cld.email as email_destino
            FROM transacciones t
            JOIN cuentas co ON t.id_cuenta_origen = co.id_cuenta
            LEFT JOIN cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
            JOIN clientes clo ON co.id_cliente = clo.id_cliente
            LEFT JOIN clientes cld ON cd.id_cliente = cld.id_cliente
            WHERE t.id_transaccion = $1 AND t.tipo_transaccion = 'TRANSFERENCIA'`,
            [id_transaccion]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transferencia no encontrada'
            });
        }

        res.json({
            success: true,
            data: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al obtener detalle de transferencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalles de la transferencia'
        });
    }
};

// Reversar una transferencia
const reversarTransferencia = async (req, res) => {
    const { id_transaccion } = req.params;

    try {
        const resultado = await transaction(async (client) => {
            // Llamar a la función de reverso
            const reversoQuery = await client.query(
                'SELECT reversar_transaccion($1) as revertido',
                [id_transaccion]
            );

            if (!reversoQuery.rows[0].revertido) {
                throw new Error('No se pudo reversar la transferencia. Verifique que esté confirmada.');
            }

            // Obtener detalles de la transacción reversada
            const detalleQuery = await client.query(
                'SELECT * FROM transacciones WHERE id_transaccion = $1',
                [id_transaccion]
            );

            return detalleQuery.rows[0];
        });

        res.json({
            success: true,
            message: 'Transferencia reversada exitosamente',
            data: resultado
        });

    } catch (error) {
        console.error('Error al reversar transferencia:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al reversar la transferencia'
        });
    }
};

module.exports = {
    crearTransferencia,
    obtenerTransferencias,
    obtenerDetalleTransferencia,
    reversarTransferencia
};
