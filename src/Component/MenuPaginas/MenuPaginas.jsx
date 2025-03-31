import React, { useState, useEffect } from 'react';
import './MenuPaginas.css';
import logoImage from '../Login/Audifonoslogo.png';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_APP_SUPABASE_URL,
    import.meta.env.VITE_APP_SUPABASE_ANON_KEY
  );
  
  const MenuSeleccion = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
  
    // Verificar autenticación al montar el componente
    useEffect(() => {
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        
        if (!session) {
          window.location.href = '/Login'; // Redirigir si no está autenticado
        }
      };
  
      checkAuth();
  
      // Escuchar cambios en la autenticación
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
        if (!session) window.location.href = '/Login';
      });
  
      return () => subscription?.unsubscribe();
    }, []);
  
    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = '/Login';
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    };
  
    // Mostrar pantalla de carga mientras se verifica la autenticación
    if (isAuthenticated === null) {
      return (
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Verificando autenticación...</p>
          </div>
        </div>
      );
    }
  
    // No mostrar nada si no está autenticado (la redirección ya está manejada en el efecto)
    if (!isAuthenticated) {
      return null;
    }
  
    // Si está autenticado, mostrar el menú
    return (
      <div className="menu-container">
        <div className="menu-form">
          <div className="logo-container">
            <img src={logoImage} alt="Logo" className="App-logo" />
          </div>
          
          <div className="menu-card">
            <h1 className="menu-title">Seleccione una opción</h1>
            
            <div className="menu-options">
              <a href="/Pagina1" className="menu-option">
                <div className="option-icon">
                  <i className="fas fa-user-plus"></i>
                </div>
                <span className="option-text">Música</span>
              </a>
              
              <a href="/PruebaAutomatica" className="menu-option">
                <div className="option-icon">
                  <i className="fas fa-tasks"></i>
                </div>
                <span className="option-text">Cuestionario</span>
              </a>

              <a href="/Listaproveedores" className="menu-option">
                <div className="option-icon">
                  <i className="fas fa-tasks"></i>
                </div>
                <span className="option-text">Proveedores</span>
              </a>
            </div>

            
            <p className="menu-disclaimer">
              Seleccione una opción para continuar
            </p>
          </div>
  
          <div className="card2">
            <button 
              className="upload-button logout-button"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default MenuSeleccion;