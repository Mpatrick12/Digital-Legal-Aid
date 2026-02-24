/**
 * translations.js
 * Key UI strings in English and Kinyarwanda.
 * Usage: t('dashboard.welcome', language)
 */

const translations = {
  nav: {
    legalAid:        { en: 'Legal Aid',          rw: 'Inkunga y\'Amategeko' },
    gazette:         { en: 'Official Gazette',   rw: 'Igazeti Nkurunziza' },
    adminPortal:     { en: 'Admin Portal',        rw: 'Urubuga rw\'Ubuyobozi' },
    logout:          { en: 'Logout',              rw: 'Sohoka' },
    search:          { en: 'Search',              rw: 'Shakisha' }
  },
  auth: {
    signIn:          { en: 'Sign In',             rw: 'Injira' },
    signUp:          { en: 'Sign Up',             rw: 'Iyandikishe' },
    email:           { en: 'Email',               rw: 'Imeyili' },
    password:        { en: 'Password',            rw: 'Ijambo ry\'ibanga' },
    name:            { en: 'Full Name',           rw: 'Amazina yombi' },
    district:        { en: 'District',            rw: 'Akarere' }
  },
  dashboard: {
    welcome:         { en: 'Welcome back',        rw: 'Murakaza neza' },
    welcomeGreeting: { en: 'Welcome',             rw: 'Murakaza neza' },
    subtitle:        { en: 'Access your personalized legal aid portal', rw: 'Injira mu rubuga rwawe rw\'inkunga z\'amategeko' },
    yourRights:      { en: 'Know Your Rights',    rw: 'Menya Uburenganzira Bwawe' },
    searchPrompt:    { en: 'Search legal information...', rw: 'Shakisha amakuru y\'amategeko...' },
    quickAccess:     { en: 'Quick Access',        rw: 'Injira Vuba' },
    legalAidCard:    { en: 'Legal Aid & Crime Reporting', rw: 'Inkunga y\'Amategeko no Gutanga Ibibazo' },
    legalAidDesc:    { en: 'Find step-by-step guidance for reporting crimes', rw: 'Bona ubuyobozi bw\'intambwe zose zo gutanga ibibazo' },
    gazetteCard:     { en: 'Official Gazette',   rw: 'Igazeti Nkurunziza' },
    gazetteDesc:     { en: 'Search laws and legal documents', rw: 'Shakisha amategeko n\'inyandiko z\'amategeko' },
    notaryCard:      { en: 'Notary Directory',   rw: 'Iciruzeho cya Noteyiri' },
    notaryDesc:      { en: 'Find certified notaries near you', rw: 'Bona noteyiri zemewe hafi yawe' },
    emergencyCard:   { en: 'Emergency Contacts', rw: 'Inomero z\'Ineza Mpuruza' },
    emergencyDesc:   { en: 'Get help immediately', rw: 'Bona ubufasha vuba' },
    recentActivity:  { en: 'Recent Activity',    rw: 'Ibikorwa Byanyuma' },
    noActivity:      { en: 'No recent activity', rw: 'Nta bikorwa byanyuma' },
    accountInfo:     { en: 'Account Information', rw: 'Amakuru y\'Konti' },
    fieldName:       { en: 'Name',               rw: 'Izina' },
    fieldEmail:      { en: 'Email',              rw: 'Imeyili' },
    fieldPhone:      { en: 'Phone',              rw: 'Telefoni' },
    fieldDistrict:   { en: 'District',           rw: 'Akarere' }
  },
  search: {
    placeholder:     { en: 'Describe what happened (e.g. "someone stole my phone")', rw: 'Sobanura icyabaye (urugero: "bamwibiye telefoni")' },
    button:          { en: 'Search',              rw: 'Shakisha' },
    noResults:       { en: 'No results found',    rw: 'Nta makuru yabonetse' },
    results:         { en: 'Results',             rw: 'Ibisubizo' }
  },
  gazette: {
    browse:          { en: 'Browse Gazettes',     rw: 'Reba Igazeti' },
    upload:          { en: 'Upload Gazette',      rw: 'Shyiraho Igazeti' },
    download:        { en: 'Download PDF',        rw: 'Kurura PDF' }
  },
  chat: {
    assistantName:   { en: 'Legal Aid Assistant', rw: 'Umufasha w\'Amategeko' },
    welcome:         { en: "Hello! I'm your Legal Aid Assistant. Tell me what happened and I'll guide you through your rights and next steps.", rw: "Muraho! Ndi Umufasha wawe w'Amategeko. Mbwira icyabaye kandi nzagufasha gusobanukirwa uburenganzira bwawe n'intambwe zikurikira." },
    placeholder:     { en: 'Describe what happened...', rw: 'Sobanura icyabaye...' },
    sources:         { en: 'Legal Sources',       rw: 'Inkomoko y\'Amategeko' },
    disclaimer:      { en: 'Responses based on Rwanda Penal Code. Not legal advice.', rw: 'Ibisubizo bishingiye ku Mategeko y\'u Rwanda. Si inama y\'ubutegetsi.' }
  },
  common: {
    loading:         { en: 'Loading...',          rw: 'Gutegereza...' },
    error:           { en: 'An error occurred',   rw: 'Habaye ikibazo' },
    retry:           { en: 'Try Again',           rw: 'Ongera ugerageze' },
    close:           { en: 'Close',               rw: 'Funga' },
    save:            { en: 'Save',                rw: 'Bika' },
    cancel:          { en: 'Cancel',              rw: 'Reka' }
  }
}

/**
 * Get a translated string.
 * @param {string} key    - dot-notation key e.g. 'nav.logout'
 * @param {string} lang   - 'en' | 'rw'
 * @returns {string}
 */
export function t(key, lang = 'en') {
  const parts = key.split('.')
  let node = translations
  for (const part of parts) {
    if (!node[part]) return key   // fallback to key if not found
    node = node[part]
  }
  return node[lang] || node.en || key
}

export default translations
