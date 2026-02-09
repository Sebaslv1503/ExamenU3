import { useState, useEffect } from 'react';
import { crearTransferencia, obtenerCuentasCliente, buscarPorAlias } from '../services/deunaService';
import './Transferencia.css';

function Transferencia() {
    const [formData, setFormData] = useState({
        id_cuenta_origen: '',
        identificador_destino: '',
        monto: '',
        descripcion: ''
    });

    const [cuentas, setCuentas] = useState([]);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
    const [destinatarioInfo, setDestinatarioInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [buscandoDestino, setBuscandoDestino] = useState(false);

    // Cargar cuentas del cliente (ejemplo: cliente ID 1)
    useEffect(() => {
        cargarCuentas();
    }, []);

    const cargarCuentas = async () => {
        try {
            // Por defecto cargamos las cuentas del cliente 1
            const response = await obtenerCuentasCliente(1);
            setCuentas(response.data);
        } catch (error) {
            console.error('Error al cargar cuentas:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Si cambia la cuenta origen, actualizar info de la cuenta
        if (name === 'id_cuenta_origen') {
            const cuenta = cuentas.find(c => c.id_cuenta === parseInt(value));
            setCuentaSeleccionada(cuenta);
        }

        // Si cambia el identificador de destino, buscar información
        if (name === 'identificador_destino' && value.length > 3) {
            buscarDestinatario(value);
        } else if (name === 'identificador_destino') {
            setDestinatarioInfo(null);
        }
    };

    const buscarDestinatario = async (identificador) => {
        try {
            setBuscandoDestino(true);
            const response = await buscarPorAlias(identificador);
            setDestinatarioInfo(response.data);
        } catch (error) {
            setDestinatarioInfo(null);
        } finally {
            setBuscandoDestino(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje(null);

        try {
            const response = await crearTransferencia({
                ...formData,
                id_cuenta_origen: parseInt(formData.id_cuenta_origen),
                monto: parseFloat(formData.monto)
            });

            setMensaje({
                tipo: 'success',
                texto: `¡Transferencia exitosa! Referencia: ${response.data.referencia}`
            });

            // Limpiar formulario
            setFormData({
                id_cuenta_origen: '',
                identificador_destino: '',
                monto: '',
                descripcion: ''
            });
            setCuentaSeleccionada(null);
            setDestinatarioInfo(null);
            
            // Recargar cuentas para actualizar saldos
            cargarCuentas();

        } catch (error) {
            setMensaje({
                tipo: 'danger',
                texto: error.response?.data?.message || 'Error al procesar la transferencia'
            });
        } finally {
            setLoading(false);
        }
    };

    const calcularComision = () => {
        const monto = parseFloat(formData.monto) || 0;
        if (monto <= 100) return 0;
        if (monto <= 500) return (monto * 0.005) + 0.50;
        return (monto * 0.01) + 1.00;
    };

    const comision = calcularComision();
    const montoTotal = (parseFloat(formData.monto) || 0) + comision;

    return (
        <div className="transferencia-container">
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">💸 Nueva Transferencia</h2>
                </div>

                {mensaje && (
                    <div className={`alert alert-${mensaje.tipo}`}>
                        {mensaje.texto}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-2">
                        {/* Cuenta origen */}
                        <div className="form-group">
                            <label className="form-label">Cuenta de Origen</label>
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

                    {/* Destinatario */}
                    <div className="form-group">
                        <label className="form-label">
                            Cuenta Destino o Alias Deuna
                        </label>
                        <input
                            type="text"
                            name="identificador_destino"
                            className="form-control"
                            value={formData.identificador_destino}
                            onChange={handleInputChange}
                            placeholder="Ej: 2202789123456, @usuario, 0998765432"
                            required
                        />
                        {buscandoDestino && (
                            <small className="text-muted">Buscando destinatario...</small>
                        )}
                        {destinatarioInfo && (
                            <div className="destinatario-info">
                                ✓ {destinatarioInfo.titular} - {destinatarioInfo.numero_cuenta}
                            </div>
                        )}
                    </div>

                    {/* Monto */}
                    <div className="form-group">
                        <label className="form-label">Monto a Transferir</label>
                        <input
                            type="number"
                            name="monto"
                            className="form-control"
                            value={formData.monto}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0.01"
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div className="form-group">
                        <label className="form-label">Descripción (opcional)</label>
                        <textarea
                            name="descripcion"
                            className="form-control"
                            value={formData.descripcion}
                            onChange={handleInputChange}
                            placeholder="Motivo de la transferencia"
                            rows="3"
                        />
                    </div>

                    {/* Resumen */}
                    {formData.monto && (
                        <div className="resumen-transferencia">
                            <h3>Resumen de Transferencia</h3>
                            <div className="info-row">
                                <span className="info-label">Monto:</span>
                                <span className="info-value">${parseFloat(formData.monto).toFixed(2)}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Comisión:</span>
                                <span className="info-value">${comision.toFixed(2)}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Total a debitar:</span>
                                <span className="info-value amount">${montoTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Botón */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading || !formData.id_cuenta_origen || !formData.identificador_destino || !formData.monto}
                    >
                        {loading ? '⏳ Procesando...' : '💸 Transferir Ahora'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Transferencia;
