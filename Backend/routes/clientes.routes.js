const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');

/**
 * @route   GET /api/v1/clientes
 * @desc    Obtener todos los clientes (con paginación y búsqueda)
 * @access  Private
 */
router.get('/', clientesController.obtenerClientes);

/**
 * @route   GET /api/v1/clientes/:id_cliente
 * @desc    Obtener un cliente por ID con sus cuentas y alias
 * @access  Private
 */
router.get('/:id_cliente', clientesController.obtenerClientePorId);

module.exports = router;
