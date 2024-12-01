import { config } from 'dotenv';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ROLES, ROLE_MESSAGE_MAP } from './constants.js';

config();

// const CHATGPT_MODEL = 'code-davinci-edit-001'
// const CHATGPT_MODEL = 'gpt-4'
const CHATGPT_MODEL = 'gpt-4';
// const CHATGPT_MODEL = 'gpt-3.5-turbo'

const httpAgent = new HttpsProxyAgent(process.env.PROXY_URL);

const openAi = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY_TELEGRAM,
  httpAgent,
});

export async function chatGPT(content = '', currentRole = ROLES.DEVELOPER) {
  const messages = [
    {
      role: 'system',
      content: ROLE_MESSAGE_MAP[currentRole],
    },
    { role: 'user', content },
  ];
  try {
    const completion = await openAi.chat.completions.create({
      messages,
      model: CHATGPT_MODEL,
    });

    return completion.choices[0].message;
  } catch (e) {
    console.error('Error while chat completion', e.message);
    return {
      content: e.message,
    };
  }
}
