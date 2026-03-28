const logger = require('../../utils/logger');

class AnalysisAIService {
    /**
     * Analiza un conjunto de datos estadísticos utilizando Google Gemini
     * @param {Object} data Contexto de los datos del dashboard
     * @param {string} userQuestion Pregunta del usuario
     * @returns {Promise<string>} Respuesta de la IA
     */
    static async analyzeData(data, userQuestion) {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.trim() === '') {
            logger.warn('AI Analysis: GEMINI_API_KEY no configurada.');
            return "Para utilizar el Analista de IA, por favor configura la clave de API (GEMINI_API_KEY) en el servidor.";
        }

        // Validación básica de formato
        if (!apiKey.startsWith('AIza')) {
            logger.warn('AI Analysis: El formato de GEMINI_API_KEY parece inválido.');
            return "La clave de API (GEMINI_API_KEY) configurada parece no ser válida. Asegúrate de usar una clave de Google AI Studio (que suele empezar por 'AIza').";
        }

        try {
            const prompt = this.#buildPrompt(data, userQuestion);

            // Usamos gemini-flash-latest que es el modelo verificado funcional para esta clave
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000
                    }
                })
            });

            const result = await response.json();

            if (!response.ok) {
                logger.error('Gemini API Error Response:', result);
                throw new Error(result.error?.message || 'Error en la petición a Gemini API');
            }

            const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            return aiText || "No pude generar un análisis en este momento.";

        } catch (error) {
            logger.error('AI Analysis Error:', error);
            throw new Error('Lo siento, ocurrió un error procesando tu consulta con la IA.');
        }
    }

    static #buildPrompt(data, question) {
        const resumen = data.resumen || {};
        const trends = data.attendance?.series || [];
        const distribucionGrado = data.groupBreakdown || [];
        const distribucionJornada = data.dataset?.summary?.distribucionJornada || [];

        // Limpieza de datos nulos para el prompt
        const safeResumen = {
            totalEstudiantes: resumen.totalEstudiantes || 0,
            totalPlatosServidos: resumen.totalPlatosServidos || 0,
            promedioAsistencia: resumen.promedioAsistencia || 0,
            tasaJustificacion: resumen.tasaJustificacion || 0,
            totalFaltasSinJustificar: resumen.totalFaltasSinJustificar || 0,
            totalFaltasPendientes: resumen.totalFaltasPendientes || 0,
            totalAsistenciasSuplentes: resumen.totalAsistenciasSuplentes || 0,
            asistenciasDiaMax: resumen.diaMaxDemanda?.asistencias || 0,
            fechaDiaMax: resumen.diaMaxDemanda?.fecha || 'N/A'
        };

        return `
Eres el **Analista Senior de Inteligencia Escolar** de la Institución Educativa San Antonio de Prado. 
Tu misión es proporcionar análisis estratégicos, precisos y ejecutivos sobre el uso del restaurante escolar.

---
### CONTEXTO INTEGRAL DE DATOS:

**1. INDICADORES CLAVE (KPIs):**
- Total Estudiantes Analizados: ${safeResumen.totalEstudiantes}
- Total Platos Servidos (Estudiantes + Suplentes): ${safeResumen.totalPlatosServidos}
- Asistencias Suplentes (Raciones Adicionales): ${safeResumen.totalAsistenciasSuplentes}
- Promedio de Asistencia General: ${safeResumen.promedioAsistencia}%
- Tasa de Justificación de Faltas: ${safeResumen.tasaJustificacion}%
- Faltas Sin Justificar: ${safeResumen.totalFaltasSinJustificar}
- Faltas Pendientes de Revisión: ${safeResumen.totalFaltasPendientes}
- Día de Mayor Demanda: ${safeResumen.fechaDiaMax} (${safeResumen.asistenciasDiaMax} platos)

**2. DESGLOSE POR GRUPOS (Top 5):**
${distribucionGrado.slice(0, 5).map(g => `- ${g.grado}: ${g.promedio_asistencia}% asistencia (${g.estudiantes} estudiantes registrados)`).join('\n')}

**3. DISTRIBUCIÓN POR JORNADA:**
${distribucionJornada.map(j => `- Jornada ${j.jornada}: ${j.promedio_asistencia}% asistencia (${j.estudiantes} estudiantes)`).join('\n')}

**4. TENDENCIA RECENTE (Últimos 7 registros):**
${trends.slice(-7).map(t => `- ${t.fecha}: ${t.asistencias_estudiantes} asistencias, ${t.faltas_estudiantes} faltas`).join('\n')}

---
### INSTRUCCIONES DE RESPUESTA:
- **Tono**: Ejecutivo, profesional y proactivo.
- **Acción**: Detecta patrones. Si un grado o jornada tiene asistencia baja, menciónalo como un punto de atención.
- **Formato**: Usa Markdown con negritas para destacar cifras críticas. Estructura la respuesta con puntos clave.
- **Idiomas**: Responde siempre en Español.
- **Confidencialidad**: No inventes datos que no estén arriba.

**SOLICITUD DEL ADMINISTRADOR:**
"${question}"

**INFORME ANALÍTICO:**
`;
    }
}

module.exports = AnalysisAIService;
