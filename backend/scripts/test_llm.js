const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const geminiKey = process.env.GEMINI_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

console.log('SafeDeploy LLM Diagnostic Tool');
console.log('-----------------------------');
console.log(`GEMINI_API_KEY: ${geminiKey ? 'LOADED (starts with ' + geminiKey.substring(0, 4) + '...)' : 'NOT FOUND'}`);
console.log(`OPENAI_API_KEY: ${openaiKey ? 'LOADED (starts with ' + openaiKey.substring(0, 4) + '...)' : 'NOT FOUND'}`);
console.log('-----------------------------\n');

async function testGemini() {
  if (!geminiKey) {
    console.log('⏩ Skipping Gemini test (no key found).');
    return;
  }

  console.log('⏳ Testing Google Gemini API...');
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Write a 1-sentence test message saying "Gemini connection is working!"');
    const response = await result.response;
    console.log(`✅ Gemini Success: "${response.text().trim()}"`);
  } catch (err) {
    console.error('❌ Gemini Error:', err.message);
  }
}

async function testOpenAI() {
  if (!openaiKey) {
    console.log('⏩ Skipping OpenAI test (no key found).');
    return;
  }

  console.log('⏳ Testing OpenAI API...');
  try {
    const openai = new OpenAI({ apiKey: openaiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Write a 1-sentence test message saying "OpenAI connection is working!"' }],
      max_tokens: 20
    });
    console.log(`✅ OpenAI Success: "${completion.choices[0].message.content.trim()}"`);
  } catch (err) {
    console.error('❌ OpenAI Error:', err.message);
  }
}

async function run() {
  if (!geminiKey && !openaiKey) {
    console.log('💡 Note: Add your GEMINI_API_KEY or OPENAI_API_KEY to backend/.env to run LLM tests.');
    console.log('   The application is currently running in OFFLINE fallback mode.');
    return;
  }

  await testGemini();
  console.log('');
  await testOpenAI();
}

run();
