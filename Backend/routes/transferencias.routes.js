const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const transferenciasController = require('../controllers/transferencias.controller');

// Middleware de validación
const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Validaciones para crear transferencia
const validacionesCrearTransferencia = [
    body('id_cuenta_origen')
        .notEmpty().withMessage('La cuenta de origen es requerida')
        .isInt().withMessage('ID de cuenta origen inválido'),
    body('identificador_destino')
        .notEmpty().withMessage('El identificador de destino es requerido'),
    body('monto')
        .notEmpty().withMessage('El monto es requerido')
        .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
    body('descripcion')
        .optional()
        .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
];

/**
 * @route   POST /api/v1/transferencias
 * @desc    Crear una nueva transferencia
 * @access  Private
 */
router.post('/', validacionesCrearTransferencia, validarCampos, transferenciasController.crearTransferencia);

/**
 * @route   GET /api/v1/transferencias/cuenta/:id_cuenta
 * @desc    Obtener historial de transferencias de una cuenta
 * @access  Private
 */
router.get('/cuenta/:id_cuenta', transferenciasController.obtenerTransferencias);

/**
 * @route   GET /api/v1/transferencias/:id_transaccion
 * @desc    Obtener detalle de una transferencia
 * @access  Private
 */
router.get('/:id_transaccion', transferenciasController.obtenerDetalleTransferencia);

/**
 * @route   POST /api/v1/transferencias/:id_transaccion/reversar
 * @desc    Reversar una transferencia confirmada
 * @access  Private
 */
router.post('/:id_transaccion/reversar', transferenciasController.reversarTransferencia);

module.exports = router;
