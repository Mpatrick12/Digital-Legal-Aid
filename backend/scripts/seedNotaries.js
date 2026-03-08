/**
 * Seed script — Rwandan Private Land Notaries
 * SOURCE: National Land Authority (NLA) Rwanda — Official List of Approved Private Land Notaries
 * URL: https://www.lands.rw/fileadmin/user_upload/LANDS/Publications/Archives/Private_land_notaries.pdf
 * Run: node backend/scripts/seedNotaries.js
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Notary from '../src/models/Notary.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const districtProvince = {
  'Gasabo': 'Kigali City', 'Kicukiro': 'Kigali City', 'Nyarugenge': 'Kigali City',
  'Bugesera': 'Eastern Province', 'Gatsibo': 'Eastern Province', 'Kayonza': 'Eastern Province',
  'Kirehe': 'Eastern Province', 'Ngoma': 'Eastern Province', 'Nyagatare': 'Eastern Province',
  'Rwamagana': 'Eastern Province', 'Burera': 'Northern Province', 'Gakenke': 'Northern Province',
  'Gicumbi': 'Northern Province', 'Musanze': 'Northern Province', 'Rulindo': 'Northern Province',
  'Gisagara': 'Southern Province', 'Huye': 'Southern Province', 'Kamonyi': 'Southern Province',
  'Muhanga': 'Southern Province', 'Nyamagabe': 'Southern Province', 'Nyanza': 'Southern Province',
  'Ruhango': 'Southern Province', 'Karongi': 'Western Province', 'Ngororero': 'Western Province',
  'Nyabihu': 'Western Province', 'Nyamasheke': 'Western Province', 'Rubavu': 'Western Province',
  'Rusizi': 'Western Province', 'Rutsiro': 'Western Province',
}

const RAW = [
  { name: 'ABASA Fazili',               phone: '783000612', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'AKAMIKAZI Sifa',             phone: '788863398', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'AMANI Jean de Dieu',         phone: '788662267', district: 'Nyarugenge', sector: 'Kimisagara' },
  { name: "BAGABO Jean D'Amour",        phone: '788481676', district: 'Kicukiro',   sector: 'Gahanga' },
  { name: 'BAGINA SAFARI Theophile',    phone: '788759645', district: 'Nyarugenge', sector: 'Kimisagara' },
  { name: 'BAGOROZI Felix',             phone: '788467243', district: 'Gasabo',     sector: 'Remera' },
  { name: 'BAZIRUWIHA Jean Claude',     phone: '788758620', district: 'Musanze',    sector: 'Muhoza' },
  { name: 'BIGIRINKA Emmanuel',         phone: '783814501', district: 'Musanze',    sector: 'Muhoza' },
  { name: 'BIZIMANA Jean Paul',         phone: '788623697', district: 'Bugesera',   sector: 'Nyamata' },
  { name: 'BUGIRIMFURA Gilbert',        phone: '788894251', district: 'Rubavu',     sector: 'Gisenyi' },
  { name: 'CYIZA Clement',              phone: '788300716', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'FATIKARAMU Jean Pierre',     phone: '788305140', district: 'Kicukiro',   sector: 'Gikondo' },
  { name: 'GAKUNZI David',              phone: '788595826', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'GASANA Jean Baptiste',       phone: '788758635', district: 'Rwamagana',  sector: 'Kigabiro' },
  { name: 'GASENGAYIRE Alice',          phone: '788475654', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'GASHUMBA Nadia',             phone: '788405438', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'GATERA KANISA Evariste',     phone: '788826765', district: 'Kicukiro',   sector: 'Masaka' },
  { name: 'HABIMANA Adolphe',           phone: '788565026', district: 'Kamonyi',    sector: 'Runda' },
  { name: 'HABIYAMBERE Aphrodis',       phone: '788406974', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'HAKIZIMANA Aloys',           phone: '785381936', district: 'Muhanga',    sector: 'Nyamabuye' },
  { name: 'HAKIZIMANA Emile',           phone: '788408618', district: 'Kamonyi',    sector: 'Runda' },
  { name: 'HATEGEKIMANA Gratien',       phone: '788419315', district: 'Nyarugenge', sector: 'Nyamirambo' },
  { name: 'HATEGIKIMANA Valens',        phone: '788606895', district: 'Kicukiro',   sector: 'Kagarama' },
  { name: "HORANIMANA Jeanne d'Arc",    phone: '782596017', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'IMANIRAKIZA Issa Naphtal',   phone: '787913711', district: 'Rubavu',     sector: 'Gisenyi' },
  { name: 'INGABIRE Marie Claire',      phone: '788602164', district: 'Gasabo',     sector: 'Kacyiru' },
  { name: 'IYAMUREMYE Alexis',          phone: '782064980', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'IZERE IRADUKUNDA Germain',   phone: '783061014', district: 'Musanze',    sector: 'Muhoza' },
  { name: 'KABAMI SEMUCYO Marie Claire',phone: '788628094', district: 'Rubavu',     sector: 'Gisenyi' },
  { name: 'KAGORORA RUBASHA Apollinaire',phone:'788518058', district: 'Musanze',    sector: 'Muhoza' },
  { name: 'KAMAYUMUGISHA Pierrette',    phone: '788440601', district: 'Kicukiro',   sector: 'Niboye' },
  { name: 'KAMPIRE Celine',             phone: '788527756', district: 'Nyarugenge', sector: 'Kimisagara' },
  { name: 'KAREGEYA Marie Ange',        phone: '788852750', district: 'Gasabo',     sector: 'Gisozi' },
  { name: 'KAREKEZI Jean',              phone: '783333363', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'KAREMERA Thacien',           phone: '788690186', district: 'Bugesera',   sector: 'Nyamata' },
  { name: 'KAYIJAMAHE Andrew',          phone: '788791299', district: 'Nyagatare',  sector: 'Nyagatare' },
  { name: 'KAYUMBA Gratien',            phone: '788823079', district: 'Gatsibo',    sector: 'Kabarore' },
  { name: 'KIMANUKA John',              phone: '788833951', district: 'Gasabo',     sector: 'Remera' },
  { name: 'MATATA SEGIKWIYE Sylvestre', phone: '788307015', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'MBANGUTSI Jean Claude',      phone: '788711138', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'MPAYIMANA Jean de Dieu',     phone: '782109106', district: 'Nyarugenge', sector: 'Kimisagara' },
  { name: 'MUDAGIRI Alexis',            phone: '788266002', district: 'Bugesera',   sector: 'Nyamata' },
  { name: 'MUDAGIRI Olivier',           phone: '788641393', district: 'Gasabo',     sector: 'Remera' },
  { name: 'MUDENGE Nicole',             phone: '788601495', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'MUGABEKAZI Gloria',          phone: '788680850', district: 'Kicukiro',   sector: 'Kicukiro' },
  { name: 'MUGABO Leandre Martin',      phone: '788768332', district: 'Muhanga',    sector: 'Nyamabuye' },
  { name: 'MUGEMANYI Vedaste',          phone: '788559143', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'MUGIRASE Marie Amabilis',    phone: '788308741', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'MUGWANEZA GATERA Jean Claude',phone:'788487335', district: 'Muhanga',    sector: 'Nyamabuye' },
  { name: 'MUHAWENIMANA Jeanne',        phone: '783469811', district: 'Kicukiro',   sector: 'Kanombe' },
  { name: 'MUHAYIMANA Edison',          phone: '788545947', district: 'Gasabo',     sector: 'Remera' },
  { name: 'MUHIRE RUGUMANYA Etienne',   phone: '788769841', district: 'Gasabo',     sector: 'Rusororo' },
  { name: 'MUHIZI Alexis',              phone: '788533288', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'MUJAWAMALIYA Immaculee',     phone: '788793121', district: 'Nyanza',     sector: 'Busasamana' },
  { name: 'MUJAWAYEZU Anastasie',       phone: '788531394', district: 'Gasabo',     sector: 'Remera' },
  { name: 'MUKAKAMANZI Alphonsine',     phone: '788547904', district: 'Kicukiro',   sector: 'Nyarugunga' },
  { name: 'MUKAMANA Safina',            phone: '788309448', district: 'Nyarugenge', sector: 'Nyamirambo' },
  { name: 'MUKAMPOGAZI Consolee',       phone: '788842932', district: 'Kicukiro',   sector: 'Gahanga' },
  { name: 'MUKAMUKIGA Esperance',       phone: '788432740', district: 'Gasabo',     sector: 'Gisozi' },
  { name: 'MUKANJISHI Joan',            phone: '788432847', district: 'Kicukiro',   sector: 'Kicukiro' },
  { name: 'MUKANSANGA Marguerite',      phone: '788305806', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'MUKASE Marie Chantal',       phone: '788495314', district: 'Gasabo',     sector: 'Kinyinya' },
  { name: 'MUKAYIRANGA Euphrasie',      phone: '788563268', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'MULINZI Jean de Dieu',       phone: '788754609', district: 'Kicukiro',   sector: 'Gatenga' },
  { name: 'MUNINI Patrick',             phone: '788675233', district: 'Bugesera',   sector: 'Nyamata' },
  { name: 'MUNYANEZA Gonzague',         phone: '788646055', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'MUNYANEZA Roger Claude',     phone: '788857117', district: 'Kicukiro',   sector: 'Kicukiro' },
  { name: 'MUNYANGAJU Damascene',       phone: '788306700', district: 'Gasabo',     sector: 'Remera' },
  { name: 'MUNYANKINDI Monique',        phone: '788382535', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'MURAGIJIMANA Emmanuel',      phone: '788306145', district: 'Gasabo',     sector: 'Kacyiru' },
  { name: 'MURENZI Nicolas',            phone: '788428621', district: 'Musanze',    sector: 'Muhoza' },
  { name: 'MUSABYIMANA Aphrodis',       phone: '788409753', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'MUSHIMIRE Evode',            phone: '788548985', district: 'Gasabo',     sector: 'Remera' },
  { name: 'MUTABAZI Simeon',            phone: '788265203', district: 'Gasabo',     sector: 'Gisozi' },
  { name: 'MUTEBUTSI Alexis',           phone: '788809657', district: 'Gasabo',     sector: 'Remera' },
  { name: 'MWIZERWA Annet',             phone: '788494872', district: 'Gasabo',     sector: 'Remera' },
  { name: 'MWIZERWA Marie Grace',       phone: '783897305', district: 'Gasabo',     sector: 'Kacyiru' },
  { name: 'NAHIMANA Jacqueline',        phone: '788589295', district: 'Kicukiro',   sector: 'Kagarama' },
  { name: 'NAYIGIZIKI Joel',            phone: '788545869', district: 'Musanze',    sector: 'Muhoza' },
  { name: 'NDAGIJIMANA Augustin',       phone: '788830007', district: 'Kicukiro',   sector: 'Masaka' },
  { name: 'NDAGIJIMANA Viateur',        phone: '788306978', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'NDAMAGE Ferdinand',          phone: '788414707', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'NDAYIRAGIJE Tharcisse',      phone: '788829444', district: 'Rwamagana',  sector: 'Kigabiro' },
  { name: 'NDAYISABA Fidele',           phone: '788453160', district: 'Nyarugenge', sector: 'Kimisagara' },
  { name: 'NDAYISENGA Maurice',         phone: '788841527', district: 'Huye',       sector: 'Ngoma' },
  { name: 'NDENGEYINGOMA Louise',       phone: '788511559', district: 'Gasabo',     sector: 'Remera' },
  { name: 'NDENGEYINGOMA Marie Yvonne', phone: '788521009', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'NDUWAYO Jean de Dieu',       phone: '788308980', district: 'Ruhango',    sector: 'Ruhango' },
  { name: 'NGENDAHAYO Theogene',        phone: '783593165', district: 'Nyamasheke', sector: 'Kagano' },
  { name: 'NIWEMUHOZA Evode',           phone: '787048646', district: 'Muhanga',    sector: 'Nyamabuye' },
  { name: 'NKINZINGABO Nkunda Alexis',  phone: '783110638', district: 'Kirehe',     sector: 'Kigina' },
  { name: 'NKURIKIYINKA Theobard',      phone: '788771594', district: 'Gasabo',     sector: 'Gisozi' },
  { name: 'NSANGANIYE Emmanuel',        phone: '788608123', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'NSENGIMANA Jean Pierre',     phone: '788845670', district: 'Rwamagana',  sector: 'Muhazi' },
  { name: 'NSENGIMANA SIBOMANA Epaphrodite', phone: '788308201', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'NSHUTI Salim',               phone: '785556612', district: 'Nyarugenge', sector: 'Nyamirambo' },
  { name: 'NTAGANIRA Fidele',           phone: '788734307', district: 'Muhanga',    sector: 'Nyamabuye' },
  { name: 'NTIVUGURUZWA Emmanuel',      phone: '788355363', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'NYIRABAGENI Brigitte',       phone: '788724901', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'NYIRAGICIRO Marie Antoinette',phone:'783616780', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'NYIRAHABIMANA Jacqueline',   phone: '783118532', district: 'Rubavu',     sector: 'Kanama' },
  { name: 'NYIRAMATAMA Bernadette',     phone: '788303815', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'NYIRANGIRIMANA Asterie',     phone: '788758537', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'NYIRANSABIMANA Cecile',      phone: '784000808', district: 'Nyarugenge', sector: 'Kimisagara' },
  { name: 'NYIRINGABO Theoneste',       phone: '788653654', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'NZAGAHIMANA Alexis',         phone: '788689248', district: 'Nyarugenge', sector: 'Kimisagara' },
  { name: 'NZARAMBA AGABA Jean Claude', phone: '788798434', district: 'Nyarugenge', sector: 'Kimisagara' },
  { name: 'NZEYIMANA Lusinga Innocent', phone: '788526075', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'NZIZA Venuste',              phone: '788572925', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'RUDAHARA Eric',              phone: '788568826', district: 'Gasabo',     sector: 'Rusororo' },
  { name: 'RUGAMBAGE Emmanuel',         phone: '788304697', district: 'Kicukiro',   sector: 'Niboye' },
  { name: 'RUGEMINTWAZA Emmanuel',      phone: '788464352', district: 'Gasabo',     sector: 'Remera' },
  { name: 'RUGENERWA Bimira',           phone: '782109424', district: 'Gicumbi',    sector: 'Byumba' },
  { name: 'RURAMIRWA Philippe',         phone: '788876718', district: 'Gasabo',     sector: 'Rusororo' },
  { name: 'RUSANGANWA Jean Claude',     phone: '788898760', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'RUTIKANGA Sixbert',          phone: '788672428', district: 'Nyarugenge', sector: 'Muhima' },
  { name: 'RUZINDANA Fidele',           phone: '788595423', district: 'Musanze',    sector: 'Muhoza' },
  { name: 'RWABUKUMBA Moussa',          phone: '788673699', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'RWISUMBURA UMUTONI Therese', phone: '788798833', district: 'Bugesera',   sector: 'Nyamata' },
  { name: 'SAFARI Jean Claude',         phone: '733497365', district: 'Kicukiro',   sector: 'Kanombe' },
  { name: 'SEBURIKOKO Jeremie',         phone: '783051341', district: 'Nyarugenge', sector: 'Rwezamenyo' },
  { name: 'SERUKIZA GIHINDA James',     phone: '788677097', district: 'Gasabo',     sector: 'Gisozi' },
  { name: 'SHEMA GAKWAVU Gentil Augustin', phone: '788400702', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'SHYIRIBURYO Cyrille',        phone: '788410822', district: 'Huye',       sector: 'Ngoma' },
  { name: 'SIBOMANA Aimable',           phone: '788998668', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'SIBOMANA Jean Baptiste',     phone: '788809198', district: 'Gasabo',     sector: 'Rusororo' },
  { name: 'SIMBIZI Fulgence',           phone: '788415842', district: 'Nyarugenge', sector: 'Nyamirambo' },
  { name: 'TUGIRIMANA Vincent',         phone: '788426570', district: 'Rubavu',     sector: 'Gisenyi' },
  { name: 'TWAGIRAMUNGU KIZITO Theogene', phone: '782372458', district: 'Rusizi',   sector: 'Kamembe' },
  { name: 'TWAJAMAHORO Herman',         phone: '788534833', district: 'Gicumbi',    sector: 'Byumba' },
  { name: 'TWIZEYIMANA Theophile',      phone: '783144305', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'UMUTONI Adeline',            phone: '788461243', district: 'Nyarugenge', sector: 'Nyarugenge' },
  { name: 'UMUTONI Gloriose',           phone: '788307452', district: 'Gasabo',     sector: 'Remera' },
  { name: 'UTAZIRUBANDA GAD',           phone: '788308145', district: 'Gasabo',     sector: 'Remera' },
  { name: 'UWAMAHORO Eugenie',          phone: '788408015', district: 'Nyarugenge', sector: 'Kimisagara' },
  { name: 'UWAMALIYA Jeannette',        phone: '788874872', district: 'Huye',       sector: 'Ngoma' },
  { name: 'UWANTEGE Diana',             phone: '788314930', district: 'Gasabo',     sector: 'Kimironko' },
  { name: 'UWAYO Beatrice',             phone: '788294115', district: 'Rubavu',     sector: 'Gisenyi' },
  { name: 'UWIMANA Channy',             phone: '788408056', district: 'Kicukiro',   sector: 'Kanombe' },
  { name: 'UWIMPAYE Jean De Dieu',      phone: '788848480', district: 'Huye',       sector: 'Ngoma' },
  { name: 'UWITONZE Nasira',            phone: '788565161', district: 'Nyarugenge', sector: 'Rwezamenyo' },
  { name: 'VUGUZIGA Valerie',           phone: '788492858', district: 'Ngoma',      sector: 'Kibungo' },
  { name: 'YANKURIJE Valentine',        phone: '788220384', district: 'Rubavu',     sector: 'Gisenyi' },
]

const NOTARIES = RAW.map(n => ({
  name: n.name,
  firm: `${n.name} — Private Land Notary`,
  province: districtProvince[n.district] || 'Rwanda',
  district: n.district,
  address: `${n.sector} Sector, ${n.district}`,
  phone: `+250${n.phone}`,
  specializations: ['Property', 'Land', 'Civil', 'Succession'],
  languages: ['Kinyarwanda', 'French'],
  workingHours: 'Mon–Fri 8:00–17:00',
  verified: true,
  active: true,
}))

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  await Notary.deleteMany({})
  console.log('Cleared existing notaries')

  const inserted = await Notary.insertMany(NOTARIES)
  console.log(`✓ Seeded ${inserted.length} notaries (NLA official list)`)

  const breakdown = await Notary.aggregate([
    { $group: { _id: '$province', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
  breakdown.forEach(b => console.log(`  ${b._id}: ${b.count}`))

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch(err => { console.error(err); process.exit(1) })
