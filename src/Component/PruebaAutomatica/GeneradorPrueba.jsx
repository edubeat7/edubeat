import React from 'react';
import * as XLSX from 'xlsx';

const ExcelGenerator = () => {
  // Usamos las preguntas que ya conocemos del código previo
  const preguntas = [
    {
      texto: "1. ¿Cuál es la principal diferencia entre tendones y ligamentos en el cuerpo humano?",
      opciones: [
        "Los tendones no son elásticos",
        "Los tendones unen músculo con hueso mientras que los ligamentos unen hueso con hueso",
        "Los tendones se encuentran principalmente en las extremidades superiores",
        "Los ligamentos están compuestos principalmente por elastina"
      ],
      respuestaCorrecta: 1,
    },
    {
      texto: "2. En la biomecánica del músculo, ¿qué determina la fuerza máxima que puede generar un músculo?",
      opciones: [
        "La longitud de las fibras musculares",
        "El ángulo de penación",
        "El área de sección transversal fisiológica",
        "La velocidad de contracción"
      ],
      respuestaCorrecta: 2,
    },
    {
      texto: "3. Una paciente de 68 años con osteoporosis posmenopáusica avanzada presenta una disminución significativa de la densidad mineral ósea en su fémur proximal. Las imágenes de densitometría ósea muestran que la sección transversal efectiva del cuello femoral ha disminuido a un tercio de su valor normal debido a la pérdida de masa ósea. Si esta paciente aplica la misma fuerza sobre la cadera al caminar que una persona con densidad ósea normal, el esfuerzo aplicado en el área debilitada será:",
      opciones: [
        "El triple",
        "Un tercio",
        "No cambia",
        "El doble"
      ],
      respuestaCorrecta: 0,
    },
    {
      texto: "4. ¿Qué tipo de esfuerzo soportan peor los huesos?",
      opciones: [
        "Compresión",
        "Tensión",
        "Torsión",
        "Flexión"
      ],
      respuestaCorrecta: 3,
    },
    {
      texto: "5. Un paciente con esguince en el tendón muestra una deformación permanente del tejido ¿En qué región de la curva esfuerzo-deformación se encuentra esta lesión?",
      opciones: [
        "Región basal",
        "Región lineal o elástica",
        "Región de falla progresiva o plástica",
        "Punto de falla total"
      ],
      respuestaCorrecta: 2,
    },
    {
      texto: "6. En un músculo peniforme con ángulo de penación de 30°, ¿qué porcentaje de la fuerza muscular contribuye directamente a la fuerza de contracción?",
      opciones: [
        "100%",
        "87%",
        "56%",
        "34%"
      ],
      respuestaCorrecta: 1,
    },
    {
      texto: "7. La propiedad del hueso que hace que su comportamiento mecánico varíe según la dirección de la carga aplicada se denomina:",
      opciones: [
        "Viscoelasticidad",
        "Anisotropía",
        "Ductilidad",
        "Porosidad"
      ],
      respuestaCorrecta: 1,
    },
    {
      texto: "8. Dada la siguiente grafica del movimiento de una sonda nasogástrica en este caso usada para un lavado gástrico diga: si llego al estómago sabiendo que la longitud para llegar es de 80 cm. ¿Dónde la velocidad es acelerada?",
      opciones: [
        "10 a 20 y de 40 a 50",
        "30 a 40",
        "30 y 70 a 80",
        "0 a 10 de 20 a 40 y de 50 a 70"
      ],
      respuestaCorrecta: 3,
    },
    {
      texto: "9. Un neurólogo está evaluando a pacientes con diferentes grados de esclerosis múltiple, una enfermedad desmielinizante que afecta la conducción nerviosa. Realiza pruebas de conducción nerviosa en cuatro pacientes, midiendo el tiempo que tarda un potencial de acción en recorrer una distancia de 30 cm en nervios periféricos. Los resultados son los siguientes: Paciente A: 0.6 ms, Paciente B: 1.5 ms, Paciente C: 3.0 ms, Paciente D: 0.3 ms. ¿Qué paciente presenta probablemente un menor daño desmielinizante en la zona evaluada?",
      opciones: [
        "Paciente A",
        "Paciente B",
        "Paciente C",
        "Paciente D"
      ],
      respuestaCorrecta: 3,
    },
    {
      texto: "10. Un odontólogo está evaluando la resistencia de diferentes materiales para una restauración molar en un paciente con bruxismo severo. Durante la masticación, el molar soporta una fuerza oclusal máxima de 720 N. La restauración propuesta tiene una superficie oclusal con área de contacto de 24 mm². El odontólogo considera tres materiales diferentes con los siguientes límites de resistencia a la compresión: Material A (Composite reforzado): 280 MPa, Material B (Cerámica feldespática): 160 MPa, Material C (Resina acrílica): 95 MPa. ¿Qué material es más susceptible a fracturarse bajo las condiciones de carga máxima del paciente con bruxismo?",
      opciones: [
        "Material A",
        "Material B",
        "Material C",
        "Todos los materiales resistirán la carga sin fracturarse"
      ],
      respuestaCorrecta: 2,
    },
    {
      texto: "11. El freno de alambre que se ve en la figura tiene una tensión T igual a 7N a lo largo de él con un ángulo de 70 grados con el eje y. La fuerza resultante en el eje y es de:",
      opciones: [
        "8,3",
        "4,8",
        "5,6",
        "7,4"
      ],
      respuestaCorrecta: 1,
    },
    {
      texto: "12. Un fisioterapeuta está desarrollando un programa de rehabilitación para un paciente con una lesión de ligamento cruzado anterior (LCA) en etapa inicial de recuperación. En esta fase, el fisioterapeuta necesita fortalecer la musculatura sin generar tensión en el ligamento lesionado, por lo que decide incluir ejercicios isométricos. ¿Qué combinación de ejercicios sería más adecuada para esta fase de rehabilitación?",
      opciones: [
        "Extensiones de rodilla y sentadillas profundas",
        "Sentadillas con salto y escalones",
        "Contracción sin flexo extensión del cuádriceps y ejercicio de puente glúteo estático",
        "Zancadas dinámicas y ejercicios con banda elástica con movimiento"
      ],
      respuestaCorrecta: 2,
    }
  ];

  // Función para convertir los datos al formato requerido para Excel
  const convertirDatosParaExcel = (preguntas) => {
    // Crear un array para los datos de Excel
    const datos = [];
    
    // Agregar encabezados
    datos.push(['Pregunta', 'Opción A', 'Opción B', 'Opción C', 'Opción D', 'Respuesta Correcta']);
    
    // Agregar los datos de cada pregunta
    preguntas.forEach(pregunta => {
      // La respuesta correcta como letra
      const letrasRespuestas = ['A', 'B', 'C', 'D'];
      const respuestaLetra = letrasRespuestas[pregunta.respuestaCorrecta];
      
      // Asegurarnos de que todas las opciones existan (por si acaso hay menos de 4)
      const opcionesCompletas = [...pregunta.opciones];
      while (opcionesCompletas.length < 4) {
        opcionesCompletas.push(''); // Rellenar con cadenas vacías si faltan opciones
      }
      
      // Añadir la fila con los datos
      datos.push([
        pregunta.texto,
        opcionesCompletas[0],
        opcionesCompletas[1],
        opcionesCompletas[2],
        opcionesCompletas[3],
        respuestaLetra
      ]);
    });
    
    return datos;
  };

  // Función que se ejecutará cuando se haga clic en el botón
  const generarExcel = () => {
    try {
      // Convertir los datos
      const datosExcel = convertirDatosParaExcel(preguntas);

      // Crear un libro de trabajo
      const libro = XLSX.utils.book_new();

      // Crear una hoja
      const hoja = XLSX.utils.aoa_to_sheet(datosExcel);

      // Ajustar anchos de columna
      const anchos = [
        { wch: 60 }, // Pregunta
        { wch: 25 }, // Opción A
        { wch: 25 }, // Opción B
        { wch: 25 }, // Opción C
        { wch: 25 }, // Opción D
        { wch: 10 }  // Respuesta Correcta
      ];
      hoja['!cols'] = anchos;

      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(libro, hoja, 'Preguntas de Biomecánica');

      // Escribir y descargar el archivo
      XLSX.writeFile(libro, 'Preguntas_Biomecanica.xlsx');
      
      alert('Archivo Excel generado correctamente.');
    } catch (error) {
      console.error('Error al generar el Excel:', error);
      alert('Ocurrió un error al generar el archivo Excel: ' + error.message);
    }
  };

  return (
    <div className="excel-generator">
      <h2>Generador de Excel de Preguntas de Biomecánica</h2>
      <p>Este componente permite generar un archivo Excel con las preguntas de biomecánica estructuradas en columnas.</p>
      
      <div className="button-container">
        <button 
          className="generate-button" 
          onClick={generarExcel}
        >
          Generar Excel
        </button>
      </div>
      
      <div className="preview-section">
        <h3>Contenido del Excel</h3>
        <p>El archivo Excel contendrá las siguientes columnas:</p>
        <ul>
          <li><strong>Pregunta:</strong> El texto completo de la pregunta</li>
          <li><strong>Opción A:</strong> Primera opción de respuesta</li>
          <li><strong>Opción B:</strong> Segunda opción de respuesta</li>
          <li><strong>Opción C:</strong> Tercera opción de respuesta</li>
          <li><strong>Opción D:</strong> Cuarta opción de respuesta</li>
          <li><strong>Respuesta Correcta:</strong> La letra (A, B, C, D) de la opción correcta</li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelGenerator;