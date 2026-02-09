import './ReceiptModal.css';

const formatCurrency = (value) => {
    if (typeof value !== 'number') return value;
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

function ReceiptModal({ open, onClose, data, type }) {
    if (!open || !data) return null;

    const detailRows = [
        { label: 'Tipo', value: type === 'recarga' ? 'Recarga móvil' : 'Transferencia bancaria' },
        { label: 'Referencia', value: data.referencia || data.codigo_confirmacion || 'N/D' },
        { label: 'Fecha', value: data.fecha_creacion ? new Date(data.fecha_creacion).toLocaleString() : 'N/D' },
        { label: 'Monto', value: formatCurrency(parseFloat(data.monto)) },
        { label: 'Comisión', value: formatCurrency(parseFloat(data.comision || 0)) },
        { label: 'Total', value: formatCurrency(parseFloat(data.monto_total || data.monto)) }
    ];

    return (
        <div className="receipt-modal-backdrop">
            <div className="receipt-modal">
                <header className="receipt-modal-header">
                    <div>
                        <p className="receipt-status">{type === 'recarga' ? 'Recarga exitosa' : 'Transferencia exitosa'}</p>
                        <h3 className="receipt-title">Comprobante Deuna</h3>
                    </div>
                    <button className="receipt-close" onClick={onClose} aria-label="Cerrar recibo">
                        ×
                    </button>
                </header>

                <section className="receipt-grid">
                    {detailRows.map(row => (
                        <div key={row.label} className="receipt-detail">
                            <p className="receipt-label">{row.label}</p>
                            <p className="receipt-value">{row.value}</p>
                        </div>
                    ))}
                </section>

                {type === 'transferencia' && (
                    <section className="receipt-section">
                        <h4>Destino</h4>
                        <p className="receipt-value">{data.cuenta_destino_numero || 'N/A'}</p>
                        <p className="receipt-subtext">{data.titular_destino || 'Sin titular'}</p>
                    </section>
                )}

                {type === 'recarga' && (
                    <section className="receipt-section">
                        <p className="receipt-label">Operadora</p>
                        <p className="receipt-value">{data.operadora || 'N/D'}</p>
                        <p className="receipt-label">Teléfono</p>
                        <p className="receipt-value">{data.numero_telefono}</p>
                        <p className="receipt-label">Código de confirmación</p>
                        <p className="receipt-value">{data.codigo_confirmacion || 'N/D'}</p>
                    </section>
                )}

                <footer className="receipt-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cerrar comprobante
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default ReceiptModal;
