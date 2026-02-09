// Login
export const loginCuenta = async (numeroCuenta, password) => {
    const response = await api.post('/auth/login', { numero_cuenta: numeroCuenta, password });
    return response.data;
};
import api from './api';

// Transferencias
export const crearTransferencia = async (data) => {
    const response = await api.post('/transferencias', data);
    return response.data;
};

export const obtenerTransferenciasCuenta = async (idCuenta, params = {}) => {
    const response = await api.get(`/transferencias/cuenta/${idCuenta}`, { params });
    return response.data;
};

export const obtenerDetalleTransferencia = async (idTransaccion) => {
    const response = await api.get(`/transferencias/${idTransaccion}`);
    return response.data;
};

export const reversarTransferencia = async (idTransaccion) => {
    const response = await api.post(`/transferencias/${idTransaccion}/reversar`);
    return response.data;
};

// Recargas
export const crearRecarga = async (data) => {
    const response = await api.post('/recargas', data);
    return response.data;
};

export const obtenerRecargasCuenta = async (idCuenta, params = {}) => {
    const response = await api.get(`/recargas/cuenta/${idCuenta}`, { params });
    return response.data;
};

export const obtenerOperadoras = async () => {
    const response = await api.get('/recargas/operadoras');
    return response.data;
};

export const obtenerEstadisticasRecargas = async (idCuenta, params = {}) => {
    const response = await api.get(`/recargas/estadisticas/${idCuenta}`, { params });
    return response.data;
};

// Clientes
export const obtenerClientes = async (params = {}) => {
    const response = await api.get('/clientes', { params });
    return response.data;
};

export const obtenerClientePorId = async (idCliente) => {
    const response = await api.get(`/clientes/${idCliente}`);
    return response.data;
};

// Cuentas
export const obtenerCuentasCliente = async (idCliente) => {
    const response = await api.get(`/cuentas/cliente/${idCliente}`);
    return response.data;
};

export const obtenerDetalleCuenta = async (idCuenta) => {
    const response = await api.get(`/cuentas/${idCuenta}`);
    return response.data;
};

export const obtenerSaldo = async (idCuenta) => {
    const response = await api.get(`/cuentas/${idCuenta}/saldo`);
    return response.data;
};

// Transacciones
export const obtenerTransacciones = async (params = {}) => {
    const response = await api.get('/transacciones', { params });
    return response.data;
};

// Alias
export const obtenerAliasCliente = async (idCliente) => {
    const response = await api.get(`/alias/cliente/${idCliente}`);
    return response.data;
};

export const buscarPorAlias = async (valorAlias) => {
    const response = await api.get(`/alias/buscar/${valorAlias}`);
    return response.data;
};
