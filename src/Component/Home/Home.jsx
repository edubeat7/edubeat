import { Link } from 'react-router-dom';
import './Home.css'; // Reutilizamos los mismos estilos
import logoA from '../Login/Audifonoslogo.png';

function Landing() {
  return (
    <div className="container login-container">
      <div className="login-form">
        <div className="logo-container">
          <img src={logoA} className="App-logo" alt="logo" />
        </div>

        <div className="login-card">
          <h1 className="login-title">Bienvenido a EduBeats</h1>
          
          <div className="landing-content">
            <p className="login-disclaimer" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              Descubre un nuevo mundo de aprendizaje a través de la música y el contenido multimedia interactivo.
            </p>

            <div className="features-grid">
              <div className="feature-item">
                <h3>🎵 Aprende con Música</h3>
                <p>Contenido educativo integrado en experiencias musicales únicas</p>
              </div>
              
              <div className="feature-item">
                <h3>📝 Pruebas Autocorregidas</h3>
                <p>Banco de ejercicios interactivos con corrección automática y retroalimentación inmediata</p>
              </div>
              
              <div className="feature-item">
                <h3>🛒 Proveedores de Materiales</h3>
                <p>Acceso a una red de proveedores verificados para la compra de materiales</p>
              </div>
            </div>

            <a href="/Login" className="upload-button login-button" style={{ maxWidth: '200px', margin: '2rem auto' }} >Comenzar Ahora</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;