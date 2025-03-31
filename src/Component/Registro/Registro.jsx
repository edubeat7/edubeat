import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

import './Registro.css';
import logoA from '../Login/Audifonoslogo.png';
import Navbar from '../Navbar/Navbar';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient(
    import.meta.env.VITE_APP_SUPABASE_URL, 
    import.meta.env.VITE_APP_SUPABASE_ANON_KEY
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      // Registro exitoso
      setSuccess('Registro exitoso. Redirigiendo al Login...');
      setTimeout(() => {
        window.location.href="/Login"; // Redirigir al Login después de 2 segundos
      }, 2000);

    } catch (err) {
      console.error(err);
      // Mostrar el mensaje de error específico
      setError(err.message || 'Error al registrar el usuario. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <header className="header">
        <Navbar />
      </header>
      
      <main className="main-content">
        <div className="signup-container">
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="logo-container">
              <img src={logoA} className="app-logo" alt="logo" />
            </div>

            <div className="signup-card">
              <h2 className="signup-title">Registro en la Plataforma</h2>
              <p className="signup-disclaimer">Contenido multimedia para aprender con música</p>
              
              <div className="form-fields">
                <div className="input-group">
                  <label className="input-label" htmlFor="email">
                    Correo Electrónico:
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="signup-input"
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="password">
                    Contraseña:
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="signup-input"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>
              </div>

              {error && <div className="signup-error">{error}</div>}
              {success && <div className="signup-success">{success}</div>}

              <div className="button-container">
                <button 
                  className={`signup-button ${loading ? 'loading' : ''}`} 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : 'Registrarse'}
                </button>
              </div>

              <p className="login-link">
                ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default SignUp;