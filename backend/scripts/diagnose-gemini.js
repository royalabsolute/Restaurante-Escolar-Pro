require('dotenv').config({ path: './.env' });

async function diagnose() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key starts with:', apiKey.substring(0, 8));

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const result = await response.json();

        if (!response.ok) {
            console.log('Error listing models:', JSON.stringify(result, null, 2));
            return;
        }

        console.log('--- ALL AVAILABLE MODELS ---');
        result.models.forEach(m => {
            console.log(`${m.name} | Methods: ${m.supportedGenerationMethods.join(',')}`);
        });

        // Test a simple prompt with various models
        const modelsToTest = [
            'models/gemini-1.5-flash',
            'models/gemini-2.0-flash',
            'models/gemini-flash-latest',
            'models/gemini-pro-latest',
            'models/gemini-2.5-flash'
        ];

        for (const model of modelsToTest) {
            console.log(`\nTesting model: ${model}`);
            const testResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] })
            });
            const testResult = await testResp.json();
            if (testResp.ok) {
                console.log(`✅ ${model} works!`);
            } else {
                console.log(`❌ ${model} failed: ${testResult.error?.message} (${testResult.error?.status})`);
            }
        }

    } catch (error) {
        console.error('Diagnosis crash:', error);
    }
}

diagnose();
