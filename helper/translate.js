import translate from '@vitalets/google-translate-api';

async function translateText(text, targetLanguage) {
  try {
    const res = await translate(text, { to: targetLanguage });
    console.log(`النص الأصلي: ${text}`);
    console.log(`الترجمة: ${res.text}`);
    return res.text;
  } catch (err) {
    console.error('حدث خطأ أثناء الترجمة:', err);
    return null;
  }
}

export { translateText };
