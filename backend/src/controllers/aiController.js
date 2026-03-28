const AnalysisAIService = require('../services/ai/AnalysisAIService');
const logger = require('../utils/logger');

const AIController = {
    analyzeStatistics: async (req, res) => {
        try {
            const { data, question } = req.body;

            if (!data || !question) {
                return res.error('Faltan datos o la pregunta para el análisis', 400);
            }

            logger.api.request(req);

            const analysis = await AnalysisAIService.analyzeData(data, question);

            return res.success({ analysis }, 'Análisis generado correctamente');

        } catch (error) {
            logger.error('Error en AIController:', error);
            return res.error(error.message);
        }
    }
};

module.exports = AIController;
