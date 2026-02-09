import { useState, useEffect } from 'react';
import { crearRecarga, obtenerCuentasCliente, obtenerOperadoras } from '../services/deunaService';
import './Recarga.css';

function Recarga() {
    const [formData, setFormData] = useState({
        id_cuenta_origen: '',
        numero_telefono: '',
        operadora: '',
        monto: '',
        tipo_recarga: 'PREPAGO'
    });

    const [cuentas, setCuentas] = useState([]);
    const [operadoras, setOperadoras] = useState([]);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
    const [operadoraSeleccionada, setOperadoraSeleccionada] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Cargar cuentas del cliente 1
            const responseCuentas = await obtenerCuentasCliente(1);
            setCuentas(responseCuentas.data);

            // Cargar operadoras disponibles
            const responseOperadoras = await obtenerOperadoras();
            setOperadoras(responseOperadoras.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Si cambia la cuenta origen
        if (name === 'id_cuenta_origen') {
            const cuenta = cuentas.find(c => c.id_cuenta === parseInt(value));
            setCuentaSeleccionada(cuenta);
        }

        // Si cambia la operadora
        if (name === 'operadora') {
            const operadora = operadoras.find(o => o.codigo === value);
            setOperadoraSeleccionada(operadora);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje(null);

        try {
            const response = await crearRecarga({
                ...formData,
                id_cuenta_origen: parseInt(formData.id_cuenta_origen),
                monto: parseFloat(formData.monto)
            });

            setMensaje({
                tipo: 'success',
                texto: `¡Recarga exitosa! Código: ${response.data.codigo_recarga}`,
                detalles: response.data
            });

            // Limpiar formulario
            setFormData({
                id_cuenta_origen: '',
                numero_telefono: '',
                operadora: '',
                monto: '',
                tipo_recarga: 'PREPAGO'
            });
            setCuentaSeleccionada(null);
            setOperadoraSeleccionada(null);
            
            // Recargar cuentas
            const responseCuentas = await obtenerCuentasCliente(1);
            setCuentas(responseCuentas.data);

        } catch (error) {
            setMensaje({
                tipo: 'danger',
                texto: error.response?.data?.message || 'Error al procesar la recarga'
            });
        } finally {
            setLoading(false);
        }
    };

    const calcularComision = () => {
        const monto = parseFloat(formData.monto) || 0;
        if (monto <= 20) return 0.30;
        if (monto <= 50) return 0.50;
        return monto * 0.02;
    };

    const comision = calcularComision();
    const montoTotal = (parseFloat(formData.monto) || 0) + comision;

    return (
        <div className="recarga-container">
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📱 Nueva Recarga</h2>
                </div>

                {mensaje && (
                    <div className={`alert alert-${mensaje.tipo}`}>
                        <div>{mensaje.texto}</div>
                        {mensaje.detalles && (
                            <div className="recarga-confirmacion">
                                <p><strong>Código de Confirmación:</strong> {mensaje.detalles.codigo_confirmacion}</p>
                                <p><strong>Operadora:</strong> {mensaje.detalles.operadora}</p>
                                <p><strong>Teléfono:</strong> {mensaje.detalles.numero_telefono}</p>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-2">
                        {/* Cuenta origen */}
                        <div className="form-group">
                            <label className="form-label">Cuenta de Pago</label>
                            <select
                                name="id_cuenta_origen"
                                className="form-select"
                                value={formData.id_cuenta_origen}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Seleccione una cuenta</option>
                                {cuentas.map(cuenta => (
                                    <option key={cuenta.id_cuenta} value={cuenta.id_cuenta}>
                                        {cuenta.numero_cuenta} - {cuenta.tipo_cuenta} 
                                        (${parseFloat(cuenta.saldo_disponible).toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Saldo disponible */}
                        {cuentaSeleccionada && (
                            <div className="form-group">
                                <label className="form-label">Saldo Disponible</label>
                                <div className="saldo-display">
                                    ${parseFloat(cuentaSeleccionada.saldo_disponible).toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Operadora */}
                    <div className="form-group">
                        <label className="form-label">Operadora</label>
                        <div className="operadoras-grid">
                            {operadoras.map(operadora => (
                                <label 
                                    key={operadora.codigo}
                                    className={`operadora-card ${formData.operadora === operadora.codigo ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="operadora"
                                        value={operadora.codigo}
                                        checked={formData.operadora === operadora.codigo}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <div className={`operadora-icon ${operadora.codigo.toLowerCase()}`}>
                                        {operadora.codigo.substring(0, 3)}
                                    </div>
                                    <div className="operadora-name">{operadora.nombre}</div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Número de teléfono */}
                    <div className="form-group">
                        <label className="form-label">Número de Teléfono</label>
                        <input
                            type="tel"
                            name="numero_telefono"
                            className="form-control"
                            value={formData.numero_telefono}
                            onChange={handleInputChange}
                            placeholder="0999999999"
                            pattern="[0-9]{10}"
                            maxLength="10"
                            required
                        />
                        <small className="text-muted">Ingrese 10 dígitos sin espacios</small>
                    </div>

                    {/* Monto predefinido o personalizado */}
                    <div className="form-group">
                        <label className="form-label">Monto de Recarga</label>
                        {operadoraSeleccionada && (
                            <div className="montos-rapidos">
                                {operadoraSeleccionada.montos_disponibles.map(monto => (
                                    <button
                                        key={monto}
                                        type="button"
                                        className={`monto-btn ${formData.monto === monto.toString() ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, monto: monto.toString() }))}
                                    >
                                        ${monto}
                                    </button>
                                ))}
                            </div>
                        )}
                        <input
                            type="number"
                            name="monto"
                            className="form-control"
                            value={formData.monto}
                            onChange={handleInputChange}
                            placeholder="O ingrese otro monto"
                            step="0.01"
                            min="1"
                            max="100"
                            required
                        />
                    </div>

                    {/* Resumen */}
                    {formData.monto && (
                        <div className="resumen-recarga">
                            <h3>Resumen de Recarga</h3>
                            <div className="info-row">
                                <span className="info-label">Monto de recarga:</span>
                                <span className="info-value">${parseFloat(formData.monto).toFixed(2)}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Comisión:</span>
                                <span className="info-value">${comision.toFixed(2)}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Total a pagar:</span>
                                <span className="info-value amount">${montoTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Botón */}
                    <button
                        type="submit"
                        className="btn btn-success btn-block"
                        disabled={loading || !formData.id_cuenta_origen || !formData.operadora || !formData.numero_telefono || !formData.monto}
                    >
                        {loading ? '⏳ Procesando...' : '📱 Recargar Ahora'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Recarga;
