import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import './ListaProveedores.css';
import Navbar from '../Navbar/Navbar';

const supabase = createClient(
  import.meta.env.VITE_APP_SUPABASE_URL,
  import.meta.env.VITE_APP_SUPABASE_ANON_KEY
);

export default function ListaProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isExcelLoaded, setIsExcelLoaded] = useState(false);
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [userName, setUserName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const timeoutRef = useRef(null);

  // Event listener para detectar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (!session) {
        window.location.href = '/Login';
      } else if (session && session.user) {
        setUserName(session.user.email || 'Usuario');
      }
    };

    checkAuth();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) window.location.href = '/Login';
      else if (session && session.user) {
        setUserName(session.user.email || 'Usuario');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Efecto para buscar el archivo al iniciar
  useEffect(() => {
    if (isAuthenticated) {
      fetchExcelFile();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAuthenticated]);

  // Efecto para filtrar proveedores cuando cambia la búsqueda o categoría
  useEffect(() => {
    if (proveedores.length === 0) return;
    
    let filtered = [...proveedores];
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        proveedor => 
          (proveedor.nombre && proveedor.nombre.toLowerCase().includes(searchLower)) ||
          (proveedor.empresa && proveedor.empresa.toLowerCase().includes(searchLower)) ||
          (proveedor.telefono && proveedor.telefono.toString().includes(searchTerm)) ||
          (proveedor.email && proveedor.email.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtrar por categoría
    if (categoryFilter && categoryFilter !== '') {
      filtered = filtered.filter(
        proveedor => proveedor.categoria && proveedor.categoria.toString() === categoryFilter
      );
    }
    
    setFilteredProveedores(filtered);
  }, [searchTerm, categoryFilter, proveedores]);

  const fetchExcelFile = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Buscar el archivo en Supabase
      const { data, error } = await supabase.storage
        .from('proveedoresdeposito')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        setErrorMessage('No se encontró el archivo de proveedores');
        setIsLoading(false);
        return;
      }

      // Buscar el archivo Excel en los resultados
      const excelFile = data.find(file => 
        file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );

      if (!excelFile) {
        setErrorMessage('No se encontró ningún archivo Excel de proveedores');
        setIsLoading(false);
        return;
      }

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('proveedoresdeposito')
        .getPublicUrl(excelFile.name);
        
      if (!urlData || !urlData.publicUrl) {
        throw new Error('No se pudo obtener la URL del archivo');
      }

      // Cargar el archivo Excel
      await loadExcelData(urlData.publicUrl, excelFile.name);
      
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(`Error al cargar el archivo: ${error.message}`);
      setIsLoading(false);
    }
  };

  const loadExcelData = async (fileUrl, fileName) => {
    try {
      setSelectedFile(fileName);
      console.log("Cargando Excel desde:", fileUrl);
      
      // Descargar el archivo Excel
      const response = await fetch(fileUrl, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al descargar el archivo: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error("El archivo descargado está vacío");
      }
      
      const data = new Uint8Array(arrayBuffer);
      
      // Procesar el Excel con control de errores detallados
      try {
        console.log("Iniciando lectura de Excel...");
        
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          cellStyles: true,
          cellText: false
        });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error("El archivo Excel no contiene hojas");
        }
        
        console.log("Hojas encontradas:", workbook.SheetNames);
        
        // Usar la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        console.log("Leyendo hoja:", firstSheetName);
        
        // Convertir a JSON con manejo de errores
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          defval: '', // Valor por defecto para celdas vacías
          raw: false, // Convertir a strings para mejor manejo
          blankrows: false // Ignorar filas vacías
        });
        
        console.log("Datos leídos:", jsonData.length, "filas");
        
        if (jsonData.length === 0) {
          throw new Error("El archivo no contiene datos");
        }
        
        // Mostrar las primeras filas y columnas para diagnóstico
        console.log("Muestra de los primeros registros:", jsonData.slice(0, 2));
        console.log("Nombres de columnas:", Object.keys(jsonData[0]));
        
        // Normalizar nombres de campos para hacerlos más robustos
        const normalizedData = jsonData.map((row, index) => {
          try {
            const normalized = {};
            for (const key in row) {
              if (!key) continue; // Saltar claves vacías
              
              // Convertir nombres de campo a formato estándar
              let normalizedKey = String(key).toLowerCase().trim();
              normalizedKey = normalizedKey
                .replace(/[áàäâ]/g, 'a')
                .replace(/[éèëê]/g, 'e')
                .replace(/[íìïî]/g, 'i')
                .replace(/[óòöô]/g, 'o')
                .replace(/[úùüû]/g, 'u')
                .replace(/ñ/g, 'n')
                .replace(/\s+/g, '_');
                
              // Mapear nombres de campo comunes - con verificación de tipos
              if (normalizedKey.includes('nombre') || normalizedKey.includes('name')) {
                normalized.nombre = row[key] ? String(row[key]).trim() : '';
              }
              else if (normalizedKey.includes('empresa') || normalizedKey.includes('company')) {
                normalized.empresa = row[key] ? String(row[key]).trim() : '';
              }
              else if (normalizedKey.includes('telefono') || normalizedKey.includes('phone')) {
                normalized.telefono = row[key] ? String(row[key]).trim() : '';
              }
              else if (normalizedKey.includes('email') || normalizedKey.includes('correo')) {
                normalized.email = row[key] ? String(row[key]).trim() : '';
              }
              else if (normalizedKey.includes('direccion') || normalizedKey.includes('address')) {
                normalized.direccion = row[key] ? String(row[key]).trim() : '';
              }
              else if (normalizedKey.includes('categoria') || normalizedKey.includes('category')) {
                normalized.categoria = row[key] ? String(row[key]).trim() : '';
              }
              else if (normalizedKey.includes('notas') || normalizedKey.includes('notes')) {
                normalized.notas = row[key] ? String(row[key]).trim() : '';
              }
              else {
                // Para otros campos, mantener el nombre original, convertido a string
                normalized[normalizedKey] = row[key] ? String(row[key]).trim() : '';
              }
            }
            
            // Asegurar que todos los campos importantes están presentes (incluso vacíos)
            normalized.nombre = normalized.nombre || '';
            normalized.empresa = normalized.empresa || '';
            normalized.telefono = normalized.telefono || '';
            normalized.email = normalized.email || '';
            normalized.direccion = normalized.direccion || '';
            normalized.categoria = normalized.categoria || '';
            
            return normalized;
          } catch (rowError) {
            console.error(`Error procesando fila ${index + 1}:`, rowError);
            // Devolver un objeto con valores por defecto para no romper el proceso
            return {
              nombre: '',
              empresa: `Fila ${index + 1} - Error de formato`,
              telefono: '',
              email: '',
              direccion: '',
              categoria: 'Error',
              error: true
            };
          }
        });
        
        console.log("Datos normalizados:", normalizedData.length, "registros válidos");
        
        // Filtrar registros con suficiente información
        const validData = normalizedData.filter(item => 
          !item.error && 
          (item.empresa || item.nombre) // Al menos debe tener nombre o empresa
        );
        
        if (validData.length === 0) {
          throw new Error("No se encontraron registros válidos en el archivo");
        }
        
        console.log("Registros válidos:", validData.length);
        
        setProveedores(validData);
        setFilteredProveedores(validData);
        
        // Extraer categorías únicas para el filtro con manejo de colisiones y ordenamiento alfabético
        const categoriesSet = new Set();
        validData.forEach(item => {
          if (item.categoria) {
            categoriesSet.add(item.categoria.trim());
          }
        });
        
        const uniqueCategories = Array.from(categoriesSet).sort((a, b) => 
          a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
        
        console.log("Categorías encontradas:", uniqueCategories);
        
        setCategories(uniqueCategories);
        setIsExcelLoaded(true);
        setIsLoading(false);
        
      } catch (excelError) {
        console.error("Error al procesar el Excel:", excelError);
        throw new Error(`Error al leer el archivo Excel: ${excelError.message}`);
      }
    } catch (error) {
      console.error('Error al procesar el archivo Excel:', error);
      setErrorMessage(`Error al procesar el archivo: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Actualizado para manejar caso de selección vacía y corregir la comparación
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategoryFilter(value); // Puede ser una cadena vacía para "Todas las categorías"
    console.log("Categoría seleccionada:", value); // Ayuda para depuración
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar si es un archivo Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Por favor, seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Subir el archivo a Supabase
      const { error } = await supabase.storage
        .from('proveedoresdeposito')
        .upload(file.name, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('proveedoresdeposito')
        .getPublicUrl(file.name);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('No se pudo obtener la URL del archivo');
      }

      // Cargar el archivo Excel
      await loadExcelData(urlData.publicUrl, file.name);

    } catch (error) {
      console.error('Error al subir el archivo:', error);
      setErrorMessage(`Error al subir el archivo: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/Login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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

  const showScrollHint = isExcelLoaded && 
                         filteredProveedores.length > 0 && 
                         windowWidth < 1000 && 
                         windowWidth > 768; // Solo mostrar en tamaños medianos, no en móviles

  return (
    <div className="container">
      <header className="header">
        <Navbar />
      </header>

      <div className="proveedores-container">
        {/* Encabezado */}
        <div className="header-wrapper">
          <div className="header-content">
            <h1 className="main-title">📋 Lista de Proveedores</h1>
            <p className="welcome-message">Bienvenido, {userName}</p>
          </div>
        </div>

        {/* Controles de carga y búsqueda */}
        <div className="controls-section">
          
          <div className="search-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar proveedor..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
            
            <div className="category-filter">
              <select 
                value={categoryFilter} 
                onChange={handleCategoryChange}
                className="category-select"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Indicación de scroll horizontal en pantallas medianas */}
        {showScrollHint && (
          <div className="scroll-hint">
            <small>← Desliza horizontalmente para ver todos los datos →</small>
          </div>
        )}

        {/* Tabla de proveedores */}
        {isExcelLoaded && filteredProveedores.length > 0 && (
          <div className="proveedores-table-wrapper">
            <div className="results-count">
              Mostrando {filteredProveedores.length} de {proveedores.length} proveedores
            </div>
            
            <div className="proveedores-table">
              <div className="table-header">
                <div className="header-cell">Empresa</div>
                <div className="header-cell">Contacto</div>
                <div className="header-cell">Teléfono</div>
                <div className="header-cell">Email</div>
                <div className="header-cell">Categoría</div>
                <div className="header-cell">Dirección</div>
              </div>
              
              <div className="table-body">
                {filteredProveedores.map((proveedor, index) => (
                  <div key={index} className="table-row">
                    <div className="table-cell empresa-cell" data-label="Empresa">
                      <strong>{proveedor.empresa || 'N/A'}</strong>
                    </div>
                    <div className="table-cell" data-label="Contacto">
                      {proveedor.nombre || 'N/A'}
                    </div>
                    <div className="table-cell" data-label="Teléfono">
                      {proveedor.telefono || 'N/A'}
                    </div>
                    <div className="table-cell" data-label="Email">
                      {proveedor.email || 'N/A'}
                    </div>
                    <div className="table-cell" data-label="Categoría">
                      <span className="category-badge">
                        {proveedor.categoria || 'Sin categoría'}
                      </span>
                    </div>
                    <div className="table-cell address-cell" data-label="Dirección">
                      {proveedor.direccion || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {isExcelLoaded && filteredProveedores.length === 0 && (
          <div className="no-results">
            <p>No se encontraron proveedores con los criterios de búsqueda actuales</p>
            {searchTerm || categoryFilter ? (
              <button 
                className="upload-button clear-filter-button"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                }}
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>
        )}

        {/* Estados de carga */}
        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        )}

        {/* Manejo de errores */}
        {errorMessage && (
          <div className="error-container">
            <p>⚠️ {errorMessage}</p>
            <button
              className="retry-button upload-button"
              onClick={fetchExcelFile}
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {/* Botón de cerrar sesión */}
        <div className="card2">
          <button 
            className="logout-button upload-button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}