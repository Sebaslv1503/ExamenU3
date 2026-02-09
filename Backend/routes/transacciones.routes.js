const express = require('express');
const router = express.Router();
const transaccionesController = require('../controllers/transacciones.controller');

/**
 * @route   GET /api/v1/transacciones
 * @desc    Obtener todas las transacciones con filtros opcionales
 * @access  Private
 */
router.get('/', transaccionesController.obtenerTransacciones);

/**
 * @route   GET /api/v1/transacciones/:id_transaccion
 * @desc    Obtener detalle de una transacción
 * @access  Private
 */
router.get('/:id_transaccion', transaccionesController.obtenerTransaccionPorId);

module.exports = router;
