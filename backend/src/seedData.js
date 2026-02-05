import LegalContent from './models/LegalContent.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const sampleData = [
  {
    crimeType: 'Theft',
    articleNumber: 'Art. 166',
    originalText: {
      en: 'Any person who fraudulently takes property of another with intent to deprive the owner permanently shall be liable to imprisonment.',
      rw: 'Umuntu wese wiba umutungo w\'undi afite intego yo kumwambura burundu ahanishwa igifungo.'
    },
    simplifiedExplanation: {
      en: 'If someone takes your belongings without permission intending to keep them permanently, that is theft and is punishable by law.',
      rw: 'Niba umuntu afashe ibintu byawe atabishoboye kandi ashaka kubigumana burundu, ibyo ni ubujura kandi bihanishwa n\'amategeko.'
    },
    reportingSteps: [
      {
        stepNumber: 1,
        description: {
          en: 'Go to the nearest police station immediately after discovering the theft',
          rw: 'Jya ku kanama ka polisi kiri hafi ako kanya ubone ubujura'
        }
      },
      {
        stepNumber: 2,
        description: {
          en: 'Provide a detailed description of what was stolen, when, and where',
          rw: 'Tanga ibisobanuro birambuye ku kintu cyabiriwe, igihe, n\'aho byabaye'
        }
      },
      {
        stepNumber: 3,
        description: {
          en: 'If you know the suspect, provide their name and any identifying information',
          rw: 'Niba uzi ukekwaho, tanga izina rye n\'amakuru yo kumumenya'
        }
      },
      {
        stepNumber: 4,
        description: {
          en: 'Request a case number for follow-up',
          rw: 'Saba nimero y\'urubanza kugira ngo ukurikirane'
        }
      }
    ],
    requiredEvidence: [
      { en: 'List of stolen items with descriptions', rw: 'Urutonde rw\'ibintu byabiriwe hamwe n\'ibisobanuro' },
      { en: 'Receipts or proof of ownership if available', rw: 'Inyemezabuguzi cyangwa icyemezo cy\'uko ari ibyawe niba bibonetse' },
      { en: 'Witness statements if any', rw: 'Ubuhamya bw\'abahamya niba bariho' },
      { en: 'Photos or videos if available', rw: 'Amafoto cyangwa amashusho niba bibonetse' }
    ],
    whereToReport: {
      en: 'Nearest Police Station or call 112 for emergency',
      rw: 'Ikigo cya Polisi kiri hafi cyangwa uhamagare 112 mu bihe by\'ihutirwa'
    },
    tags: ['theft', 'stolen', 'robbed', 'ubujura', 'ibiriwe', 'property crime']
  },
  {
    crimeType: 'Assault',
    articleNumber: 'Art. 135',
    originalText: {
      en: 'Any person who intentionally wounds, strikes, or commits any other violence or assault against another person shall be liable to imprisonment.',
      rw: 'Umuntu wese ukubita, agutiriza cyangwa akora igikorwa cy\'ubugizi bwa nabi ku wundi ahanishwa igifungo.'
    },
    simplifiedExplanation: {
      en: 'If someone physically attacks you, causes you injury, or threatens you with violence, this is assault and is a punishable crime.',
      rw: 'Niba umuntu agukubise, agutiritse cyangwa akugiriza ubugizi bwa nabi, ibi ni igitero kandi bihanishwa n\'amategeko.'
    },
    reportingSteps: [
      {
        stepNumber: 1,
        description: {
          en: 'Seek medical attention immediately if injured',
          rw: 'Shaka ubufasha bw\'ubuvuzi ako kanya niba wakomeretse'
        }
      },
      {
        stepNumber: 2,
        description: {
          en: 'Go to the police station as soon as possible to file a report',
          rw: 'Jya kuri polisi vuba bishoboka kugira ngo utange raporo'
        }
      },
      {
        stepNumber: 3,
        description: {
          en: 'Provide details about the attacker, time, place, and what happened',
          rw: 'Tanga ibisobanuro ku wagutereye, igihe, aho byabaye, n\'uko byagenze'
        }
      },
      {
        stepNumber: 4,
        description: {
          en: 'Bring medical reports as evidence if you were injured',
          rw: 'Zana raporo y\'ubuvuzi nk\'ikimenyetso niba wakomeretse'
        }
      }
    ],
    requiredEvidence: [
      { en: 'Medical report documenting injuries', rw: 'Raporo y\'ubuvuzi yerekana ibikomere' },
      { en: 'Witness statements', rw: 'Ubuhamya bw\'abahamya' },
      { en: 'Photos of injuries', rw: 'Amafoto y\'ibikomere' },
      { en: 'Any messages or communications from the attacker', rw: 'Ubutumwa cyangwa itumanaho ryaturutse ku wagutereye' }
    ],
    whereToReport: {
      en: 'Nearest Police Station, Hospital, or call 112',
      rw: 'Ikigo cya Polisi kiri hafi, Ibitaro, cyangwa uhamagare 112'
    },
    tags: ['assault', 'attack', 'violence', 'beaten', 'igitero', 'gukubitwa', 'ubugizi bwa nabi']
  },
  {
    crimeType: 'GBV',
    articleNumber: 'Art. 191-194',
    originalText: {
      en: 'Gender-based violence including domestic violence, sexual assault, and psychological abuse is a serious crime punishable under Rwandan law.',
      rw: 'Ihohoterwa rishingiye ku gitsina harimo ihohoterwa rikorerwa mu ngo, gufata ku ngufu, n\'ihohoterwa mu mutwe ni icyaha gikomeye gihanishwa n\'amategeko y\'u Rwanda.'
    },
    simplifiedExplanation: {
      en: 'Gender-Based Violence (GBV) includes physical, sexual, or emotional harm based on gender. This includes domestic violence, rape, forced marriage, and harassment. All forms are illegal and victims have the right to protection and justice.',
      rw: 'Ihohoterwa rishingiye ku gitsina (GBV) ririmo ubugizi bwa nabi ku mubiri, imibonano mpuzabitsina, cyangwa ihohoterwa mu mutwe rishingiye ku gitsina. Ibi birimo ihohoterwa mu rugo, gufata ku nguvu, gushyingirwa ku ngufu, no gutuza. Uburyo bwose burabujijwe kandi abahohotewe bafite uburenganzira bwo kurindwa no kurangwa mu burenganzira.'
    },
    reportingSteps: [
      {
        stepNumber: 1,
        description: {
          en: 'Ensure your safety first - move to a safe location if possible',
          rw: 'Menya ko uri mu mutekano - jya ahantu hatekanye niba bishoboka'
        }
      },
      {
        stepNumber: 2,
        description: {
          en: 'Call the GBV hotline: 3512 (toll-free, 24/7)',
          rw: 'Hamagara terefoni ifasha abahohotewe: 3512 (ku buntu, 24/7)'
        }
      },
      {
        stepNumber: 3,
        description: {
          en: 'Visit the nearest Isange One Stop Center for medical, legal, and psychosocial support',
          rw: 'Sura ikigo cya Isange One Stop Center kiri hafi kugira ngo ubone ubufasha bw\'ubuvuzi, mu by\'amategeko, n\'imyumvire'
        }
      },
      {
        stepNumber: 4,
        description: {
          en: 'File a police report at the Gender Desk or any police station',
          rw: 'Tanga raporo kuri polisi ku biro by\'igitsina cyangwa ikigo cya polisi cyose'
        }
      }
    ],
    requiredEvidence: [
      { en: 'Medical examination report (within 72 hours for sexual assault)', rw: 'Raporo y\'isuzuma ry\'ubuvuzi (mu masaha 72 ku gufatwa ku ngufu)' },
      { en: 'Photos of injuries if any', rw: 'Amafoto y\'ibikomere niba biriho' },
      { en: 'Torn clothing or other physical evidence', rw: 'Imyenda yatanyaguwe cyangwa ibindi bimenyetso bifatika' },
      { en: 'Messages, recordings, or any communication from the perpetrator', rw: 'Ubutumwa, amajwi yafashwe, cyangwa itumanaho ryose ritsindiye ku wakoze icyaha' }
    ],
    whereToReport: {
      en: 'Isange One Stop Center, Police Gender Desk, or call GBV hotline: 3512',
      rw: 'Ikigo cya Isange One Stop Center, Biro by\'igitsina kuri Polisi, cyangwa uhamagare: 3512'
    },
    tags: ['gbv', 'gender violence', 'domestic violence', 'rape', 'sexual assault', 'ihohoterwa', 'ihohoterwa mu ngo', 'gufata ku ngufu']
  }
]

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-legal-aid')
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    await LegalContent.deleteMany({})
    console.log('🗑️  Cleared existing legal content')

    // Insert sample data
    await LegalContent.insertMany(sampleData)
    console.log('✅ Seeded database with sample legal content')

    mongoose.connection.close()
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  }
}

seedDatabase()
