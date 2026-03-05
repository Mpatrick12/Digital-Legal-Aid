/**
 * createGazetteEntries.js
 *
 * Creates / updates the 4 core legal documents as GazetteDocument entries.
 * Articles are already parsed into the LegalContent collection via seedLegalContent.js.
 * This script only creates the "card" entries that appear in the Gazette Library
 * browse + detail pages, each with a sourceDocument field that links to LegalContent.
 *
 * Usage (run from repo root):
 *   node backend/scripts/createGazetteEntries.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

import GazetteDocument from '../src/models/GazetteDocument.js'
import LegalContent    from '../src/models/LegalContent.js'

const ENTRIES = [
  {
    title:           'Law on the Penal Code',
    documentNumber:  'N 68/2018',
    gazetteNumber:   'N 68/2018',
    publicationDate: new Date('2018-09-27'),
    category:        'Law',
    languages:       ['en'],
    tags:            ['penal code', 'theft', 'assault', 'murder', 'fraud', 'robbery', 'criminal law', 'penalties'],
    description:     'Main Rwandan law determining all offences and their penalties',
    sourceDocument:  'Penal Code 2018',
    pdfFileName:     'penalcode2018.pdf',
  },
  {
    title:           'Law on Prevention and Punishment of Gender-Based Violence',
    documentNumber:  'N 59/2008',
    gazetteNumber:   'N 59/2008',
    publicationDate: new Date('2008-09-10'),
    category:        'Law',
    languages:       ['en'],
    tags:            ['gbv', 'gender based violence', 'sexual assault', 'domestic violence', 'rape', 'women'],
    description:     'Rwanda law specifically addressing gender-based violence crimes',
    sourceDocument:  'GBV Law',
    pdfFileName:     'gbv_law.pdf',
  },
  {
    title:           'Law Relating to Criminal Procedure',
    documentNumber:  'N 27/2019',
    gazetteNumber:   'N 27/2019',
    publicationDate: new Date('2019-11-08'),
    category:        'Law',
    languages:       ['en'],
    tags:            ['criminal procedure', 'reporting crime', 'police', 'victim rights', 'investigation', 'arrest', 'evidence'],
    description:     'Explains how crimes are reported, investigated and prosecuted in Rwanda',
    sourceDocument:  'Criminal Procedure',
    pdfFileName:     'criminal_procedure.pdf',
  },
  {
    title:           'Penal Code Amendment 2023',
    documentNumber:  'N 059/2023',
    gazetteNumber:   'N 059/2023',
    publicationDate: new Date('2023-12-05'),
    category:        'Law',
    languages:       ['en'],
    tags:            ['penal code', 'amendment', 'updated penalties', 'assault', 'defilement', 'sentencing'],
    description:     '2023 amendments to the Penal Code updating key penalties',
    sourceDocument:  'Penal Code Amendment 2023',
    pdfFileName:     'amendment2023.pdf',
  },
]

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  for (const entry of ENTRIES) {
    // Count articles in LegalContent for this source
    const articleCount = await LegalContent.countDocuments({ sourceDocument: entry.sourceDocument })
    console.log(`  ${entry.sourceDocument}: ${articleCount} articles in LegalContent`)

    // Build a text preview from first few articles
    const sampleArticles = await LegalContent
      .find({ sourceDocument: entry.sourceDocument })
      .sort({ articleNumber: 1 })
      .limit(3)
      .select('originalText.en')

    const textPreview = sampleArticles
      .map(a => a.originalText?.en || '')
      .join(' ')
      .slice(0, 500)

    const update = {
      title:           entry.title,
      gazetteNumber:   entry.gazetteNumber,
      publicationDate: entry.publicationDate,
      category:        entry.category,
      languages:       entry.languages,
      tags:            entry.tags,
      description:     entry.description,
      sourceDocument:  entry.sourceDocument,
      pdfFileName:     entry.pdfFileName,
      textPreview,
      articleCount,
      // Clear old embedded articles — we serve from LegalContent now
      articles:        [],
      extractedText:   { en: '', rw: '', fr: '' },
    }

    const result = await GazetteDocument.findOneAndUpdate(
      { documentNumber: entry.documentNumber },
      { $set: update },
      { upsert: true, new: true }
    )
    console.log(`✅ ${result.title} (${result.documentNumber}) — ${articleCount} articles`)
  }

  console.log('\nAll 4 gazette entries created/updated.')
  await mongoose.disconnect()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
