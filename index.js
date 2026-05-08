import 'dotenv/config';
import express, { text } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash-lite';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to generate text using Gemini Flash
app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (Array.isArray(conversation) === false) {
            throw new Error('Conversation must be an array of messages');
        }

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.9,
                systemInstruction: "Jawab dengan singkat dan jelas.",
            },
        });

        res.status(200).json({ result: response.text });

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
        return;
    }    
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

