import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './Login.css';
import logoA from './Audifonoslogo.png';
import Navbar from '../Navbar/Navbar';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReset, setShowReset] = useState(false);

  const supabase = createClient(
    import.meta.env.VITE_APP_SUPABASE_URL, 
    import.meta.env.VITE_APP_SUPABASE_ANON_KEY
  );

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;
      window.location.href = '/MenuPaginas';

    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas o error de conexión');
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      setSuccess('Se ha enviado un enlace de recuperación a tu correo');
      setTimeout(() => setShowReset(false), 3000);

    } catch (err) {
      console.error(err);
      setError('Error al enviar el enlace de recuperación');
    }
  };

  const toggleResetForm = (e) => {
    e.preventDefault();
    setShowReset(!showReset);
    setError('');
    setSuccess('');
  };

  return (
    <div className="app-container">
      <header className="header">
        <Navbar />
      </header>
      
      <div className="login-container">
        <form onSubmit={showReset ? handlePasswordReset : handleLogin} className="login-form">
          <div className="logo-container">
            <img src={logoA} className="App-logo" alt="logo" />
          </div>

          <div className="login-card">
            <h4 className="login-title">
              {showReset ? 'Recuperar Contraseña' : 'Acceso a la Plataforma'}
            </h4>
            <h5 className="login-disclaimer">
              {showReset 
                ? 'Ingresa tu correo para recibir el enlace de recuperación' 
                : 'Contenido multimedia para aprender con música'}
            </h5>
            
            <div className="input-group">
              <label className="input-label">
                <span>Correo Electrónico:</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </label>

              {!showReset && (
                <label className="input-label">
                  <span>Contraseña:</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </label>
              )}
            </div>

            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}

            <div className="button-container">
              <button className="upload-button login-button" type="submit">
                {showReset ? 'Enviar enlace de recuperación' : 'Acceder'}
              </button>
            </div>

            <p className="login-disclaimer">
              {showReset ? (
                <>
                  ¿Recordaste tu contraseña?{' '}
                  <a href="#" onClick={toggleResetForm}>
                    Volver al inicio de sesión
                  </a>
                </>
              ) : (
                <>
                  ¿Olvidaste tu contraseña?{' '}
                  <a href="#" onClick={toggleResetForm}>
                    Recupérala aquí
                  </a>
                </>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;