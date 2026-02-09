-- =====================================================
-- SISTEMA DEUNA - BANCO DE PICHINCHA
-- Base de Datos para Transferencias y Recargas
-- =====================================================

-- Eliminar base de datos si existe y crear nueva
DROP DATABASE IF EXISTS deuna_banco;
CREATE DATABASE deuna_banco;

\c deuna_banco;

-- =====================================================
-- TIPOS DE DATOS PERSONALIZADOS
-- =====================================================

-- Tipo de cuenta
CREATE TYPE tipo_cuenta_enum AS ENUM ('AHORROS', 'CORRIENTE', 'MAESTRA');

-- Tipo de documento
CREATE TYPE tipo_documento_enum AS ENUM ('CEDULA', 'PASAPORTE', 'RUC');

-- Estado de cuenta
CREATE TYPE estado_cuenta_enum AS ENUM ('ACTIVA', 'BLOQUEADA', 'INACTIVA');

-- Tipo de tarjeta
CREATE TYPE tipo_tarjeta_enum AS ENUM ('DEBITO', 'CREDITO', 'PREPAGO');

-- Estado de tarjeta
CREATE TYPE estado_tarjeta_enum AS ENUM ('ACTIVA', 'BLOQUEADA', 'VENCIDA', 'CANCELADA');

-- Tipo de transacción
CREATE TYPE tipo_transaccion_enum AS ENUM ('TRANSFERENCIA', 'RECARGA', 'PAGO_QR', 'COBRO');

-- Estado de transacción
CREATE TYPE estado_transaccion_enum AS ENUM ('PENDIENTE', 'CONFIRMADA', 'FALLIDA', 'REVERSADA', 'EXPIRADA');

-- Tipo de alias
CREATE TYPE tipo_alias_enum AS ENUM ('TELEFONO', 'CORREO', 'ALIAS', 'QR', 'TOKEN');

-- =====================================================
-- TABLA: CLIENTES
-- =====================================================
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    tipo_documento tipo_documento_enum NOT NULL,
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    direccion TEXT,
    fecha_nacimiento DATE NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT check_mayoredad CHECK (fecha_nacimiento <= CURRENT_DATE - INTERVAL '18 years')
);

-- =====================================================
-- TABLA: CUENTAS
-- =====================================================
CREATE TABLE cuentas (
    id_cuenta SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    numero_cuenta VARCHAR(20) UNIQUE NOT NULL,
    tipo_cuenta tipo_cuenta_enum NOT NULL,
    saldo_disponible DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    saldo_bloqueado DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    limite_diario DECIMAL(15, 2) NOT NULL DEFAULT 5000.00,
    limite_por_transaccion DECIMAL(15, 2) NOT NULL DEFAULT 1000.00,
    estado estado_cuenta_enum NOT NULL DEFAULT 'ACTIVA',
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_saldo_positivo CHECK (saldo_disponible >= 0),
    CONSTRAINT check_saldo_bloqueado CHECK (saldo_bloqueado >= 0),
    CONSTRAINT check_limites CHECK (limite_por_transaccion <= limite_diario)
);

-- =====================================================
-- TABLA: TARJETAS
-- =====================================================
CREATE TABLE tarjetas (
    id_tarjeta SERIAL PRIMARY KEY,
    id_cuenta INTEGER NOT NULL REFERENCES cuentas(id_cuenta) ON DELETE CASCADE,
    numero_tarjeta VARCHAR(19) UNIQUE NOT NULL,
    tipo_tarjeta tipo_tarjeta_enum NOT NULL,
    nombre_titular VARCHAR(100) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    limite_credito DECIMAL(15, 2) DEFAULT 0.00,
    saldo_utilizado DECIMAL(15, 2) DEFAULT 0.00,
    estado estado_tarjeta_enum NOT NULL DEFAULT 'ACTIVA',
    CONSTRAINT check_fecha_vencimiento CHECK (fecha_vencimiento > fecha_emision),
    CONSTRAINT check_limite_credito CHECK (saldo_utilizado <= limite_credito)
);

-- =====================================================
-- TABLA: ALIAS DE PAGO
-- =====================================================
CREATE TABLE alias_pago (
    id_alias SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    id_cuenta INTEGER NOT NULL REFERENCES cuentas(id_cuenta) ON DELETE CASCADE,
    tipo_alias tipo_alias_enum NOT NULL,
    valor_alias VARCHAR(100) UNIQUE NOT NULL,
    descripcion VARCHAR(200),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP,
    UNIQUE(id_cliente, tipo_alias, valor_alias)
);

-- =====================================================
-- TABLA: TRANSACCIONES
-- =====================================================
CREATE TABLE transacciones (
    id_transaccion SERIAL PRIMARY KEY,
    tipo_transaccion tipo_transaccion_enum NOT NULL,
    id_cuenta_origen INTEGER NOT NULL REFERENCES cuentas(id_cuenta),
    id_cuenta_destino INTEGER REFERENCES cuentas(id_cuenta),
    monto DECIMAL(15, 2) NOT NULL,
    comision DECIMAL(10, 2) DEFAULT 0.00,
    monto_total DECIMAL(15, 2) NOT NULL,
        referencia VARCHAR(255),
        descripcion TEXT,
        estado estado_transaccion_enum NOT NULL DEFAULT 'PENDIENTE',
        codigo_qr TEXT,
        token_autorizacion VARCHAR(255),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_procesamiento TIMESTAMP,
        fecha_expiracion TIMESTAMP,
        ip_origen VARCHAR(50),
        dispositivo VARCHAR(255),
        intentos_autorizacion INTEGER DEFAULT 0,
    CONSTRAINT check_monto_positivo CHECK (monto > 0),
    CONSTRAINT check_monto_total CHECK (monto_total = monto + comision)
);

-- =====================================================
-- TABLA: COMISIONES
-- =====================================================
CREATE TABLE comisiones (
    id_comision SERIAL PRIMARY KEY,
    tipo_transaccion tipo_transaccion_enum NOT NULL,
    monto_minimo DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    monto_maximo DECIMAL(15, 2),
    porcentaje DECIMAL(5, 4) DEFAULT 0.00,
    monto_fijo DECIMAL(10, 2) DEFAULT 0.00,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    CONSTRAINT check_comision_logica CHECK (porcentaje >= 0 OR monto_fijo >= 0)
);

-- =====================================================
-- TABLA: AUDITORIA
-- =====================================================
CREATE TABLE auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    id_transaccion INTEGER REFERENCES transacciones(id_transaccion),
    id_cliente INTEGER REFERENCES clientes(id_cliente),
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_usuario VARCHAR(50),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado VARCHAR(20),
    mensaje_error TEXT
);

-- =====================================================
-- TABLA: RECARGAS
-- =====================================================
CREATE TABLE recargas (
    id_recarga SERIAL PRIMARY KEY,
    id_transaccion INTEGER NOT NULL REFERENCES transacciones(id_transaccion),
    numero_telefono VARCHAR(15) NOT NULL,
    operadora VARCHAR(50) NOT NULL,
    tipo_recarga VARCHAR(50) DEFAULT 'PREPAGO',
    codigo_recarga VARCHAR(100),
    codigo_confirmacion VARCHAR(100),
    CONSTRAINT check_operadora CHECK (operadora IN ('CLARO', 'MOVISTAR', 'CNT', 'TUENTI'))
);

-- =====================================================
-- INSERCIÓN DE DATOS DE PRUEBA
-- =====================================================

-- Clientes (10 registros)
INSERT INTO clientes (tipo_documento, numero_documento, nombres, apellidos, email, telefono, direccion, fecha_nacimiento) VALUES
('CEDULA', '1725847963', 'Juan Carlos', 'Pérez González', 'juan.perez@email.com', '0998765432', 'Av. 10 de Agosto N45-123, Quito', '1990-05-15'),
('CEDULA', '1710234567', 'María Elena', 'Rodríguez Silva', 'maria.rodriguez@email.com', '0987654321', 'Calle García Moreno 456, Quito', '1985-08-22'),
('CEDULA', '1723456789', 'Carlos Alberto', 'Gómez Herrera', 'carlos.gomez@email.com', '0976543210', 'Av. Amazonas 789, Quito', '1992-03-10'),
('PASAPORTE', 'PE123456', 'Ana Lucía', 'Martínez López', 'ana.martinez@email.com', '0965432109', 'Calle Bolívar 234, Guayaquil', '1988-11-30'),
('CEDULA', '0912345678', 'Luis Fernando', 'Sánchez Torres', 'luis.sanchez@email.com', '0954321098', 'Av. 9 de Octubre 567, Guayaquil', '1995-07-18'),
('RUC', '1790123456001', 'Patricia Isabel', 'Ramírez Castro', 'patricia.ramirez@email.com', '0943210987', 'Calle Cuenca 890, Cuenca', '1987-02-25'),
('CEDULA', '0102345678', 'Roberto Carlos', 'Morales Díaz', 'roberto.morales@email.com', '0932109876', 'Av. Loja 123, Cuenca', '1991-09-14'),
('CEDULA', '1715678901', 'Carmen Rosa', 'Flores Vega', 'carmen.flores@email.com', '0921098765', 'Calle Ambato 456, Ambato', '1993-12-05'),
('CEDULA', '1712345098', 'Diego Armando', 'Castro Jiménez', 'diego.castro@email.com', '0910987654', 'Av. Riobamba 789, Riobamba', '1989-06-20'),
('PASAPORTE', 'CO789012', 'Sofía Alejandra', 'Ortiz Mendoza', 'sofia.ortiz@email.com', '0909876543', 'Calle Esmeraldas 321, Esmeraldas', '1994-04-08');

-- Cuentas (10 registros)
INSERT INTO cuentas (id_cliente, numero_cuenta, tipo_cuenta, saldo_disponible, limite_diario, limite_por_transaccion, estado) VALUES
(1, '2202567891234', 'AHORROS', 5000.00, 5000.00, 1000.00, 'ACTIVA'),
(2, '2202678912345', 'CORRIENTE', 12000.00, 10000.00, 2000.00, 'ACTIVA'),
(3, '2202789123456', 'AHORROS', 3500.00, 5000.00, 1000.00, 'ACTIVA'),
(4, '2202891234567', 'MAESTRA', 25000.00, 15000.00, 5000.00, 'ACTIVA'),
(5, '2202912345678', 'CORRIENTE', 8000.00, 8000.00, 1500.00, 'ACTIVA'),
(6, '2202123456789', 'AHORROS', 15000.00, 10000.00, 3000.00, 'ACTIVA'),
(7, '2202234567890', 'CORRIENTE', 6500.00, 7000.00, 1200.00, 'ACTIVA'),
(8, '2202345678901', 'AHORROS', 4200.00, 5000.00, 1000.00, 'ACTIVA'),
(9, '2202456789012', 'MAESTRA', 18000.00, 12000.00, 4000.00, 'ACTIVA'),
(10, '2202567890123', 'AHORROS', 2800.00, 5000.00, 1000.00, 'ACTIVA');

-- Tarjetas (10 registros)
INSERT INTO tarjetas (id_cuenta, numero_tarjeta, tipo_tarjeta, nombre_titular, fecha_emision, fecha_vencimiento, cvv, limite_credito, saldo_utilizado, estado) VALUES
(1, '4532015112345678', 'DEBITO', 'JUAN CARLOS PEREZ', '2023-01-15', '2028-01-31', '123', 0.00, 0.00, 'ACTIVA'),
(2, '5425233430109903', 'CREDITO', 'MARIA ELENA RODRIGUEZ', '2022-06-10', '2027-06-30', '456', 5000.00, 1200.00, 'ACTIVA'),
(3, '4916338506082832', 'DEBITO', 'CARLOS ALBERTO GOMEZ', '2023-03-20', '2028-03-31', '789', 0.00, 0.00, 'ACTIVA'),
(4, '5425233430101234', 'CREDITO', 'ANA LUCIA MARTINEZ', '2021-11-05', '2026-11-30', '234', 10000.00, 3500.00, 'ACTIVA'),
(5, '4532015198765432', 'DEBITO', 'LUIS FERNANDO SANCHEZ', '2023-05-12', '2028-05-31', '567', 0.00, 0.00, 'ACTIVA'),
(6, '5425233430105678', 'CREDITO', 'PATRICIA ISABEL RAMIREZ', '2022-09-18', '2027-09-30', '890', 8000.00, 2100.00, 'ACTIVA'),
(7, '4916338506087654', 'DEBITO', 'ROBERTO CARLOS MORALES', '2023-02-25', '2028-02-29', '345', 0.00, 0.00, 'ACTIVA'),
(8, '4532015123456789', 'PREPAGO', 'CARMEN ROSA FLORES', '2023-07-10', '2026-07-31', '678', 2000.00, 450.00, 'ACTIVA'),
(9, '5425233430109876', 'CREDITO', 'DIEGO ARMANDO CASTRO', '2022-04-15', '2027-04-30', '901', 12000.00, 5600.00, 'ACTIVA'),
(10, '4916338506081111', 'DEBITO', 'SOFIA ALEJANDRA ORTIZ', '2023-08-20', '2028-08-31', '234', 0.00, 0.00, 'ACTIVA');

-- Alias de pago (10 registros)
INSERT INTO alias_pago (id_cliente, id_cuenta, tipo_alias, valor_alias, descripcion, activo) VALUES
(1, 1, 'TELEFONO', '0998765432', 'Teléfono celular principal', TRUE),
(2, 2, 'CORREO', 'maria.rodriguez@email.com', 'Email para pagos', TRUE),
(3, 3, 'ALIAS', '@carlosg', 'Alias personalizado Deuna', TRUE),
(4, 4, 'TOKEN', 'TKN-4ANA-MART-9876', 'Token de pago rápido', TRUE),
(5, 5, 'TELEFONO', '0954321098', 'Celular para recargas', TRUE),
(6, 6, 'ALIAS', '@patriramirez', 'Alias Deuna Patricia', TRUE),
(7, 7, 'CORREO', 'roberto.morales@email.com', 'Correo de pagos', TRUE),
(8, 8, 'TELEFONO', '0921098765', 'Teléfono verificado', TRUE),
(9, 9, 'TOKEN', 'TKN-9DIEG-CAST-5432', 'Token seguro Deuna', TRUE),
(10, 10, 'ALIAS', '@sofiortiz', 'Alias oficial Deuna', TRUE);

-- Comisiones (10 registros)
INSERT INTO comisiones (tipo_transaccion, monto_minimo, monto_maximo, porcentaje, monto_fijo, descripcion, activo, fecha_inicio, fecha_fin) VALUES
('TRANSFERENCIA', 0.01, 100.00, 0.0000, 0.00, 'Transferencias hasta $100 sin comisión', TRUE, '2024-01-01', NULL),
('TRANSFERENCIA', 100.01, 500.00, 0.0050, 0.50, 'Transferencias $100-$500: 0.5% + $0.50', TRUE, '2024-01-01', NULL),
('TRANSFERENCIA', 500.01, NULL, 0.0100, 1.00, 'Transferencias mayores a $500: 1% + $1.00', TRUE, '2024-01-01', NULL),
('RECARGA', 0.01, 20.00, 0.0000, 0.30, 'Recargas hasta $20: comisión fija $0.30', TRUE, '2024-01-01', NULL),
('RECARGA', 20.01, 50.00, 0.0000, 0.50, 'Recargas $20-$50: comisión fija $0.50', TRUE, '2024-01-01', NULL),
('RECARGA', 50.01, NULL, 0.0200, 0.00, 'Recargas mayores a $50: 2%', TRUE, '2024-01-01', NULL),
('PAGO_QR', 0.01, 200.00, 0.0000, 0.00, 'Pagos QR hasta $200 sin comisión', TRUE, '2024-01-01', NULL),
('PAGO_QR', 200.01, NULL, 0.0075, 0.75, 'Pagos QR mayores a $200: 0.75% + $0.75', TRUE, '2024-01-01', NULL),
('COBRO', 0.01, 100.00, 0.0100, 0.00, 'Cobros Deuna: 1%', TRUE, '2024-01-01', NULL),
('COBRO', 100.01, NULL, 0.0150, 0.50, 'Cobros mayores a $100: 1.5% + $0.50', TRUE, '2024-01-01', NULL);

-- Transacciones (10 registros)
INSERT INTO transacciones (tipo_transaccion, id_cuenta_origen, id_cuenta_destino, monto, comision, monto_total, referencia, descripcion, estado, fecha_procesamiento, ip_origen, dispositivo) VALUES
('TRANSFERENCIA', 1, 3, 100.00, 0.00, 100.00, 'TRF-2026-001', 'Pago de préstamo', 'CONFIRMADA', '2026-02-08 10:30:00', '192.168.1.10', 'Android App'),
('TRANSFERENCIA', 2, 5, 250.00, 1.75, 251.75, 'TRF-2026-002', 'Transferencia familiar', 'CONFIRMADA', '2026-02-08 11:15:00', '192.168.1.20', 'iOS App'),
('RECARGA', 3, NULL, 10.00, 0.30, 10.30, 'RCG-2026-001', 'Recarga Claro', 'CONFIRMADA', '2026-02-08 12:00:00', '192.168.1.30', 'Web Browser'),
('TRANSFERENCIA', 4, 7, 500.00, 6.00, 506.00, 'TRF-2026-003', 'Pago de servicios', 'CONFIRMADA', '2026-02-08 13:45:00', '192.168.1.40', 'Android App'),
('RECARGA', 5, NULL, 25.00, 0.50, 25.50, 'RCG-2026-002', 'Recarga Movistar', 'CONFIRMADA', '2026-02-08 14:20:00', '192.168.1.50', 'iOS App'),
('TRANSFERENCIA', 6, 9, 300.00, 2.00, 302.00, 'TRF-2026-004', 'Pago de arriendo', 'CONFIRMADA', '2026-02-08 15:00:00', '192.168.1.60', 'Web Browser'),
('RECARGA', 7, NULL, 15.00, 0.30, 15.30, 'RCG-2026-003', 'Recarga CNT', 'CONFIRMADA', '2026-02-08 16:10:00', '192.168.1.70', 'Android App'),
('TRANSFERENCIA', 8, 10, 80.00, 0.00, 80.00, 'TRF-2026-005', 'Regalo cumpleaños', 'CONFIRMADA', '2026-02-09 09:30:00', '192.168.1.80', 'iOS App'),
('RECARGA', 9, NULL, 50.00, 0.50, 50.50, 'RCG-2026-004', 'Recarga Tuenti', 'CONFIRMADA', '2026-02-09 10:15:00', '192.168.1.90', 'Web Browser'),
('TRANSFERENCIA', 10, 2, 150.00, 0.00, 150.00, 'TRF-2026-006', 'Pago entre amigos', 'PENDIENTE', NULL, '192.168.1.100', 'Android App');

-- Recargas (4 registros relacionados con transacciones de recarga)
INSERT INTO recargas (id_transaccion, numero_telefono, operadora, tipo_recarga, codigo_recarga, codigo_confirmacion) VALUES
(3, '0998877665', 'CLARO', 'PREPAGO', 'CLR-RCG-20260208-001', 'CONF-2026-CLR-001'),
(5, '0987766554', 'MOVISTAR', 'PREPAGO', 'MOV-RCG-20260208-002', 'CONF-2026-MOV-002'),
(7, '0976655443', 'CNT', 'PREPAGO', 'CNT-RCG-20260208-003', 'CONF-2026-CNT-003'),
(9, '0965544332', 'TUENTI', 'PREPAGO', 'TNT-RCG-20260209-004', 'CONF-2026-TNT-004'),
-- Agregamos 6 recargas adicionales para completar 10
(3, '0998123456', 'CLARO', 'PREPAGO', 'CLR-RCG-20260209-005', 'CONF-2026-CLR-005'),
(5, '0987234567', 'MOVISTAR', 'PREPAGO', 'MOV-RCG-20260209-006', 'CONF-2026-MOV-006'),
(7, '0976345678', 'CNT', 'PREPAGO', 'CNT-RCG-20260209-007', 'CONF-2026-CNT-007'),
(9, '0965456789', 'TUENTI', 'PREPAGO', 'TNT-RCG-20260209-008', 'CONF-2026-TNT-008'),
(3, '0998987654', 'CLARO', 'PREPAGO', 'CLR-RCG-20260209-009', 'CONF-2026-CLR-009'),
(5, '0987876543', 'MOVISTAR', 'PREPAGO', 'MOV-RCG-20260209-010', 'CONF-2026-MOV-010');

-- Auditoría (10 registros)
INSERT INTO auditoria (id_transaccion, id_cliente, accion, tabla_afectada, datos_nuevos, ip_usuario, resultado, mensaje_error) VALUES
(1, 1, 'CREAR_TRANSFERENCIA', 'transacciones', '{"monto": 100.00, "destino": 3}'::jsonb, '192.168.1.10', 'EXITOSO', NULL),
(2, 2, 'CREAR_TRANSFERENCIA', 'transacciones', '{"monto": 250.00, "destino": 5}'::jsonb, '192.168.1.20', 'EXITOSO', NULL),
(3, 3, 'CREAR_RECARGA', 'transacciones', '{"monto": 10.00, "operadora": "CLARO"}'::jsonb, '192.168.1.30', 'EXITOSO', NULL),
(4, 4, 'CREAR_TRANSFERENCIA', 'transacciones', '{"monto": 500.00, "destino": 7}'::jsonb, '192.168.1.40', 'EXITOSO', NULL),
(5, 5, 'CREAR_RECARGA', 'transacciones', '{"monto": 25.00, "operadora": "MOVISTAR"}'::jsonb, '192.168.1.50', 'EXITOSO', NULL),
(6, 6, 'CREAR_TRANSFERENCIA', 'transacciones', '{"monto": 300.00, "destino": 9}'::jsonb, '192.168.1.60', 'EXITOSO', NULL),
(7, 7, 'CREAR_RECARGA', 'transacciones', '{"monto": 15.00, "operadora": "CNT"}'::jsonb, '192.168.1.70', 'EXITOSO', NULL),
(8, 8, 'CREAR_TRANSFERENCIA', 'transacciones', '{"monto": 80.00, "destino": 10}'::jsonb, '192.168.1.80', 'EXITOSO', NULL),
(9, 9, 'CREAR_RECARGA', 'transacciones', '{"monto": 50.00, "operadora": "TUENTI"}'::jsonb, '192.168.1.90', 'EXITOSO', NULL),
(10, 10, 'CREAR_TRANSFERENCIA', 'transacciones', '{"monto": 150.00, "destino": 2}'::jsonb, '192.168.1.100', 'PENDIENTE', NULL);

-- =====================================================
-- FUNCIONES Y TRIGGERS PARA AUTOMATIZACIÓN
-- =====================================================

-- Función para calcular comisión de una transacción
CREATE OR REPLACE FUNCTION calcular_comision(
    p_tipo_transaccion tipo_transaccion_enum,
    p_monto DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_comision DECIMAL(10, 2);
    v_porcentaje DECIMAL(5, 4);
    v_monto_fijo DECIMAL(10, 2);
BEGIN
    SELECT porcentaje, monto_fijo INTO v_porcentaje, v_monto_fijo
    FROM comisiones
    WHERE tipo_transaccion = p_tipo_transaccion
      AND p_monto >= monto_minimo
      AND (monto_maximo IS NULL OR p_monto <= monto_maximo)
      AND activo = TRUE
    ORDER BY monto_minimo DESC
    LIMIT 1;
    
    IF FOUND THEN
        v_comision := (p_monto * v_porcentaje) + v_monto_fijo;
    ELSE
        v_comision := 0.00;
    END IF;
    
    RETURN ROUND(v_comision, 2);
END;
$$ LANGUAGE plpgsql;

-- Función para validar saldo suficiente
CREATE OR REPLACE FUNCTION validar_saldo(
    p_id_cuenta INTEGER,
    p_monto_total DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
    v_saldo_disponible DECIMAL;
BEGIN
    SELECT saldo_disponible INTO v_saldo_disponible
    FROM cuentas
    WHERE id_cuenta = p_id_cuenta AND estado = 'ACTIVA';
    
    RETURN v_saldo_disponible >= p_monto_total;
END;
$$ LANGUAGE plpgsql;

-- Función para validar límites de transacción
CREATE OR REPLACE FUNCTION validar_limites(
    p_id_cuenta INTEGER,
    p_monto DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
    v_limite_transaccion DECIMAL;
    v_limite_diario DECIMAL;
    v_total_dia DECIMAL;
BEGIN
    -- Obtener límites de la cuenta
    SELECT limite_por_transaccion, limite_diario
    INTO v_limite_transaccion, v_limite_diario
    FROM cuentas
    WHERE id_cuenta = p_id_cuenta;
    
    -- Validar límite por transacción
    IF p_monto > v_limite_transaccion THEN
        RETURN FALSE;
    END IF;
    
    -- Calcular total de transacciones del día
    SELECT COALESCE(SUM(monto_total), 0) INTO v_total_dia
    FROM transacciones
    WHERE id_cuenta_origen = p_id_cuenta
      AND DATE(fecha_creacion) = CURRENT_DATE
      AND estado IN ('CONFIRMADA', 'PENDIENTE');
    
    -- Validar límite diario
    IF (v_total_dia + p_monto) > v_limite_diario THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar saldos después de una transacción confirmada
CREATE OR REPLACE FUNCTION actualizar_saldos_transaccion()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el estado cambia a CONFIRMADA
    IF NEW.estado = 'CONFIRMADA' AND (OLD.estado IS NULL OR OLD.estado != 'CONFIRMADA') THEN
        -- Descontar de cuenta origen
        UPDATE cuentas
        SET saldo_disponible = saldo_disponible - NEW.monto_total
        WHERE id_cuenta = NEW.id_cuenta_origen;
        
        -- Acreditar a cuenta destino (si existe)
        IF NEW.id_cuenta_destino IS NOT NULL THEN
            UPDATE cuentas
            SET saldo_disponible = saldo_disponible + NEW.monto
            WHERE id_cuenta = NEW.id_cuenta_destino;
        END IF;
        
        -- Actualizar fecha de procesamiento
        NEW.fecha_procesamiento := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_saldos
BEFORE UPDATE ON transacciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_saldos_transaccion();

-- Trigger para registrar auditoría automáticamente
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
DECLARE
    v_accion VARCHAR(100);
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_accion := 'CREAR_' || NEW.tipo_transaccion::TEXT;
        INSERT INTO auditoria (id_transaccion, accion, tabla_afectada, datos_nuevos, fecha_accion, resultado)
        VALUES (NEW.id_transaccion, v_accion, 'transacciones', row_to_json(NEW)::jsonb, CURRENT_TIMESTAMP, 'EXITOSO');
    ELSIF TG_OP = 'UPDATE' THEN
        v_accion := 'ACTUALIZAR_' || NEW.tipo_transaccion::TEXT;
        INSERT INTO auditoria (id_transaccion, accion, tabla_afectada, datos_anteriores, datos_nuevos, fecha_accion, resultado)
        VALUES (NEW.id_transaccion, v_accion, 'transacciones', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, CURRENT_TIMESTAMP, 'EXITOSO');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auditoria_transacciones
AFTER INSERT OR UPDATE ON transacciones
FOR EACH ROW
EXECUTE FUNCTION registrar_auditoria();

-- Función para expirar transacciones pendientes
CREATE OR REPLACE FUNCTION expirar_transacciones_pendientes()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE transacciones
    SET estado = 'EXPIRADA'
    WHERE estado = 'PENDIENTE'
      AND fecha_expiracion IS NOT NULL
      AND fecha_expiracion < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Función para reversar una transacción
CREATE OR REPLACE FUNCTION reversar_transaccion(p_id_transaccion INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_transaccion RECORD;
BEGIN
    -- Obtener datos de la transacción
    SELECT * INTO v_transaccion
    FROM transacciones
    WHERE id_transaccion = p_id_transaccion
      AND estado = 'CONFIRMADA';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Devolver saldo a cuenta origen
    UPDATE cuentas
    SET saldo_disponible = saldo_disponible + v_transaccion.monto_total
    WHERE id_cuenta = v_transaccion.id_cuenta_origen;
    
    -- Descontar de cuenta destino (si existe)
    IF v_transaccion.id_cuenta_destino IS NOT NULL THEN
        UPDATE cuentas
        SET saldo_disponible = saldo_disponible - v_transaccion.monto
        WHERE id_cuenta = v_transaccion.id_cuenta_destino;
    END IF;
    
    -- Marcar transacción como reversada
    UPDATE transacciones
    SET estado = 'REVERSADA'
    WHERE id_transaccion = p_id_transaccion;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de transacciones con información completa
CREATE VIEW vista_transacciones_completa AS
SELECT 
    t.id_transaccion,
    t.tipo_transaccion,
    t.monto,
    t.comision,
    t.monto_total,
    t.estado,
    t.fecha_creacion,
    t.referencia,
    t.descripcion,
    -- Datos cuenta origen
    co.numero_cuenta AS cuenta_origen,
    co.tipo_cuenta AS tipo_cuenta_origen,
    clo.nombres || ' ' || clo.apellidos AS titular_origen,
    -- Datos cuenta destino
    cd.numero_cuenta AS cuenta_destino,
    cd.tipo_cuenta AS tipo_cuenta_destino,
    cld.nombres || ' ' || cld.apellidos AS titular_destino
FROM transacciones t
INNER JOIN cuentas co ON t.id_cuenta_origen = co.id_cuenta
INNER JOIN clientes clo ON co.id_cliente = clo.id_cliente
LEFT JOIN cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
LEFT JOIN clientes cld ON cd.id_cliente = cld.id_cliente;

-- Vista de saldo y movimientos por cliente
CREATE VIEW vista_resumen_clientes AS
SELECT 
    c.id_cliente,
    c.nombres || ' ' || c.apellidos AS nombre_completo,
    c.numero_documento,
    COUNT(DISTINCT cu.id_cuenta) AS total_cuentas,
    SUM(cu.saldo_disponible) AS saldo_total,
    COUNT(t.id_transaccion) AS total_transacciones
FROM clientes c
LEFT JOIN cuentas cu ON c.id_cliente = cu.id_cliente
LEFT JOIN transacciones t ON cu.id_cuenta = t.id_cuenta_origen
GROUP BY c.id_cliente, c.nombres, c.apellidos, c.numero_documento;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX idx_transacciones_cuenta_origen ON transacciones(id_cuenta_origen);
CREATE INDEX idx_transacciones_cuenta_destino ON transacciones(id_cuenta_destino);
CREATE INDEX idx_transacciones_estado ON transacciones(estado);
CREATE INDEX idx_transacciones_fecha_creacion ON transacciones(fecha_creacion);
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo_transaccion);
CREATE INDEX idx_cuentas_cliente ON cuentas(id_cliente);
CREATE INDEX idx_cuentas_numero ON cuentas(numero_cuenta);
CREATE INDEX idx_alias_cliente ON alias_pago(id_cliente);
CREATE INDEX idx_alias_valor ON alias_pago(valor_alias);
CREATE INDEX idx_auditoria_transaccion ON auditoria(id_transaccion);
CREATE INDEX idx_auditoria_cliente ON auditoria(id_cliente);

-- =====================================================
-- GRANTS Y PERMISOS (opcional)
-- =====================================================

-- Crear usuario para la aplicación
-- CREATE USER deuna_app WITH PASSWORD 'deuna_secure_2026';
-- GRANT CONNECT ON DATABASE deuna_banco TO deuna_app;
-- GRANT USAGE ON SCHEMA public TO deuna_app;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO deuna_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO deuna_app;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificar datos insertados
SELECT 'Clientes: ' || COUNT(*) FROM clientes;
SELECT 'Cuentas: ' || COUNT(*) FROM cuentas;
SELECT 'Tarjetas: ' || COUNT(*) FROM tarjetas;
SELECT 'Alias de pago: ' || COUNT(*) FROM alias_pago;
SELECT 'Comisiones: ' || COUNT(*) FROM comisiones;
SELECT 'Transacciones: ' || COUNT(*) FROM transacciones;
SELECT 'Recargas: ' || COUNT(*) FROM recargas;
SELECT 'Auditoría: ' || COUNT(*) FROM auditoria;
