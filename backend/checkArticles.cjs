require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const LegalContent = mongoose.model('LegalContent', new mongoose.Schema({
    articleNumber: String,
    originalText: { en: String, rw: String, fr: String },
    crimeType: String,
    sourceDocument: String
  }), 'legalcontents');

  const docs = await LegalContent.distinct('sourceDocument');
  console.log('Source documents:', docs);

  const arts = await LegalContent.find({ articleNumber: { $in: ['182', '183', '244', 'Article 182', 'Article 183', 'Article 244'] } });
  console.log('Found', arts.length, 'articles');
  arts.forEach(a => {
    console.log('\n=== Article', a.articleNumber, '| src:', a.sourceDocument, '| crimeType:', a.crimeType, '===');
    console.log('EN (200):', (a.originalText?.en || '(empty)').slice(0, 200));
  });

  // Also check one sample
  const sample = await LegalContent.findOne({ sourceDocument: 'Penal Code 2018' });
  console.log('\nSample articleNumber format:', sample?.articleNumber);

  mongoose.disconnect();
}).catch(console.error);
