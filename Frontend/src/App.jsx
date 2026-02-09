import { useState } from 'react';
import Transferencia from './components/Transferencia';
import Recarga from './components/Recarga';
import './App.css';

function App() {
    const [tabActiva, setTabActiva] = useState('transferencias');

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div>
                        <h1>🏦 Deuna - Banco de Pichincha</h1>
                        <p className="header-subtitle">
                            Transferencias y Recargas Instantáneas
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container">
                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab-button ${tabActiva === 'transferencias' ? 'active' : ''}`}
                        onClick={() => setTabActiva('transferencias')}
                    >
                        💸 Transferencias
                    </button>
                    <button
                        className={`tab-button ${tabActiva === 'recargas' ? 'active' : ''}`}
                        onClick={() => setTabActiva('recargas')}
                    >
                        📱 Recargas
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {tabActiva === 'transferencias' && <Transferencia />}
                    {tabActiva === 'recargas' && <Recarga />}
                </div>
            </main>

            {/* Footer */}
            <footer style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#6c757d',
                marginTop: '3rem' 
            }}>
                <p>© 2026 Banco de Pichincha - Sistema Deuna</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Transferencias y recargas seguras en tiempo real
                </p>
            </footer>
        </div>
    );
}

export default App;
