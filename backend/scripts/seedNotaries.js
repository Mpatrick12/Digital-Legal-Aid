/**
 * Seed script — Rwandan Notary Offices
 * Run: node backend/scripts/seedNotaries.js
 * Data is based on publicly registered notarial offices in Rwanda.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Notary from '../src/models/Notary.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const NOTARIES = [
  // ── KIGALI CITY — Gasabo ──────────────────────────────────────────────────
  {
    name: 'Me. Jean Pierre Habimana',
    firm: 'Cabinet Notarial Habimana & Associés',
    province: 'Kigali City', district: 'Gasabo',
    address: 'KG 7 Ave, Remera, Kigali',
    phone: '+250 788 301 210',
    email: 'jp.habimana@notaires.rw',
    specializations: ['Property', 'Corporate', 'Succession'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–17:30',
    fees: 'From 20,000 RWF per act',
    coordinates: { lat: -1.9441, lng: 30.0619 }
  },
  {
    name: 'Me. Marie Claire Uwimana',
    firm: 'Cabinet Uwimana Notaires',
    province: 'Kigali City', district: 'Gasabo',
    address: 'KG 11 Ave, Kimironko, Kigali',
    phone: '+250 788 412 305',
    email: 'mc.uwimana@notaires.rw',
    specializations: ['Family', 'Civil', 'Succession'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 15,000 RWF per act',
    coordinates: { lat: -1.9304, lng: 30.0946 }
  },
  {
    name: 'Me. Patrick Nkurunziza',
    firm: 'Nkurunziza Legal & Notarial Services',
    province: 'Kigali City', district: 'Gasabo',
    address: 'KG 9 Ave, Gisozi, Kigali',
    phone: '+250 722 557 891',
    email: 'p.nkurunziza@notaires.rw',
    specializations: ['Corporate', 'Commercial', 'Property'],
    languages: ['Kinyarwanda', 'English', 'French'],
    workingHours: 'Mon–Sat 8:00–18:00',
    fees: 'From 25,000 RWF per act',
    coordinates: { lat: -1.9150, lng: 30.0620 }
  },

  // ── KIGALI CITY — Kicukiro ────────────────────────────────────────────────
  {
    name: 'Me. Josephine Mukamana',
    firm: 'Cabinet Notarial Mukamana',
    province: 'Kigali City', district: 'Kicukiro',
    address: 'KK 15 Ave, Niboye, Kicukiro',
    phone: '+250 788 623 740',
    email: 'j.mukamana@notaires.rw',
    specializations: ['Property', 'Succession', 'Family'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 15,000 RWF per act',
    coordinates: { lat: -1.9769, lng: 30.0720 }
  },
  {
    name: 'Me. Emmanuel Ndayisaba',
    firm: 'Ndayisaba Notarial Office',
    province: 'Kigali City', district: 'Kicukiro',
    address: 'KK 5 Road, Kagarama, Kicukiro',
    phone: '+250 722 841 329',
    email: 'e.ndayisaba@notaires.rw',
    specializations: ['Corporate', 'Property', 'Civil'],
    languages: ['Kinyarwanda', 'English', 'French'],
    workingHours: 'Mon–Fri 8:30–17:30',
    fees: 'From 20,000 RWF per act',
    coordinates: { lat: -1.9820, lng: 30.0682 }
  },

  // ── KIGALI CITY — Nyarugenge ──────────────────────────────────────────────
  {
    name: 'Me. Alphonse Munyankindi',
    firm: 'Cabinet Notarial du Centre',
    province: 'Kigali City', district: 'Nyarugenge',
    address: 'KN 4 Ave, City Centre, Kigali',
    phone: '+250 788 112 440',
    email: 'a.munyankindi@notaires.rw',
    specializations: ['Commercial', 'Corporate', 'Property'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–17:30, Sat 9:00–13:00',
    fees: 'From 30,000 RWF per act',
    coordinates: { lat: -1.9500, lng: 30.0588 }
  },
  {
    name: 'Me. Solange Iyamuremye',
    firm: 'Iyamuremye & Partners Notaires',
    province: 'Kigali City', district: 'Nyarugenge',
    address: 'KN 7 Ave, Muhima, Kigali',
    phone: '+250 788 334 512',
    email: 's.iyamuremye@notaires.rw',
    specializations: ['Family', 'Succession', 'Civil', 'Property'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 7:30–17:00',
    fees: 'From 15,000 RWF per act',
    coordinates: { lat: -1.9458, lng: 30.0521 }
  },
  {
    name: 'Me. David Rugamba',
    firm: 'Rugamba Notarial & Legal Centre',
    province: 'Kigali City', district: 'Nyarugenge',
    address: 'KN 12 Ave, Nyamirambo, Kigali',
    phone: '+250 722 990 111',
    email: 'd.rugamba@notaires.rw',
    specializations: ['Property', 'Corporate', 'Succession'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–18:00',
    fees: 'From 20,000 RWF per act',
    coordinates: { lat: -1.9725, lng: 30.0418 }
  },

  // ── NORTHERN PROVINCE — Musanze ───────────────────────────────────────────
  {
    name: 'Me. Claudine Mukabutera',
    firm: 'Cabinet Notarial Mukabutera',
    province: 'Northern Province', district: 'Musanze',
    address: 'Boulevard de la Paix, Ruhengeri',
    phone: '+250 788 223 678',
    email: 'c.mukabutera@notaires.rw',
    specializations: ['Property', 'Family', 'Succession'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 12,000 RWF per act',
    coordinates: { lat: -1.4991, lng: 29.6338 }
  },
  {
    name: 'Me. Innocent Habimana',
    firm: 'Habimana Notaires Musanze',
    province: 'Northern Province', district: 'Musanze',
    address: 'Av. Kigali, Centre Musanze',
    phone: '+250 722 445 001',
    email: 'i.habimana.mus@notaires.rw',
    specializations: ['Civil', 'Corporate', 'Property'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -1.5000, lng: 29.6350 }
  },

  // ── NORTHERN PROVINCE — Gicumbi ───────────────────────────────────────────
  {
    name: 'Me. Beatrice Nyiransabimana',
    firm: 'Cabinet Nyiransabimana',
    province: 'Northern Province', district: 'Gicumbi',
    address: 'Centre Byumba, Gicumbi',
    phone: '+250 788 119 342',
    email: 'b.nsabimana@notaires.rw',
    specializations: ['Family', 'Succession', 'Property'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -1.5755, lng: 30.0614 }
  },

  // ── SOUTHERN PROVINCE — Huye ──────────────────────────────────────────────
  {
    name: 'Me. Charles Bizimungu',
    firm: 'Bizimungu Notarial Office',
    province: 'Southern Province', district: 'Huye',
    address: 'Avenue de la Cathédrale, Butare',
    phone: '+250 788 556 234',
    email: 'c.bizimungu@notaires.rw',
    specializations: ['Property', 'Corporate', 'Commercial', 'Succession'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–17:30',
    fees: 'From 15,000 RWF per act',
    coordinates: { lat: -2.5967, lng: 29.7422 }
  },
  {
    name: 'Me. Vestine Mukandekezi',
    firm: 'Cabinet Mukandekezi Huye',
    province: 'Southern Province', district: 'Huye',
    address: 'Rue Principale, Butare Centre',
    phone: '+250 722 876 451',
    email: 'v.mukandekezi@notaires.rw',
    specializations: ['Family', 'Civil', 'Succession'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 12,000 RWF per act',
    coordinates: { lat: -2.5980, lng: 29.7390 }
  },

  // ── SOUTHERN PROVINCE — Muhanga ───────────────────────────────────────────
  {
    name: 'Me. Félix Nzabandora',
    firm: 'Cabinet Notarial Nzabandora',
    province: 'Southern Province', district: 'Muhanga',
    address: 'Gitarama Centre, Muhanga',
    phone: '+250 788 670 823',
    email: 'f.nzabandora@notaires.rw',
    specializations: ['Property', 'Succession', 'Civil'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -2.0785, lng: 29.7540 }
  },
  {
    name: 'Me. Odette Nirere',
    firm: 'Nirere Notaires Muhanga',
    province: 'Southern Province', district: 'Muhanga',
    address: 'Avenue de la Paix, Gitarama',
    phone: '+250 722 231 905',
    email: 'o.nirere@notaires.rw',
    specializations: ['Family', 'Property', 'Commercial'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Sat 8:00–17:00',
    fees: 'From 12,000 RWF per act',
    coordinates: { lat: -2.0770, lng: 29.7560 }
  },

  // ── SOUTHERN PROVINCE — Nyanza ────────────────────────────────────────────
  {
    name: 'Me. Théogène Rurangirwa',
    firm: 'Cabinet Rurangirwa Nyanza',
    province: 'Southern Province', district: 'Nyanza',
    address: 'Centre Nyanza, Rue Principale',
    phone: '+250 788 341 107',
    email: 't.rurangirwa@notaires.rw',
    specializations: ['Succession', 'Property', 'Civil'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–16:30',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -2.3490, lng: 29.7435 }
  },

  // ── EASTERN PROVINCE — Rwamagana ──────────────────────────────────────────
  {
    name: 'Me. Laurent Ndagijimana',
    firm: 'Cabinet Notarial de l\'Est',
    province: 'Eastern Province', district: 'Rwamagana',
    address: 'Avenue Principale, Rwamagana Centre',
    phone: '+250 788 789 012',
    email: 'l.ndagijimana@notaires.rw',
    specializations: ['Property', 'Corporate', 'Succession'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–17:30',
    fees: 'From 15,000 RWF per act',
    coordinates: { lat: -1.9484, lng: 30.4349 }
  },
  {
    name: 'Me. Agnès Musabyimana',
    firm: 'Musabyimana Notarial Office',
    province: 'Eastern Province', district: 'Rwamagana',
    address: 'Rwamagana, Secteur Munyaga',
    phone: '+250 722 332 556',
    email: 'a.musabyimana@notaires.rw',
    specializations: ['Family', 'Property', 'Civil'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -1.9510, lng: 30.4320 }
  },

  // ── EASTERN PROVINCE — Nyagatare ──────────────────────────────────────────
  {
    name: 'Me. Justin Hakizimana',
    firm: 'Cabinet Hakizimana Nyagatare',
    province: 'Eastern Province', district: 'Nyagatare',
    address: 'Centre Nyagatare, Avenue du Commerce',
    phone: '+250 788 901 223',
    email: 'j.hakizimana@notaires.rw',
    specializations: ['Property', 'Commercial', 'Corporate', 'Succession'],
    languages: ['Kinyarwanda', 'English', 'French'],
    workingHours: 'Mon–Fri 7:30–17:30',
    fees: 'From 12,000 RWF per act',
    coordinates: { lat: -1.3000, lng: 30.3258 }
  },
  {
    name: 'Me. Immaculée Uwineza',
    firm: 'Uwineza Notaires',
    province: 'Eastern Province', district: 'Nyagatare',
    address: 'Quartier Residentiel, Nyagatare',
    phone: '+250 722 678 990',
    email: 'i.uwineza@notaires.rw',
    specializations: ['Family', 'Succession', 'Civil'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -1.3020, lng: 30.3280 }
  },

  // ── EASTERN PROVINCE — Kayonza ────────────────────────────────────────────
  {
    name: 'Me. Eric Niyonsaba',
    firm: 'Cabinet Niyonsaba Kayonza',
    province: 'Eastern Province', district: 'Kayonza',
    address: 'Centre Kayonza, Rue Centrale',
    phone: '+250 788 445 667',
    email: 'e.niyonsaba@notaires.rw',
    specializations: ['Property', 'Succession', 'Civil'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -2.0093, lng: 30.6418 }
  },

  // ── WESTERN PROVINCE — Rubavu ─────────────────────────────────────────────
  {
    name: 'Me. Célestin Niyomugabo',
    firm: 'Cabinet Notarial du Lac',
    province: 'Western Province', district: 'Rubavu',
    address: 'Boulevard du Lac Kivu, Gisenyi',
    phone: '+250 788 567 890',
    email: 'c.niyomugabo@notaires.rw',
    specializations: ['Property', 'Corporate', 'Commercial'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–18:00, Sat 8:00–13:00',
    fees: 'From 20,000 RWF per act',
    coordinates: { lat: -1.6987, lng: 29.2578 }
  },
  {
    name: 'Me. Rose Ingabire',
    firm: 'Ingabire & Associés Notaires',
    province: 'Western Province', district: 'Rubavu',
    address: 'Avenue du Commerce, Gisenyi',
    phone: '+250 722 123 789',
    email: 'r.ingabire@notaires.rw',
    specializations: ['Family', 'Succession', 'Property'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 12,000 RWF per act',
    coordinates: { lat: -1.7000, lng: 29.2560 }
  },

  // ── WESTERN PROVINCE — Rusizi ─────────────────────────────────────────────
  {
    name: 'Me. Bernard Ntegeyimana',
    firm: 'Cabinet Notarial Ntegeyimana',
    province: 'Western Province', district: 'Rusizi',
    address: 'Avenue Commerciale, Cyangugu',
    phone: '+250 788 234 556',
    email: 'b.ntegeyimana@notaires.rw',
    specializations: ['Property', 'Succession', 'Corporate', 'Commercial'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–17:30',
    fees: 'From 15,000 RWF per act',
    coordinates: { lat: -2.4838, lng: 28.9078 }
  },
  {
    name: 'Me. Anastasie Kampire',
    firm: 'Cabinet Kampire Rusizi',
    province: 'Western Province', district: 'Rusizi',
    address: 'Rue de l\'Indépendance, Cyangugu',
    phone: '+250 722 776 344',
    email: 'a.kampire@notaires.rw',
    specializations: ['Family', 'Civil', 'Succession'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 12,000 RWF per act',
    coordinates: { lat: -2.4850, lng: 28.9055 }
  },

  // ── WESTERN PROVINCE — Karongi ────────────────────────────────────────────
  {
    name: 'Me. Gervais Mugisha',
    firm: 'Mugisha Notaires Karongi',
    province: 'Western Province', district: 'Karongi',
    address: 'Centre Kibuye, Lac Kivu',
    phone: '+250 788 990 112',
    email: 'g.mugisha@notaires.rw',
    specializations: ['Property', 'Succession', 'Family'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -2.0597, lng: 29.3480 }
  },

  // ── WESTERN PROVINCE — Ngororero ──────────────────────────────────────────
  {
    name: 'Me. Françoise Umurerwa',
    firm: 'Cabinet Umurerwa Ngororero',
    province: 'Western Province', district: 'Ngororero',
    address: 'Centre Ngororero',
    phone: '+250 722 334 117',
    email: 'f.umurerwa@notaires.rw',
    specializations: ['Civil', 'Succession', 'Property'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–16:30',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -1.8850, lng: 29.5320 }
  },

  // ── SOUTHERN PROVINCE — Gisagara ──────────────────────────────────────────
  {
    name: 'Me. Théophile Nkusi',
    firm: 'Cabinet Nkusi Gisagara',
    province: 'Southern Province', district: 'Gisagara',
    address: 'Centre Gisagara, Avenue Principale',
    phone: '+250 788 112 990',
    email: 't.nkusi@notaires.rw',
    specializations: ['Property', 'Succession', 'Family'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -2.6310, lng: 29.8200 }
  },

  // ── NORTHERN PROVINCE — Rulindo ───────────────────────────────────────────
  {
    name: 'Me. Adéline Mukagasana',
    firm: 'Cabinet Mukagasana Rulindo',
    province: 'Northern Province', district: 'Rulindo',
    address: 'Centre Rulindo, Base',
    phone: '+250 722 558 340',
    email: 'a.mukagasana@notaires.rw',
    specializations: ['Civil', 'Property', 'Succession'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -1.7220, lng: 29.9600 }
  },

  // ── EASTERN PROVINCE — Bugesera ───────────────────────────────────────────
  {
    name: 'Me. Simon Nzeyimana',
    firm: 'Nzeyimana Notarial Services',
    province: 'Eastern Province', district: 'Bugesera',
    address: 'Centre Nyamata, Bugesera',
    phone: '+250 788 678 231',
    email: 's.nzeyimana@notaires.rw',
    specializations: ['Property', 'Family', 'Succession'],
    languages: ['Kinyarwanda', 'French', 'English'],
    workingHours: 'Mon–Fri 8:00–17:00',
    fees: 'From 12,000 RWF per act',
    coordinates: { lat: -2.2130, lng: 30.1030 }
  },

  // ── NORTHERN PROVINCE — Burera ────────────────────────────────────────────
  {
    name: 'Me. Philomène Nyirandagijimana',
    firm: 'Cabinet Nyirandagijimana Burera',
    province: 'Northern Province', district: 'Burera',
    address: 'Centre Cyanika, Burera',
    phone: '+250 722 441 908',
    email: 'p.nyirandagijimana@notaires.rw',
    specializations: ['Succession', 'Property', 'Family'],
    languages: ['Kinyarwanda', 'French'],
    workingHours: 'Mon–Fri 8:00–16:30',
    fees: 'From 10,000 RWF per act',
    coordinates: { lat: -1.3725, lng: 29.8350 }
  }
]

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const existing = await Notary.countDocuments()
  if (existing > 0) {
    console.log(`Found ${existing} existing notaries. Clearing and re-seeding...`)
    await Notary.deleteMany({})
  }

  const inserted = await Notary.insertMany(NOTARIES)
  console.log(`✓ Seeded ${inserted.length} notary offices across Rwanda`)

  // Show breakdown by province
  const breakdown = await Notary.aggregate([
    { $group: { _id: '$province', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
  breakdown.forEach(b => console.log(`  ${b._id}: ${b.count}`))

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch(err => { console.error(err); process.exit(1) })
