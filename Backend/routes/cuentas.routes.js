const express = require('express');
const router = express.Router();
const cuentasController = require('../controllers/cuentas.controller');

/**
 * @route   GET /api/v1/cuentas/cliente/:id_cliente
 * @desc    Obtener todas las cuentas de un cliente
 * @access  Private
 */
router.get('/cliente/:id_cliente', cuentasController.obtenerCuentasPorCliente);

/**
 * @route   GET /api/v1/cuentas/:id_cuenta
 * @desc    Obtener detalle de una cuenta
 * @access  Private
 */
router.get('/:id_cuenta', cuentasController.obtenerDetalleCuenta);

/**
 * @route   GET /api/v1/cuentas/:id_cuenta/saldo
 * @desc    Obtener saldo de una cuenta
 * @access  Private
 */
router.get('/:id_cuenta/saldo', cuentasController.obtenerSaldo);

module.exports = router;
