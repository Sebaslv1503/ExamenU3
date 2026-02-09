const express = require('express');
const router = express.Router();
const aliasController = require('../controllers/alias.controller');

/**
 * @route   GET /api/v1/alias/cliente/:id_cliente
 * @desc    Obtener todos los alias de un cliente
 * @access  Private
 */
router.get('/cliente/:id_cliente', aliasController.obtenerAliasPorCliente);

/**
 * @route   GET /api/v1/alias/buscar/:valor_alias
 * @desc    Buscar cuenta por alias
 * @access  Private
 */
router.get('/buscar/:valor_alias', aliasController.buscarPorAlias);

module.exports = router;
