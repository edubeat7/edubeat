import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './Pagina1.css';
import Navbar from '../Navbar/Navbar';
import logoA from '../Login/Audifonoslogo.png';

const supabase = createClient(
  import.meta.env.VITE_APP_SUPABASE_URL,
  import.meta.env.VITE_APP_SUPABASE_ANON_KEY
);

export default function AudioInterface() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentPath, setCurrentPath] = useState('MusicaCarpeta');
  const [pathHistory, setPathHistory] = useState([]);
  const [isEmptyFolder, setIsEmptyFolder] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Estado de autenticación
  const timeoutRef = useRef(null);

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

  useEffect(() => {
    if (isAuthenticated) { // Solo cargar datos si está autenticado
      fetchFolderContent();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentPath, isAuthenticated]); // Añadir isAuthenticated como dependencia

  const fetchFolderContent = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setIsEmptyFolder(false);
      setItems([]);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const { data, error } = await supabase.storage
        .from('musica')
        .list(currentPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        timeoutRef.current = setTimeout(() => {
          setIsEmptyFolder(true);
          setIsLoading(false);
        }, 5000);
        return;
      }

      const processedItems = await Promise.all(
        data.map(async (item) => {
          if (item.id === null) {
            const { data: folderContent } = await supabase.storage
              .from('musica')
              .list(`${currentPath}/${item.name}`);
            
            if (!folderContent || folderContent.length === 0) return null;

            return { ...item, isFolder: true, name: item.name };
          } else {
            const { data: urlData } = supabase.storage
              .from('musica')
              .getPublicUrl(`${currentPath}/${item.name}`);

            const originalName = item.name.split('-').slice(1).join('-') || item.name;

            return {
              ...item,
              isFolder: false,
              originalName,
              url: urlData.publicUrl
            };
          }
        })
      );

      const validItems = processedItems.filter(item => 
        item !== null && (item.isFolder || item.name.endsWith('.mp3'))
      );

      if (validItems.length === 0) {
        timeoutRef.current = setTimeout(() => {
          setIsEmptyFolder(true);
          setIsLoading(false);
        }, 5000);
      } else {
        setItems(validItems);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error al cargar el contenido');
      setIsLoading(false);
    }
  };

  const handleNavigate = (folderName) => {
    setPathHistory(prev => [...prev, currentPath]);
    setCurrentPath(`${currentPath}/${folderName}`);
  };

  const handleGoBack = () => {
    if (pathHistory.length === 0) return;
    const prevPath = pathHistory[pathHistory.length - 1];
    setPathHistory(prev => prev.slice(0, -1));
    setCurrentPath(prevPath);
  };

  const handlePlayPause = (url) => {
    setCurrentlyPlaying(prev => prev === url ? null : url);
  };

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

  if (!isAuthenticated) {
    return null; // Redirección ya manejada en el efecto
  }

  return (
    <div className="container">

      <header className="header">
                <Navbar />
                
      </header>

      <div className="logo-container">
        <img src={logoA} className="App-logo" alt="logo" />
      </div>

    <div className="container">

      {/* Encabezado con botón flotante */}
      <div className="header-wrapper">
        <h1>🎵 Music Library</h1>
      </div>

      {/* Navegación */}
      <div className="navigation-controls">
        {pathHistory.length > 0 && (
          <button 
            className="upload-button"
            onClick={handleGoBack}
            style={{ marginBottom: '20px' }}
          >
            ↩ Volver atrás
          </button>
        )}
      </div>

      {/* Lista de contenido */}
      <div className="audio-list">
        {items.map(item => (
          <div key={item.id || item.name} className="audio-item">
            {item.isFolder ? (
              <button 
                className="upload-button folder"
                onClick={() => handleNavigate(item.name)}
              >
                📁 {item.name}
              </button>
            ) : (
              <div className="controls">
                <button 
                  className="play-button"
                  onClick={() => handlePlayPause(item.url)}
                >
                  {currentlyPlaying === item.url ? '⏸' : '▶'}
                </button>
                <span className="filename">{item.originalName}</span>
                <div className="actions">
                  <button
                    className="download-button"
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    ⬇ Descargar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Estados especiales */}
      {isEmptyFolder && (
        <div className="error-container">
          <p>La carpeta está vacía</p>
          {pathHistory.length > 0 && (
            <button
              className="upload-button error-retry"
              onClick={handleGoBack}
            >
              ↩ Volver atrás
            </button>
          )}
        </div>
      )}

      {/* Reproductor */}
      {currentlyPlaying && (
        <div className="fixed-player">
          <div className="controls">
            <button 
              className="play-pause"
              onClick={() => setCurrentlyPlaying(null)}
            >
              ⏹
            </button>
            <input 
              type="range" 
              value={audioProgress}
              max="100"
              className="progress-bar"
            />
            <audio
              autoPlay
              onTimeUpdate={(e) => setAudioProgress(
                (e.currentTarget.currentTime / e.currentTarget.duration) * 100
              )}
              onEnded={() => setCurrentlyPlaying(null)}
              src={currentlyPlaying}
            />
          </div>
        </div>
      )}

      {/* Estados de carga */}
      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando contenido...</p>
        </div>
      )}

      {/* Manejo de errores */}
      {errorMessage && (
        <div className="error-container">
          <p>⚠️ {errorMessage}</p>
          <button
            className="upload-button error-retry"
            onClick={fetchFolderContent}
          >
            🔄 Intentar nuevamente
          </button>
        </div>
      )}
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
}