const { query } = require('../config/database');


// Login por número de cuenta y contraseña
const login = async (req, res) => {
    const { numero_cuenta, password } = req.body;
    if (!numero_cuenta || !password) {
        return res.status(400).json({ success: false, message: 'Debe ingresar número de cuenta y contraseña' });
    }
    try {
        // Buscar cuenta y cliente con contraseña
        const result = await query(
            `SELECT c.id_cuenta, c.numero_cuenta, c.tipo_cuenta, c.saldo_disponible, c.estado,
                    cl.id_cliente, cl.nombres, cl.apellidos, cl.email, cl.telefono, cl.password
             FROM cuentas c
             JOIN clientes cl ON c.id_cliente = cl.id_cliente
             WHERE c.numero_cuenta = $1 AND c.estado = 'ACTIVA'`,
            [numero_cuenta]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada o inactiva' });
        }
        const cuenta = result.rows[0];
        if (cuenta.password !== password) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
        // Simular token (no seguridad real)
        const token = Buffer.from(`${cuenta.id_cuenta}:${Date.now()}`).toString('base64');
        // No enviar password al frontend
        delete cuenta.password;
        res.json({
            success: true,
            token,
            cuenta
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en login', error: error.message });
    }
};

module.exports = { login };
