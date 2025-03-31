import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import './PruebaAutomatica.css';
import Navbar from '../Navbar/Navbar';

const supabase = createClient(
  import.meta.env.VITE_APP_SUPABASE_URL,
  import.meta.env.VITE_APP_SUPABASE_ANON_KEY
);

export default function ExcelQuizInterface() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, percentage: 0, grade: 'N/A' });
  const [excelFiles, setExcelFiles] = useState([]);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isExcelLoaded, setIsExcelLoaded] = useState(false);
  const [currentPath, setCurrentPath] = useState('PruebadepositoCarpeta');
  const [pathHistory, setPathHistory] = useState([]);
  const [isEmptyFolder, setIsEmptyFolder] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const timeoutRef = useRef(null);
  const timerRef = useRef(null);

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

  // Cargar la lista de archivos Excel desde Supabase
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Iniciando carga de archivos...");
      fetchFolderContent();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentPath, isAuthenticated]);

  // Configurar el temporizador para el cuestionario
  useEffect(() => {
    if (isExcelLoaded && !showResults) {
      // Iniciar temporizador de 15 minutos (900 segundos)
      const timeLimit = 15 * 60; 
      setRemainingTime(timeLimit);
      
      timerRef.current = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            // Tiempo agotado, mostrar resultados automáticamente
            handleSubmitQuiz();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isExcelLoaded, showResults]);

  // Función para formatear el tiempo restante
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchFolderContent = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setIsEmptyFolder(false);
      setExcelFiles([]);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      console.log(`Intentando listar archivos de: ${currentPath}`);

      // Listamos el contenido del directorio actual
      const { data, error } = await supabase.storage
        .from('pruebasdeposito')
        .list(currentPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        console.error("Error al listar contenido:", error);
        throw error;
      }

      console.log("Contenido obtenido:", data);

      if (!data || data.length === 0) {
        console.log("No se encontraron archivos o carpetas");
        setIsEmptyFolder(true);
        setIsLoading(false);
        return;
      }

      // Procesamos cada elemento (archivo o carpeta)
      const processedItems = [];

      for (const item of data) {
        console.log("Procesando elemento:", item);
        
        if (!item.id) {
          // Es una carpeta
          console.log(`Verificando contenido de carpeta: ${item.name}`);
          
          const { data: folderContent, error: folderError } = await supabase.storage
            .from('pruebasdeposito')
            .list(`${currentPath}/${item.name}`);
          
          if (folderError) {
            console.error(`Error al listar contenido de carpeta ${item.name}:`, folderError);
            continue;
          }
          
          if (folderContent && folderContent.length > 0) {
            processedItems.push({
              ...item,
              isFolder: true,
              name: item.name
            });
            console.log(`Carpeta agregada: ${item.name}`);
          } else {
            console.log(`Carpeta vacía, omitiendo: ${item.name}`);
          }
        } else {
          // Es un archivo - verificamos si es Excel
          const fileName = item.name.toLowerCase();
          if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Obtenemos la URL pública del archivo
            const { data: urlData } = supabase.storage
              .from('pruebasdeposito')
              .getPublicUrl(`${currentPath}/${item.name}`);
            
            if (!urlData || !urlData.publicUrl) {
              console.error(`No se pudo obtener URL para: ${item.name}`);
              continue;
            }
            
            console.log(`URL obtenida para ${item.name}:`, urlData.publicUrl);
            
            // Limpiamos el nombre para mostrar
            const displayName = item.name.replace(/\.(xlsx|xls)$/i, '').replace(/-/g, ' ');
            
            processedItems.push({
              ...item,
              isFolder: false,
              originalName: displayName,
              url: urlData.publicUrl
            });
            console.log(`Archivo Excel agregado: ${displayName}`);
          } else {
            console.log(`Archivo no es Excel, omitiendo: ${item.name}`);
          }
        }
      }

      console.log("Elementos procesados:", processedItems.length);
      
      if (processedItems.length === 0) {
        console.log("No se encontraron carpetas con contenido ni archivos Excel");
        setIsEmptyFolder(true);
        setIsLoading(false);
      } else {
        setExcelFiles(processedItems);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error al cargar contenido:', error);
      setErrorMessage(`Error al cargar el contenido: ${error.message}`);
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

  // Función para seleccionar aleatoriamente 10 preguntas
  const selectRandomQuestions = (allQuestions, count = 10) => {
    if (allQuestions.length <= count) return allQuestions;
    
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleExcelSelect = async (fileUrl, fileName) => {
    setIsLoading(true);
    setErrorMessage('');
    setSelectedFileUrl(fileUrl);
    setSelectedFileName(fileName);
    
    try {
      console.log("Intentando cargar Excel desde:", fileUrl);
      
      // Descargar el archivo Excel de Supabase
      const response = await fetch(fileUrl, {
        method: 'GET',
        cache: 'no-cache', // Evitar problemas de caché
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log("Estado de la respuesta:", response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Error al descargar el archivo: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log("Tamaño del archivo descargado:", arrayBuffer.byteLength, "bytes");
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error("El archivo descargado está vacío");
      }
      
      const data = new Uint8Array(arrayBuffer);
      
      // Usar try-catch específico para la lectura del Excel
      try {
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true, // Mejor manejo de fechas
          cellStyles: true // Mantener estilos
        });
        
        console.log("Hojas en el libro:", workbook.SheetNames);
        
        if (workbook.SheetNames.length === 0) {
          throw new Error("El archivo Excel no contiene hojas");
        }
        
        // Asumimos que la primera hoja contiene las preguntas
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false, // Convertir a strings para mejor manejo
          defval: '' // Valor por defecto para celdas vacías
        });
        
        console.log("Filas en el Excel:", jsonData.length);
        
        if (jsonData.length <= 1) {
          throw new Error("El archivo no contiene suficientes datos (solo tiene encabezados o está vacío)");
        }
        
        if (jsonData[0].length < 6) {
          throw new Error(`El formato del archivo no es correcto. Se esperan al menos 6 columnas (Pregunta, Opción A, B, C, D y Respuesta Correcta). Solo tiene ${jsonData[0].length} columnas.`);
        }
        
        console.log("Primera fila (encabezados):", jsonData[0]);
        console.log("Segunda fila (primera pregunta):", jsonData[1]);
        
        // Eliminar la fila de encabezados
        const dataWithoutHeaders = jsonData.slice(1);
        
        // Procesar los datos para formatearlos como preguntas
        const formattedQuestions = dataWithoutHeaders.map((row, index) => {
          // Verificar que la fila tenga el formato esperado
          if (!row || row.length < 6) {
            console.log(`Fila ${index + 2} incompleta:`, row);
            return null; // Ignorar filas incompletas
          }
          
          // Verificar que las opciones no estén vacías
          const options = [row[1], row[2], row[3], row[4]];
          if (options.some(opt => !opt || opt.trim() === '')) {
            console.log(`Opciones incompletas en fila ${index + 2}`);
            return null;
          }
          
          // Convertir la letra de respuesta (A, B, C, D) a índice (0, 1, 2, 3)
          const answerMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
          let respuestaCorrecta = String(row[5] || '').trim().toUpperCase();
          
          if (!answerMap.hasOwnProperty(respuestaCorrecta)) {
            console.log(`Respuesta incorrecta en fila ${index + 2}: "${respuestaCorrecta}"`);
            return null; // Ignorar filas con respuesta incorrecta
          }
          
          const correctAnswerIndex = answerMap[respuestaCorrecta];
          
          return {
            id: index,
            text: row[0],
            options: options,
            correctAnswer: correctAnswerIndex
          };
        }).filter(q => q !== null); // Eliminar elementos nulos
        
        console.log("Preguntas formateadas:", formattedQuestions.length);
        
        if (formattedQuestions.length === 0) {
          throw new Error('No se encontraron preguntas válidas en el archivo. Asegúrate de que el formato sea correcto.');
        }
        
        // Seleccionar 10 preguntas aleatorias
        const randomQuestions = selectRandomQuestions(formattedQuestions);
        console.log(`Seleccionadas ${randomQuestions.length} preguntas aleatorias de ${formattedQuestions.length} disponibles`);
        
        // Actualizar IDs para que sean secuenciales (0-9)
        const questionsWithUpdatedIds = randomQuestions.map((q, idx) => ({
          ...q,
          id: idx
        }));
        
        setQuestions(questionsWithUpdatedIds);
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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/Login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Función mejorada para calcular puntuación con más detalles y manejar preguntas sin responder
  const calculateScore = () => {
    if (questions.length === 0) return { correct: 0, total: 0, percentage: 0, grade: 'N/A', skipped: 0 };
    
    let correctCount = 0;
    let skippedCount = 0;
    const detailedResults = [];
    
    questions.forEach(question => {
      // Verificar si la pregunta fue respondida
      if (userAnswers[question.id] === undefined) {
        skippedCount++;
        detailedResults.push({
          questionId: question.id,
          isCorrect: false,
          isSkipped: true,
          userAnswer: null,
          correctAnswer: question.correctAnswer
        });
      } else {
        const isCorrect = userAnswers[question.id] === question.correctAnswer;
        if (isCorrect) {
          correctCount++;
        }
        
        detailedResults.push({
          questionId: question.id,
          isCorrect,
          isSkipped: false,
          userAnswer: userAnswers[question.id],
          correctAnswer: question.correctAnswer
        });
      }
    });
    
    // El porcentaje se calcula sobre el total de preguntas, contando las omitidas como incorrectas
    const percentage = (correctCount / questions.length) * 100;
    
    // Determinar calificación
    let grade = '';
    if (percentage >= 90) grade = 'Excelente';
    else if (percentage >= 80) grade = 'Muy Bien';
    else if (percentage >= 70) grade = 'Bien';
    else if (percentage >= 60) grade = 'Suficiente';
    else grade = 'Necesita Mejorar';
    
    return {
      correct: correctCount,
      total: questions.length,
      percentage,
      grade,
      skipped: skippedCount,
      answered: questions.length - skippedCount,
      details: detailedResults
    };
  };

  const handleSubmitQuiz = () => {
    // Detener el temporizador
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const scoreResults = calculateScore();
    setScore(scoreResults);
    setShowResults(true);
    
    // Registrar el resultado en la consola (podría enviarse a una base de datos en el futuro)
    console.log(`Usuario ${userName} completó el cuestionario "${selectedFileName}" con ${scoreResults.correct}/${scoreResults.total} (${scoreResults.percentage.toFixed(2)}%) - Calificación: ${scoreResults.grade}`);
  };

  const handleRestartQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
    setScore({ correct: 0, total: 0, percentage: 0, grade: 'N/A' });
    
    // Reiniciar el temporizador (15 minutos)
    setRemainingTime(15 * 60);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleSubmitQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const handleBackToFiles = () => {
    // Detener el temporizador si está activo
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setSelectedFileUrl(null);
    setSelectedFileName('');
    setIsExcelLoaded(false);
    setQuestions([]);
    setUserAnswers({});
    setShowResults(false);
    setScore({ correct: 0, total: 0, percentage: 0, grade: 'N/A' });
    setRemainingTime(null);
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

      <div className="quiz-container">
        {/* Encabezado */}
        <div className="header-wrapper">
          <div className="header-content">
            <h1 className="main-title"> Cuestionario de Biomecánica</h1>
            <p className="welcome-message">Bienvenido, {userName}</p>
            
            
          </div>
        </div>

        {isExcelLoaded && !showResults && (
              <div className="timer-display">
                <span className="timer-icon">⏱️</span>
                <span className="timer-text">Tiempo restante: </span>
                <span className="timer-value">{formatTime(remainingTime)}</span>
              </div>
            )}
            
            {!isExcelLoaded && (
              <p className="path-display">
                Ubicación actual: <span className="current-path">{currentPath}</span>
              </p>
            )}

        {/* Navegación */}
        {pathHistory.length > 0 && !isExcelLoaded && (
          <div className="navigation-controls">
            <button 
              className="upload-button back-button"
              onClick={handleGoBack}
            >
              ↩ Volver atrás
            </button>
            <button
              className="upload-button refresh-button"
              onClick={() => fetchFolderContent()}
            >
              🔄 Actualizar
            </button>
          </div>
        )}

        {/* Listado de archivos Excel */}
        {!isExcelLoaded && (
          <div className="files-section">
            <h2 className="section-title">Selecciona un cuestionario</h2>
            
            {excelFiles.length > 0 ? (
              <div className="files-list audio-list">
                {excelFiles.map(item => (
                  <div key={item.id || item.name} className="audio-item file-item">
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
                          className="excel-file-button upload-button"
                          onClick={() => handleExcelSelect(item.url, item.originalName)}
                        >
                          🧠 {item.originalName}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className="empty-folder-message">
                  <p>No se encontraron archivos o carpetas. {isEmptyFolder ? 'La carpeta está vacía.' : ''}</p>
                  <button
                    className="upload-button refresh-button"
                    onClick={() => fetchFolderContent()}
                  >
                    🔄 Intentar nuevamente
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* Mostrar preguntas */}
        {isExcelLoaded && !showResults && (
          <div className="questions-section">
            <h2 className="quiz-title">
              {selectedFileName}
              <span className="quiz-subtitle">Responde todas las preguntas</span>
            </h2>
            
            <div className="progress-indicator">
              <div className="progress-text">
                {Object.keys(userAnswers).length} de {questions.length} respondidas
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="questions-list">
              {questions.map(question => (
                <div key={question.id} className="question-card audio-item">
                  <h3 className="question-text">{question.text}</h3>
                  
                  <div className="options-list">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="option-label">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={userAnswers[question.id] === optionIndex}
                          onChange={() => handleAnswerSelect(question.id, optionIndex)}
                          className="option-input"
                        />
                        <span className="option-text">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="submit-section">
              <button 
                className="upload-button submit-button"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(userAnswers).length === 0} // Solo deshabilitado si no ha respondido ninguna
              >
                {Object.keys(userAnswers).length === questions.length 
                  ? "Finalizar cuestionario" 
                  : `Finalizar con ${Object.keys(userAnswers).length}/${questions.length} respuestas`}
              </button>
              
              <button 
                className="upload-button change-file-button"
                onClick={handleBackToFiles}
              >
                Seleccionar otro archivo
              </button>
            </div>
            
            {Object.keys(userAnswers).length > 0 && Object.keys(userAnswers).length < questions.length && (
              <div className="incomplete-warning">
                <p>⚠️ No has respondido todas las preguntas. Las preguntas sin responder se considerarán incorrectas.</p>
              </div>
            )}
          </div>
        )}

        {/* Mostrar resultados mejorados */}
        {showResults && (
        <div className="results-section">
            <h2 className="results-title">Resultados del cuestionario</h2>
            <h3 className="results-subtitle">{selectedFileName}</h3>
            
            <div className="score-display">
            <div className="score-circle">
                <div className="score-number">{score.correct}</div>
                <div className="score-total">/{score.total}</div>
            </div>
            <div className="score-percentage">
                {Math.round(score.percentage)}% de acierto
            </div>
            <div className="score-grade">
                Calificación: <strong>{score.grade}</strong>
            </div>
            
            {score.skipped > 0 && (
                <div className="skipped-info">
                <span className="skipped-count">{score.skipped}</span> preguntas sin responder
                </div>
            )}
            </div>
            
            <div className="performance-message">
            {score.percentage >= 80 ? (
                <p className="success-message">¡Felicitaciones! Has demostrado un excelente conocimiento en este tema.</p>
            ) : score.percentage >= 60 ? (
                <p className="average-message">Buen trabajo. Has aprobado, pero hay espacio para mejorar.</p>
            ) : (
                <p className="improvement-message">Necesitas repasar este tema. Te recomendamos estudiar nuevamente el material.</p>
            )}
            
            {score.skipped > 0 && (
                <p className="skipped-message">
                No respondiste {score.skipped} {score.skipped === 1 ? 'pregunta' : 'preguntas'}, que se {score.skipped === 1 ? 'ha considerado' : 'han considerado'} como {score.skipped === 1 ? 'incorrecta' : 'incorrectas'}.
                </p>
            )}
            </div>
            
            <h3 className="review-title">Revisión de respuestas</h3>
            
            <div className="questions-review">
            {questions.map(question => {
                const isSkipped = userAnswers[question.id] === undefined;
                const isCorrect = !isSkipped && userAnswers[question.id] === question.correctAnswer;
                
                return (
                <div 
                    key={question.id} 
                    className={`review-item audio-item ${isSkipped ? 'skipped' : isCorrect ? 'correct' : 'incorrect'}`}
                >
                    {/* Pregunta */}
                    <h4 className="question-text">{question.text}</h4>
                    
                    {/* Respuestas en formato vertical */}
                    <div className="answer-section-vertical">
                    {/* Respuesta del usuario */}
                    {!isSkipped ? (
                        <div className="answer-block-vertical">
                        <div className="answer-header-vertical">Tu respuesta:</div>
                        <div className={`answer-content-vertical ${isCorrect ? 'correct-answer' : 'wrong-answer'}`}>
                            {question.options[userAnswers[question.id]]}
                        </div>
                        </div>
                    ) : (
                        <div className="answer-block-vertical skipped-block">
                        <div className="answer-header-vertical">Sin responder</div>
                        </div>
                    )}
                    
                    {/* Respuesta correcta */}
                    <div className="answer-block-vertical">
                        <div className="answer-header-vertical">Respuesta correcta:</div>
                        <div className="answer-content-vertical correct-answer">
                        {question.options[question.correctAnswer]}
                        </div>
                    </div>
                    </div>
                    
                    {/* Indicador de estado */}
                    <div className="answer-badge">
                    {isSkipped ? '⚠ Sin responder' : isCorrect ? '✓ Correcta' : '✗ Incorrecta'}
                    </div>
                </div>
                );
            })}
            </div>
            
            <div className="actions-section">
            <button 
                className="upload-button restart-button"
                onClick={handleRestartQuiz}
            >
                Reintentar cuestionario
            </button>
            
            <button 
                className="upload-button change-file-button"
                onClick={handleBackToFiles}
            >
                Seleccionar otro archivo
            </button>
            
            <button 
                className="upload-button print-button"
                onClick={() => window.print()}
            >
                Imprimir resultados
            </button>
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
              className="retry-button upload-button"
              onClick={fetchFolderContent}
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