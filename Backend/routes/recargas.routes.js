const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const recargasController = require('../controllers/recargas.controller');

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

// Validaciones para crear recarga
const validacionesCrearRecarga = [
    body('id_cuenta_origen')
        .notEmpty().withMessage('La cuenta de origen es requerida')
        .isInt().withMessage('ID de cuenta origen inválido'),
    body('numero_telefono')
        .notEmpty().withMessage('El número de teléfono es requerido')
        .matches(/^[0-9]{10}$/).withMessage('El número de teléfono debe tener 10 dígitos'),
    body('operadora')
        .notEmpty().withMessage('La operadora es requerida')
        .isIn(['CLARO', 'MOVISTAR', 'CNT', 'TUENTI']).withMessage('Operadora no válida'),
    body('monto')
        .notEmpty().withMessage('El monto es requerido')
        .isFloat({ min: 1, max: 100 }).withMessage('El monto debe estar entre $1 y $100'),
    body('tipo_recarga')
        .optional()
        .isIn(['PREPAGO', 'POSTPAGO']).withMessage('Tipo de recarga no válido')
];

/**
 * @route   POST /api/v1/recargas
 * @desc    Crear una nueva recarga
 * @access  Private
 */
router.post('/', validacionesCrearRecarga, validarCampos, recargasController.crearRecarga);

/**
 * @route   GET /api/v1/recargas/cuenta/:id_cuenta
 * @desc    Obtener historial de recargas de una cuenta
 * @access  Private
 */
router.get('/cuenta/:id_cuenta', recargasController.obtenerRecargas);

/**
 * @route   GET /api/v1/recargas/operadoras
 * @desc    Obtener operadoras disponibles
 * @access  Public
 */
router.get('/operadoras', recargasController.obtenerOperadoras);

/**
 * @route   GET /api/v1/recargas/estadisticas/:id_cuenta
 * @desc    Obtener estadísticas de recargas
 * @access  Private
 */
router.get('/estadisticas/:id_cuenta', recargasController.obtenerEstadisticasRecargas);

/**
 * @route   GET /api/v1/recargas/:id_transaccion
 * @desc    Obtener detalle de una recarga
 * @access  Private
 */
router.get('/:id_transaccion', recargasController.obtenerDetalleRecarga);

module.exports = router;
