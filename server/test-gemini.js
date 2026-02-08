// Test script to check Gemini API key and list available models
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  console.log('Testing Gemini API Key...\n');
  console.log('API Key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 10)}...` : 'NOT SET');

  try {
    // Try the simplest model name
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    const text = response.text();

    console.log('\n✅ Gemini API is working!');
    console.log('Model: gemini-1.5-flash');
    console.log('Response:', text);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your API key at: https://aistudio.google.com/app/apikey');
    console.log('2. Make sure the API key is valid and has Gemini API access');
    console.log('3. Try creating a new API key if this one is not working');
  }
}

test();
