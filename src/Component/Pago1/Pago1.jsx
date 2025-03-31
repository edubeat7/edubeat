import { useState, useEffect } from 'react';
import './Pago1.css'; // Estilos base
import Navbar from '../Navbar/Navbar';

// Definimos los códigos de acceso para cada tipo
const CODIGOS_POR_TIPO = {
  1: "qwerty1234567",
  2: "7qwerty123456", 
  3: "67qwerty12345"
};

const ManualPayment = () => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAttempts, setCheckingAttempts] = useState(0);

  // Función para generar un tipo aleatorio (1, 2, o 3)
  const generarTipoAleatorio = () => {
    return Math.floor(Math.random() * 3) + 1;
  };

  // Establecer un tipo aleatorio cuando el componente se monta
  useEffect(() => {
    // Generamos un tipo aleatorio y lo asignamos 
    const nuevoTipo = generarTipoAleatorio();
    console.log("Generado tipo:", nuevoTipo); // Para depuración
    setTipoSeleccionado(nuevoTipo);
    
    // Limpiamos cualquier localStorage previo para evitar interferencias
    localStorage.removeItem('paymentVerificationCodeType');
    localStorage.removeItem('paymentVerificationTimestamp');
    localStorage.removeItem('paymentVerified');
    localStorage.removeItem('paymentVerifiedDate');
  }, []); // Se ejecuta solo al montar el componente

  // Manejar el envío del código de verificación
  const handleVerifyCode = () => {
    setLoading(true);
    setError('');
    
    // Aumentar el contador de intentos
    const newAttempts = checkingAttempts + 1;
    setCheckingAttempts(newAttempts);
    
    // Obtenemos el código correcto para el tipo seleccionado
    const codigoEsperado = CODIGOS_POR_TIPO[tipoSeleccionado];
    
    // Simular una verificación con un delay
    setTimeout(() => {
      // Normalizar los códigos para comparación (eliminar espacios y convertir a minúsculas)
      const normalizedInput = inputCode.trim().toLowerCase();
      const normalizedExpectedCode = codigoEsperado.toLowerCase();
      
      if (normalizedInput === normalizedExpectedCode) {
        // Código correcto
        setPaymentStatus('verified');
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          window.location.href = '/Registro';
        }, 2000);
      } else {
        // Comprobar errores comunes
        if (!normalizedInput) {
          setError('Por favor, ingresa un código de verificación.');
        } else if (normalizedInput.length !== normalizedExpectedCode.length) {
          setError(`El código debe tener ${normalizedExpectedCode.length} caracteres.`);
        } else if (normalizedInput.includes(' ')) {
          setError('El código no debe contener espacios.');
        } else {
          // Código incorrecto general
          setError(`Código de verificación inválido. Por favor, verifica que hayas ingresado el código correcto para tu Tipo ${tipoSeleccionado}.`);
        }
        
        // Si hay demasiados intentos fallidos, sugerir contactar al soporte
        if (newAttempts >= 3) {
          setError(prevError => `${prevError} Has realizado varios intentos fallidos. Por favor, contacta a soporte por WhatsApp para obtener ayuda.`);
        }
      }
      setLoading(false);
    }, 1000);
  };

  // Abre WhatsApp con el tipo de código
  const contactAdminOnWhatsApp = () => {
    const phoneNumber = '+584126779652';
    const message = encodeURIComponent(
      `Hola, quiero realizar el pago para acceder al contenido. Mi código de verificación es: Tipo ${tipoSeleccionado}`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  // Formatear fecha actual para instrucciones
  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('es-VE');
  };

  // No renderizamos nada hasta que tengamos un tipo seleccionado
  if (tipoSeleccionado === null) {
    return (
      <div className="container">
        <header className="header">
          <Navbar />
        </header>
        <div className="container card2">
          <h1 className="header-title">Cargando</h1>
          <div className="loading-message">
            <p>Generando código de verificación...</p>
            <div className="loader"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <Navbar />
      </header>
      <div className="container card2">
        <h1 className="header-title">Pago y Verificación</h1>
        <p className="payment-instruction">
          El pago son 5 $ o el equivalente en Bolívares a tasa BCV
        </p>
        <p className="payment-instruction">
          El acceso a nuestro contenido es válido por un mes y terminado el servicio es necesario renovar el pago para el acceso
        </p>
        <p className="payment-instruction">
          Nuestro contenido es susceptible a actualizaciones o modificaciones 
        </p>

        {paymentStatus === 'verified' ? (
          <div className="verification-success">
            <h2>¡Pago Verificado!</h2>
            <p>Tu pago ha sido verificado correctamente. Serás redirigido en unos segundos...</p>
          </div>
        ) : (
          <div className="payment-content">
            <div className="verification-box">
              <h2>Proceso de pago:</h2>
              <ol className="verification-steps">
                <li>
                  <strong>Contacta al administrador</strong> por WhatsApp haciendo clic en el botón de abajo.
                </li>
                
                <li>
                  <strong>Realiza el pago</strong> según las instrucciones que te dará el administrador.
                </li>
                <li>
                  <strong>Envía el comprobante de pago</strong> por WhatsApp.
                </li>
                <li>
                  <strong>Recibe tu código de acceso</strong> y escríbelo en el campo de abajo.
                </li>
              </ol>
              
              <div className="code-help">
                <p><strong>Importante:</strong> El administrador te enviará la clave de acceso correspondiente a tu Tipo {tipoSeleccionado}.</p>
              </div>
            </div>

            <button 
              onClick={contactAdminOnWhatsApp}
              className="button button--whatsapp button--large"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                alt="WhatsApp" 
                className="whatsapp-icon" 
              />
              Contactar por WhatsApp
            </button>

            <div className="code-verification-section">
              <h3>¿Ya realizaste el pago y recibiste tu código?</h3>
              <div className="code-input-container">
                <input
                  type="text"
                  placeholder="Ingresa el código de acceso"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="code-input"
                  maxLength={13}
                />
                <button 
                  onClick={handleVerifyCode}
                  disabled={loading || !inputCode.trim()}
                  className={`button button--verify ${loading ? 'button--disabled' : ''}`}
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <div className="code-tips">
                <p><strong>Información importante:</strong></p>
                <ul>
                  <li>Tu tipo de código es: <strong>Tipo {tipoSeleccionado}</strong></li>
                  <li>El administrador te enviará el código correspondiente después de verificar tu pago</li>
                  <li>Ingresa el código exactamente como te lo envíe el administrador</li>
                  <li>No incluyas espacios ni caracteres adicionales</li>
                </ul>
              </div>
            </div>

            <div className="payment-details">
              <h3>Información para el pago:</h3>
              <p><strong>Monto:</strong> 5 $ USD o equivalente en Bs.</p>
              <p><strong>Fecha:</strong> {getCurrentDate()}</p>
              <p><strong>Referencia:</strong> Tipo {tipoSeleccionado}</p>
              <p className="note">Al refrescar la página se generará un nuevo tipo de código.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualPayment;