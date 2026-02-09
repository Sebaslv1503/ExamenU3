import { useState } from 'react';
import { loginCuenta } from '../services/deunaService';
import './Login.css';


function Login({ onLogin }) {
    const [numeroCuenta, setNumeroCuenta] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await loginCuenta(numeroCuenta, password);
            onLogin(response.cuenta, response.token);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card">
                <h2 className="card-title">Iniciar Sesión</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Número de Cuenta</label>
                        <input
                            type="text"
                            className="form-control"
                            value={numeroCuenta}
                            onChange={e => setNumeroCuenta(e.target.value)}
                            placeholder="Ej: 2202567891234"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            required
                        />
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                        {loading ? 'Validando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
