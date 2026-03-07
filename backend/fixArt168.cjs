require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const LC = mongoose.model('LegalContent', new mongoose.Schema({
    articleNumber: String,
    originalText: { en: String, rw: String, fr: String },
    crimeType: String,
    sourceDocument: String
  }), 'legalcontents');

  const art = await LC.findOne({ articleNumber: 'Article 168', sourceDocument: 'Penal Code 2018' });
  if (art) {
    await LC.updateOne(
      { _id: art._id },
      {
        $set: {
          'originalText.en': `Article 168: Penalties for theft with violence or threats\n\nIf theft is carried out with violence or threats, the penalty is imprisonment of a term of not less than five (5) years but not exceeding seven (7) years and a fine of not less than three million (3,000,000) Rwandan francs and not more than five million (5,000,000) Rwandan francs. If the violence caused bodily harm, the penalty is imprisonment of a term of not less than seven (7) years and not more than ten (10) years and a fine of not less than five million (5,000,000) Rwandan francs.`,
          'originalText.fr': art.originalText?.en || ''
        }
      }
    );
    console.log('✓ Article 168 updated');
  } else {
    console.log('Not found');
  }

  mongoose.disconnect();
}).catch(console.error);
