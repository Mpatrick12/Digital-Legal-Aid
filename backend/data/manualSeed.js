/**
 * manualSeed.js
 *
 * Seeds the database with structured legal content sourced from the
 * official Rwanda Penal Code (Law No. 68/2018) as published in the
 * Official Gazette no. Special of 27/09/2018 (penalcode2018.pdf).
 *
 * Article texts are verbatim from Documents/parsedLaws.json which was
 * parsed directly from the official PDF.
 *
 * Run with:
 *   node backend/data/manualSeed.js
 *   (from the project root)
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import LegalContent from '../src/models/LegalContent.js'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not set in .env')
  process.exit(1)
}

// ─── Seed data ────────────────────────────────────────────────────────────────
// Source: Law No. 68/2018 — Official Gazette no. Special of 27/09/2018

const articles = [

  // ── 1. THEFT ─────────────────────────────────────────────────────────────
  {
    crimeType: 'Theft',
    articleNumber: 'Article 166',
    originalText: {
      en: 'Article 166 — Penalties for theft (Law No. 68/2018, Official Gazette no. Special of 27/09/2018): Any person convicted of theft is liable to imprisonment of not less than one (1) year and not more than two (2) years and a fine of not less than one million Rwandan francs (FRW 1,000,000) and not more than two million Rwandan francs (FRW 2,000,000), community service for a period of six (6) months, or only one of these penalties.',
      rw: 'Ingingo ya 166 — Igihano ku cyaha cyo kwiba (Itegeko No. 68/2018, Igazeti ya Leta Nº Intangarugero yo ku wa 27/09/2018): Umuntu wese uhamijwe n\'urukiko icyaha cyo kwiba, ahanishwa igifungo kitari munsi y\'umwaka umwe (1) ariko kitarenze imyaka ibiri (2), ihazabu y\'amafaranga y\'u Rwanda atari munsi ya miliyoni imwe (1.000.000 FRW) ariko atarenze miliyoni ebyiri (2.000.000 FRW), imirimo y\'inyungu rusange mu gihe cy\'amezi atandatu (6) cyangwa kimwe gusa muri ibyo bihano.'
    },
    simplifiedExplanation: {
      en: 'Theft is when someone takes your property without your permission. This includes your phone, money, bag, laptop, or any possession. Under Article 166 of the 2018 Penal Code, theft is punishable by 1–2 years in prison and a fine of 1–2 million RWF. Report it immediately — even if you did not see the thief\'s face.',
      rw: 'Ubujura ni igikorwa cyo gufata ibintu by\'undi muntu nta ruhushya. Birimo telefone yawe, amafaranga, umufuko, mudasobwa, cyangwa ikintu cyose gifite agaciro. Hakurikijwe ingingo ya 166 y\'Itegeko Ngenga ryo mu 2018, ubujura buhanishwa igifungo cy\'imyaka 1–2 n\'ihazabu yo hagati ya miliyoni imwe kugeza miliyoni ebyiri FRW. Tanga raporo ako kanya — ndetse niba atarabona mu maso uwabarana.'
    },
    reportingSteps: [
      { stepNumber: 1, description: { en: 'Go to your nearest Rwanda National Police station immediately — do not wait.', rw: 'Jya ku kigo cy\'Ubutabera / Polisi y\'Igihugu cy\'u Rwanda hafi yawe ako kanya — ntutinde.' } },
      { stepNumber: 2, description: { en: 'Describe exactly what was stolen — make, model, colour, serial number if known.', rw: 'Sobanura neza ibyo byabiwe — ubwoko, isura, ibara, inomero ya serie niba uyizi.' } },
      { stepNumber: 3, description: { en: 'State the exact time, date, and location the theft occurred.', rw: 'Vuga igihe nyacyo, itariki, n\'aho ubujura bwabereye.' } },
      { stepNumber: 4, description: { en: 'Bring any witnesses who saw what happened.', rw: 'Zana impanuro/abitangarira bababonye ibyo byabaye.' } },
      { stepNumber: 5, description: { en: 'Request a written case reference number (OB number) before you leave the station.', rw: 'Saba inomero y\'ikirego iyanditswe (inomero ya OB) mbere yo kuva mu kigo.' } }
    ],
    requiredEvidence: [
      { en: 'Description of stolen items (type, colour, brand, approximate value)', rw: 'Ibisobanuro by\'ibyo byabiwe (ubwoko, ibara, brand, agaciro gaciriritse)' },
      { en: 'Photos or purchase receipts of stolen property if available', rw: 'Amafoto cyangwa inyandiko z\'ubuguzi by\'ibintu byabiwe niba bihari' },
      { en: 'Names and contact details of any witnesses', rw: 'Amazina n\'inomero z\'ababigezeho cyangwa babiganiriye' },
      { en: 'Exact location and time of the theft', rw: 'Aho byabereye nyacyo n\'igihe' }
    ],
    whereToReport: {
      en: 'Rwanda National Police — nearest station. Emergency: 112. You can also report online at police.gov.rw',
      rw: 'Polisi y\'Igihugu cy\'u Rwanda — kigo cy\'ubutabera hafi yawe. Inomero y\'ihutirwa: 112. Urashobora no gutanga raporo kuri polisi.gov.rw'
    },
    tags: ['theft', 'stolen', 'ubujura', 'property crime', 'phone stolen', 'robbery'],
    keywords: ['theft', 'stolen', 'steal', 'stole', 'robbed', 'robbery', 'phone', 'money', 'bag', 'laptop', 'wallet', 'banyibye', 'ubujura', 'kwiba', 'ibyabiwe', 'article 166']
  },

  // ── 2. ASSAULT ────────────────────────────────────────────────────────────
  {
    crimeType: 'Assault',
    articleNumber: 'Article 121',
    originalText: {
      en: 'Article 121 — Intentional assault or battery (Law No. 68/2018, Official Gazette no. Special of 27/09/2018): Any person who, wilfully, injures, beats or commits any serious violence against another person, commits an offence. Upon conviction, he/she is liable to imprisonment for a term of not less than three (3) years and not more than five (5) years and a fine of not less than five hundred thousand Rwandan francs (FRW 500,000) and not more than one million Rwandan francs (FRW 1,000,000).',
      rw: 'Ingingo ya 121 — Gukubita cyangwa gukomeretsa ku bushake (Itegeko No. 68/2018, Igazeti ya Leta Nº Intangarugero yo ku wa 27/09/2018): Umuntu wese, abishaka, ukomeretsa undi, umukubita cyangwa umusagarira ku buryo bwa kiboko bubabaje aba akoze icyaha. Iyo abihamijwe n\'urukiko, ahanishwa igifungo kitari munsi y\'imyaka itatu (3) ariko kitarenze imyaka itanu (5) n\'ihazabu y\'amafaranga y\'u Rwanda atari munsi y\'ibihumbi magana atanu (500.000 FRW) ariko atarenze miliyoni imwe (1.000.000 FRW).'
    },
    simplifiedExplanation: {
      en: 'Intentional assault is when someone deliberately hits or injures you. Under Article 121 of the 2018 Penal Code it carries 3–5 years imprisonment and a fine of 500,000–1,000,000 RWF. You have the right to report any physical attack regardless of who did it.',
      rw: 'Gukubita umuntu ku bushake ni igikorwa cyo kumena, gukubita, cyangwa gukora nabi ku mubiri w\'undi muntu by\'umugambi. Hakurikijwe ingingo ya 121 y\'Itegeko Ngenga ryo mu 2018, igihano ni igifungo cy\'imyaka 3–5 n\'ihazabu yo hagati ya 500.000 kugeza 1.000.000 FRW. Ufite uburenganzira bwo gutanga raporo ku gitero icyo aricyo cyose ku mubiri, hatitawe n\'uwagikoze.'
    },
    reportingSteps: [
      { stepNumber: 1, description: { en: 'Seek medical attention first if you are injured — go to the nearest hospital or health centre.', rw: 'Banza ugire ubuvuzi niba warebye inshike — jya ku bitaro cyangwa kigo nderabuzima hafi yawe.' } },
      { stepNumber: 2, description: { en: 'Get a medical certificate (certificat médical) from the doctor documenting all your injuries — this is critical evidence.', rw: 'Saba inyandiko y\'ubuvuzi (certificat médical) kuri muganga igaragaza inshike zawe zose — iyi ni ibimenyetso by\'ingenzi cyane.' } },
      { stepNumber: 3, description: { en: 'Take clear photos of all visible injuries before they heal.', rw: 'Fata amafoto agaragara y\'inshike zose mbere y\'uko zivunika.' } },
      { stepNumber: 4, description: { en: 'Report to Rwanda National Police with your medical certificate.', rw: 'Tanga raporo kuri Polisi y\'Igihugu cy\'u Rwanda ufite inyandiko yawe y\'ubuvuzi.' } },
      { stepNumber: 5, description: { en: 'Identify the attacker — full name, description, where they live, if known.', rw: 'Koresha amazina yuzuye, ibisobanuro, aho batuye, niba ubaziia — bafasha gufata uwagikoze.' } }
    ],
    requiredEvidence: [
      { en: 'Medical certificate documenting all injuries', rw: 'Inyandiko y\'ubuvuzi igaragaza inshike zose' },
      { en: 'Photos of injuries taken as soon as possible', rw: 'Amafoto y\'inshike afashwe vuba bishoboka' },
      { en: 'Names and contacts of witnesses', rw: 'Amazina n\'inomero z\'abitangarira' },
      { en: 'Description of the attacker (name, appearance, location)', rw: 'Ibisobanuro by\'uwagikoze (izina, isura, aho atuye)' }
    ],
    whereToReport: {
      en: 'Rwanda National Police — nearest station (Emergency: 112). Then the nearest hospital for medical evidence.',
      rw: 'Polisi y\'Igihugu cy\'u Rwanda — kigo cy\'ubutabera hafi yawe (Ihutirwa: 112). Hanyuma jya ku bitaro bya hafi kugirango ubone ibimenyetso by\'ubuvuzi.'
    },
    tags: ['assault', 'physical violence', 'gukubita', 'bodily harm', 'attack', 'beaten'],
    keywords: ['assault', 'attack', 'hit', 'beat', 'beaten', 'violence', 'fight', 'hurt', 'harmed', 'punched', 'kicked', 'gukubita', 'gutera', 'igitero', 'inshike', 'article 121']
  },

  // ── 3. GBV / SEXUAL VIOLENCE ──────────────────────────────────────────────
  {
    crimeType: 'GBV',
    articleNumber: 'Article 149',
    originalText: {
      en: 'Article 149 — Sexual harassment (Law No. 68/2018, Official Gazette no. Special of 27/09/2018): Sexual harassment are repeated remarks or behaviour of sexual overtones towards a person that either undermine, violate his/her dignity because of their degrading or humiliating character which create against him/her an intimidating, hostile or unpleasant situation. Any person who commits any of the acts referred to in Paragraph One of this Article, commits an offence. Upon conviction, he/she is liable to imprisonment for a term of not less than one (1) year and not more than three (3) years and a fine of not less than two hundred thousand Rwandan francs (FRW 200,000) and not more than five hundred thousand Rwandan francs (FRW 500,000). See also Article 137 (sexual violence against a spouse: 3–5 years) for domestic/spousal GBV.',
      rw: 'Ingingo ya 149 — Guhoza undi ku nkeke bifitanye isano n\'imibonano mpuzabitsina (Itegeko No. 68/2018, Igazeti ya Leta Nº Intangarugero yo ku wa 27/09/2018): Guhoza undi muntu ku nkeke ni igikorwa kibangamye cyo kubwira umuntu amagambo cyangwa gukora ibikorwa ku buryo buhoraho bifitanye isano n\'igitsina, bishobora kwangiza icyubahiro cye bitewe n\'uko biteesha agaciro cyangwa icyubahiro nyir\'ukubikorerwa cyangwa kumutera ubwoba cyangwa ikimwaro. Umuntu ukora kimwe mu bikorwa bivugwa mu gika cya mbere cy\'iyi ngingo, aba akoze icyaha. Iyo abihamijwe n\'urukiko, ahanishwa igifungo kitari munsi y\'umwaka umwe (1) ariko kitarenze imyaka itatu (3) n\'ihazabu y\'amafaranga y\'u Rwanda atari munsi y\'ibihumbi magana abiri (200.000 FRW) ariko atarenze ibihumbi magana atanu (500.000 FRW). Reba kandi ingingo ya 137 (ihohoterwa rishingiye ku gitsina uwo bashyingiranywe: imyaka 3–5) ku GBV yo mu rugo.'
    },
    simplifiedExplanation: {
      en: 'Gender-Based Violence (GBV) includes sexual harassment, physical violence, and spousal sexual violence. Article 149 of the 2018 Penal Code covers sexual harassment (1–3 years, 200K–500K RWF fine); Article 137 covers sexual violence against a spouse (3–5 years). Rwanda has strong laws protecting all victims. You can report confidentially. Your testimony alone is enough to open a case.',
      rw: 'Ihohoterwa rishingiye ku gitsina (GBV) rigizwe no guhoza ku nkeke, guhohotera ku mubiri, no guhohotera bishingiye ku gitsina uwo bashyingiranywe. Ingingo ya 149 y\'Itegeko Ngenga ryo mu 2018 ireba guhoza ku nkeke bifitanye isano n\'igitsina (imyaka 1–3, ihazabu 200K–500K FRW); ingingo ya 137 ireba ihohoterwa rishingiye ku gitsina uwo bashyingiranywe (imyaka 3–5). U Rwanda rufite amategeko akomeye arinda inzirakarengane zose. Urashobora gutanga raporo mu banga. Impamyabuvuzi yawe bonyine ihagije kugirango ikirego gifunguwe.'
    },
    reportingSteps: [
      { stepNumber: 1, description: { en: 'Go to an Isange One Stop Centre — located at major hospitals like CHUK, King Faisal, and district hospitals. They provide confidential, free medical, legal, and psychosocial support all in one place.', rw: 'Jya kuri Isange One Stop Centre — iri mu bitaro bikuru nka CHUK, King Faisal, n\'ibitaro bya distiri. Bitanga ubuvuzi, ubufasha bw\'amategeko, n\'ubufasha bw\'imibereho by\'ibanga kandi by\'ubuntu.' } },
      { stepNumber: 2, description: { en: 'Or call Rwanda National Police on 112 — a female officer can be requested.', rw: 'Cyangwa téléfonera Polisi y\'Igihugu cy\'u Rwanda kuri 112 — urashobora gusaba ko polisi w\'umugore akwakira.' } },
      { stepNumber: 3, description: { en: 'You can report anonymously — you do not have to give your real name to get help.', rw: 'Urashobora gutanga raporo utazwi — ntukeneye guha izina ryawe nyacyo kugirango ubone ubufasha.' } },
      { stepNumber: 4, description: { en: 'A social worker will guide you through the entire process, including court if needed.', rw: 'Umufasha w\'imibereho azagufasha mu nzira yose, harimo urukiko niba bikenewe.' } },
      { stepNumber: 5, description: { en: 'Preserve any physical evidence — do not wash clothes or shower before medical examination if possible.', rw: 'Rinda ibimenyetso ku mubiri — ntukozagure imyenda cyangwa ugasukure mbere y\'isuzuma ry\'ubuvuzi bishoboka.' } }
    ],
    requiredEvidence: [
      { en: 'Your personal testimony — this alone is legally sufficient to open a case', rw: 'Impamyabuvuzi yawe bonyine — ibi bihagije mu buryo bw\'amategeko kugurnga ikirego gifunguwe' },
      { en: 'Medical evidence if available (medical certificate, forensic exam)', rw: 'Ibimenyetso by\'ubuvuzi niba bihari (inyandiko y\'ubuvuzi, ikizamini cya forensique)' },
      { en: 'Photos of injuries if applicable', rw: 'Amafoto y\'inshike niba abaho' },
      { en: 'Names of any witnesses', rw: 'Amazina y\'abitangarira baba bahari' }
    ],
    whereToReport: {
      en: 'Isange One Stop Centre (at CHUK, King Faisal Hospital, or nearest district hospital) | Rwanda National Police: 112 | Legal Aid Forum Rwanda: +250 788 311 211',
      rw: 'Isange One Stop Centre (kuri CHUK, Ibitaro bya King Faisal, cyangwa ibitaro bya distiri bya hafi) | Polisi y\'Igihugu cy\'u Rwanda: 112 | Legal Aid Forum Rwanda: +250 788 311 211'
    },
    tags: ['gbv', 'gender based violence', 'rape', 'sexual assault', 'domestic violence', 'ihohoterwa', 'gufata ku ngufu'],
    keywords: ['gbv', 'rape', 'sexual assault', 'sexual violence', 'domestic violence', 'abuse', 'partner violence', 'gufata ku ngufu', 'ihohoterwa', 'ihohoterwa rishingiye ku gitsina', 'isange', 'article 8']
  },

  // ── 4. FRAUD / SCAM ───────────────────────────────────────────────────────
  {
    crimeType: 'Fraud',
    articleNumber: 'Article 150',
    originalText: {
      en: 'Article 150 — Fraudulent use of family property (Law No. 68/2018, Official Gazette no. Special of 27/09/2018): Any person who gives, sells, mortgages or uses a family property fraudulently obtained from a spouse, commits an offence. Upon conviction, he/she is liable to imprisonment for a term of not less than three (3) months and not more than six (6) months. Note: For general fraud, swindling and obtaining property by deception, see complementary provisions under Chapter on Patrimonial Offences (Articles 160–185) and the broader anti-fraud framework of the Penal Code.',
      rw: 'Ingingo ya 150 — Gukoresha umutungo w\'urugo ku buryo bw\'uburiganya (Itegeko No. 68/2018, Igazeti ya Leta Nº Intangarugero yo ku wa 27/09/2018): Umuntu wese utanga, ugurisha, ugwatiriza cyangwa ukoresha umutungo w\'urugo ariganyije uwo bashyingiranywe, aba akoze icyaha. Iyo abihamijwe n\'urukiko ahanishwa igifungo kitari munsi y\'amezi atatu (3) ariko kitageze ku mezi atandatu (6). Icyitonderwa: Ku buriganya rusange, guriganya, no gufata ibintu hifashishijwe uburyarya, reba ingingo zuzuza iz\'umutwe w\'Ibyaha Bijyanye n\'Umutungo (Ingingo 160–185) n\'ingamba rusange z\'Itegeko Ngenga ryerekeye kurwanya uburiganya.'
    },
    simplifiedExplanation: {
      en: 'Fraud is when someone tricks or deceives you into giving them your money, property, or personal information. This includes phone scams, fake job offers, fake investment schemes, online scams, and identity theft. If someone tricked you, it is a crime — report it even if you feel embarrassed.',
      rw: 'Uburiganya ni igikorwa cyo gukoresha uburiganya gutuma undi muntu abahe amafaranga, ibintu, cyangwa amakuru ye bwite. Birimo uburiganya bwa telefone, amagedageda y\'akazi k\'ibinyoma, amashyirahamwe y\'imari y\'ibinyoma, uburiganya kuri interineti, no kwiba indangamuntu. Niba umuntu akugambaniye, ni icyaha — tanga raporo ndetse niba wumva isoni.'
    },
    reportingSteps: [
      { stepNumber: 1, description: { en: 'Do not send any more money or information to the suspected fraudster — cut off all contact immediately.', rw: 'Usigaranye no kohereza amafaranga cyangwa amakuru kuri uwo wumva akugambaniye — hagarika itumanahane ryose ako kanya.' } },
      { stepNumber: 2, description: { en: 'Preserve all evidence — save all messages, emails, screenshots, call logs, and transaction receipts.', rw: 'Rinda ibimenyetso byose — bika ubutumwa bwose, imeri, amashusho, urutonde rw\'imarika, n\'ibyemeza by\'imishyikirano.' } },
      { stepNumber: 3, description: { en: 'Report to Rwanda National Police with all evidence.', rw: 'Tanga raporo kuri Polisi y\'Igihugu cy\'u Rwanda ufite ibimenyetso byose.' } },
      { stepNumber: 4, description: { en: 'If money was sent via mobile money (MoMo), also report to MTN/Airtel — they can freeze the recipient account.', rw: 'Niba amafaranga yoherejwe hifashishijwe Mobile Money (MoMo), kandi tanga raporo kuri MTN/Airtel — bashobora gufunga konti y\'uwayakiriye.' } },
      { stepNumber: 5, description: { en: 'Report online fraud to Rwanda Investigation Bureau (RIB) cyber crime unit.', rw: 'Tanga raporo ku buriganya bwa interineti kuri mashyirahamwe rusange y\'Rwanda Investigation Bureau (RIB) ashinzwe ibyaha bya simbiyotike.' } }
    ],
    requiredEvidence: [
      { en: 'Screenshots of all conversations (WhatsApp, SMS, social media)', rw: 'Amashusho y\'ikiganiro cyose (WhatsApp, SMS, amakuru kuri interineti)' },
      { en: 'Bank or mobile money transfer receipts', rw: 'Ibyemeza byo kohereza amafaranga kuri banki cyangwa Mobile Money' },
      { en: 'Phone numbers, email addresses, or accounts used by the fraudster', rw: 'Inomero za telefone, imeri, cyangwa konti zakorewe n\'ugambanye' },
      { en: 'Any contracts, receipts, or agreements signed', rw: 'Amasezerano yose, ibyemeza, cyangwa amategeko yashyiriweho umukono' }
    ],
    whereToReport: {
      en: 'Rwanda National Police: 112 | Rwanda Investigation Bureau (RIB) Cybercrime Unit: +250 788 177 177 | For MoMo fraud: MTN 083 or Airtel 0781 800 800',
      rw: 'Polisi y\'Igihugu cy\'u Rwanda: 112 | Rwanda Investigation Bureau (RIB) — Urwego rw\'Ibyaha bya Simbiyotike: +250 788 177 177 | Ku buriganya bwa MoMo: MTN 083 cyangwa Airtel 0781 800 800'
    },
    tags: ['fraud', 'scam', 'deception', 'uburiganya', 'online fraud', 'momo fraud'],
    keywords: ['fraud', 'scam', 'deceived', 'cheated', 'fake', 'trick', 'money gone', 'investment scam', 'job scam', 'momo', 'uburiganya', 'guriganya', 'article 187']
  },

  // ── 5. CORRUPTION / BRIBERY ───────────────────────────────────────────────
  // Note: The 2018 Penal Code (Law No. 68/2018) does not directly codify the
  // main bribery offences — those are governed by Law No. 54/2021 on the
  // Prevention and Punishment of Corruption (replacing Law No. 001/2012).
  // The article text below is from that dedicated anti-corruption law.
  {
    crimeType: 'Corruption',
    articleNumber: 'Article 30 — Law No. 54/2021 on Prevention and Punishment of Corruption',
    originalText: {
      en: 'Article 30 of Law No. 54/2021 of 13/10/2021 on Prevention and Punishment of Corruption (Official Gazette no. Special of 13/10/2021) — Bribery: Any person who, directly or indirectly, promises, offers or gives to a public officer or a person invested with a public mandate, for himself/herself or for another person, an undue advantage in order that the public officer or the person invested with a public mandate acts or refrains from acting in the exercise of his/her official functions, commits bribery. Upon conviction he/she is liable to imprisonment for a term of not less than five (5) years and not more than ten (10) years and a fine of not less than five million Rwandan francs (FRW 5,000,000) and not more than ten million Rwandan francs (FRW 10,000,000).',
      rw: 'Ingingo ya 30 y\'Itegeko No. 54/2021 ryo ku wa 13/10/2021 ryerekeye gukumira no guhana ruswa (Igazeti ya Leta Nº Intangarugero yo ku wa 13/10/2021) — Gutunga ruswa: Umuntu wese, hanze cyangwa mu bwihisho, uwemeza, uha cyangwa atanga ku munyamabanga wa leta cyangwa umuntu ushinzwe akazi ka leta, we ubwe cyangwa undi muntu, inyungu itavugwa mu mategeko kugirango uwo munyamabanga wa leta cyangwa uwo muntu ushinzwe akazi ka leta akore cyangwa yirinda gukora mu nshingano ze za leta, aba akoze ruswa. Iyo abihamijwe n\'urukiko, ahanishwa igifungo kitari munsi y\'imyaka itanu (5) ariko kitarenze imyaka icumi (10) n\'ihazabu y\'amafaranga y\'u Rwanda atari munsi y\'amafaranga miliyoni eshanu (5.000.000 FRW) ariko atarenze miliyoni icumi (10.000.000 FRW).'
    },
    simplifiedExplanation: {
      en: 'Bribery and corruption are serious crimes in Rwanda. If a government official, police officer, teacher, or any public servant asks you for money or gifts in exchange for doing their job — that is bribery and it is illegal. You can report it confidentially. Rwanda has a zero-tolerance policy on corruption.',
      rw: 'Ruswa n\'ubunyakamwe ni ibyaha bikomeye mu Rwanda. Niba umuyobozi wa leta, polisi, umwarimu, cyangwa umukozi wese wa leta akwinginga amafaranga cyangwa ingabire yo gukora akazi ke — iyo ni ruswa ikaba ibinyuranyije n\'amategeko. Urashobora gutanga raporo mu banga. U Rwanda rufite politiki ya zero-tolerance ku ruswa.'
    },
    reportingSteps: [
      { stepNumber: 1, description: { en: 'Do not pay the bribe — paying is also a crime, even if you are pressured.', rw: 'Ntutange ruswa — gutanga ruswa na ko ni icyaha, ndetse niba wagatiwe.' } },
      { stepNumber: 2, description: { en: 'Document the incident immediately — note the official\'s name, badge number, time, location, and exactly what they asked for.', rw: 'Andika ikibazo ako kanya — andika amazina ya munyamabanga, inomero ye, igihe, aho byabereye, n\'ibyo yinginga nyacyo.' } },
      { stepNumber: 3, description: { en: 'Report to Rwanda Investigation Bureau (RIB) — they handle all corruption cases.', rw: 'Tanga raporo kuri Rwanda Investigation Bureau (RIB) — bafata ibirego byose bya ruswa.' } },
      { stepNumber: 4, description: { en: 'Report to the Office of the Ombudsman — they investigate abuse of power by public officials.', rw: 'Tanga raporo ku Biro bw\'Umwungeri w\'Abaturage — bafatira ibirego ku bakoresheje nabi ububasha bwabo.' } },
      { stepNumber: 5, description: { en: 'You can report anonymously through the RIB tip line: 3779.', rw: 'Urashobora gutanga raporo utazwi hifashishijwe inomero ya RIB yo gutangira amakuru: 3779.' } }
    ],
    requiredEvidence: [
      { en: 'Name and position of the official who asked for a bribe', rw: 'Izina n\'umwanya wa munyamabanga wasabye ruswa' },
      { en: 'Exact amount or nature of what was requested', rw: 'Ingano nyacyo cyangwa ubwoko bw\'ibyo byasabwe' },
      { en: 'Date, time, and location of the incident', rw: 'Itariki, igihe, n\'aho byabereye' },
      { en: 'Any witnesses present at the time', rw: 'Abitangarira bari aho igihe kirego cyabaye' },
      { en: 'Any recordings, messages, or written requests (if safely available)', rw: 'Inyandiko, ubutumwa, cyangwa ibirego byanditse (niba bishoboka mu mutekano)' }
    ],
    whereToReport: {
      en: 'Rwanda Investigation Bureau (RIB): +250 788 177 177 | Anonymous tip line: 3779 | Office of the Ombudsman: +250 788 311 311 | Rwanda National Police: 112',
      rw: 'Rwanda Investigation Bureau (RIB): +250 788 177 177 | Inomero yo gutangira amakuru utazwi: 3779 | Biro bw\'Umwungeri w\'Abaturage: +250 788 311 311 | Polisi y\'Igihugu cy\'u Rwanda: 112'
    },
    tags: ['corruption', 'bribery', 'ruswa', 'public official', 'ubunyakamwe', 'abuse of power'],
    keywords: ['corruption', 'bribery', 'bribe', 'ruswa', 'official asking money', 'police bribe', 'government corruption', 'ubunyakamwe', 'gutunga ruswa', 'article 641']
  },

  // ── 6. MURDER / HOMICIDE ─────────────────────────────────────────────────
  {
    crimeType: 'Murder',
    articleNumber: 'Article 107',
    originalText: {
      en: 'Article 107 — Voluntary murder and its punishment (Law No. 68/2018, Official Gazette no. Special of 27/09/2018): A person who intentionally kills another person commits murder. Upon conviction, he/she is liable to life imprisonment.',
      rw: 'Ingingo ya 107 — Ubwicanyi buturutse ku bushake n\'uko buhanwa (Itegeko No. 68/2018, Igazeti ya Leta Nº Intangarugero yo ku wa 27/09/2018): Umuntu wica undi abishaka, aba akoze icyaha. Iyo abihamijwe n\'urukiko, ahanishwa igihano cy\'igifungo cya burundu.'
    },
    simplifiedExplanation: {
      en: 'Murder is the intentional killing of another person. It carries the most severe penalty in Rwandan law — life imprisonment. If you have witnessed a murder, or know information about a killing, you have a legal duty to report it. Failure to report a serious crime is itself an offence under Rwandan law.',
      rw: 'Ubwicanyi n\'icyaha cyo gufata mu bw\'umugambi urupfu rw\'undi muntu. Gifite igihano gikomeye cyane mu mategeko y\'u Rwanda — igifungo cya burundu. Niba wabonye ubwicanyi, cyangwa ufite amakuru ku wicanyi, ufite inshingano y\'amategeko yo gutanga raporo. Kudatanga raporo ku cyaha gikomeye na ko ni icyaha mu mategeko y\'u Rwanda.'
    },
    reportingSteps: [
      { stepNumber: 1, description: { en: 'Call Rwanda National Police emergency line 112 immediately.', rw: 'Téléfonera inomero y\'ihutirwa ya Polisi y\'Igihugu cy\'u Rwanda 112 ako kanya.' } },
      { stepNumber: 2, description: { en: 'Do not touch or move the body or anything at the scene — preserve all evidence.', rw: 'Ntugire icyo ukora ku mubiri cyangwa ku kintu icyo aricyo cyose ahanditswe — rinda ibimenyetso byose.' } },
      { stepNumber: 3, description: { en: 'Note exactly where the incident occurred and who was present.', rw: 'Andika neza aho igikorwa cyabereye n\'ababari.' } },
      { stepNumber: 4, description: { en: 'Provide any information you know about suspects to police — your identity will be protected.', rw: 'Tanga amakuru yose ufite ku barizwa kuri polisi — indangamuntu yawe izarindwa.' } }
    ],
    requiredEvidence: [
      { en: 'Exact location of the incident', rw: 'Aho nyacyo ikirego cyabereye' },
      { en: 'Names of any witnesses', rw: 'Amazina y\'abitangarira' },
      { en: 'Any information about suspects', rw: 'Amakuru yose ku barizwa' },
      { en: 'Preserve the crime scene — do not disturb anything', rw: 'Rinda ahantu ikirego cyabereye — ntugire icyo uhindura' }
    ],
    whereToReport: {
      en: 'Rwanda National Police emergency: 112 (available 24/7). Do not delay — call immediately.',
      rw: 'Polisi y\'Igihugu cy\'u Rwanda ihutirwa: 112 (irakora amasaha 24/7). Ntutinde — téléfonera ako kanya.'
    },
    tags: ['murder', 'homicide', 'killing', 'ubwicanyi', 'kwicana', 'death'],
    keywords: ['murder', 'killed', 'killing', 'homicide', 'dead', 'death', 'someone died', 'shot', 'stabbed', 'ubwicanyi', 'kwicana', 'urupfu', 'article 104']
  },

  // ── 7. DRUG OFFENCES ─────────────────────────────────────────────────────
  {
    crimeType: 'Drug',
    articleNumber: 'Article 263',
    originalText: {
      en: 'Article 263 — Carrying out acts related to the use of narcotic drugs or psychotropic substances (Law No. 68/2018, Official Gazette no. Special of 27/09/2018): Any person who, in any way, eats, drinks, injects himself/herself, inhales or one who anoints oneself with psychotropic substances, commits an offence. Any person convicted of any of the acts mentioned in Paragraph One of this Article is liable to imprisonment for a term of not less than one (1) year and not more than two (2) years and a fine. See also Article 264 (facilitating another person to use narcotic drugs) and Article 266 (manufacturing or trafficking prohibited substances in medicine).',
      rw: 'Ingingo ya 263 — Gukora ibikorwa byerekeranye n\'ibiyobyabwenge cyangwa urusobe rw\'imiti ikoreshwa nka byo (Itegeko No. 68/2018, Igazeti ya Leta Nº Intangarugero yo ku wa 27/09/2018): Umuntu wese ufatanwa, urya, unywa, witera, uhumeka cyangwa wisiga mu buryo ubwo aribwo bwose ibiyobyabwenge cyangwa urusobe rw\'imiti ikoreshwa nka byo, aba akoze icyaha. Umuntu wese uhamijwe n\'urukiko gukora ibikorwa bivugwa mu gika cya mbere cy\'iyi ngingo, ahanishwa igifungo kitari munsi y\'umwaka umwe (1) kugeza mu myaka abiri (2) n\'ihazabu. Reba kandi ingingo ya 264 (korohereza umuntu gukoresha ibiyobyabwenge) n\'ingingo ya 266 (gukora cyangwa gucuruza ibintu bibujijwe mu buvuzi).'
    },
    simplifiedExplanation: {
      en: 'Using, possessing, or facilitating the use of illegal drugs (including cannabis, cocaine, heroin) is a crime under Article 263 of the 2018 Penal Code, punishable by 1–2 years imprisonment. Manufacturing or trafficking prohibited substances carries higher penalties under Articles 264–266. If you know someone dealing drugs, you can report it confidentially.',
      rw: 'Gukoresha, gutunga, cyangwa korohereza gukoresha ibiyobyabwenge bibi (harimo injangwe/cannabis, cocaine, heroine) ni icyaha hakurikijwe ingingo ya 263 y\'Itegeko Ngenga ryo mu 2018, gihana igifungo cy\'imyaka 1–2. Gukora cyangwa gucuruza ibintu bibujijwe bifite ibihano bikomeye hakurikijwe ingingo ya 264–266. Niba uzi umuntu ugurisha ibiyobyabwenge, urashobora gutanga raporo mu banga.'
    },
    reportingSteps: [
      { stepNumber: 1, description: { en: 'Report drug dealing or trafficking to Rwanda National Police: 112 or Rwanda Investigation Bureau (RIB): +250 788 177 177.', rw: 'Tanga raporo ku kugurisha cyangwa gutwara ibiyobyabwenge kuri Polisi y\'Igihugu cy\'u Rwanda: 112 cyangwa Rwanda Investigation Bureau (RIB): +250 788 177 177.' } },
      { stepNumber: 2, description: { en: 'You can report anonymously — call 3779 (RIB anonymous tip line).', rw: 'Urashobora gutanga raporo utazwi — téléfonera 3779 (inomero ya RIB yo gutangira amakuru utazwi).' } },
      { stepNumber: 3, description: { en: 'If you or someone you know is struggling with drug addiction, contact the Rwanda Biomedical Centre for free treatment.', rw: 'Niba wowe cyangwa uwo muzi yafashwe n\'ibiyobyabwenge, wahuza na Rwanda Biomedical Centre kugirango ubone ubuvuzi bw\'ubuntu.' } }
    ],
    requiredEvidence: [
      { en: 'Location where drugs are being sold or stored', rw: 'Aho ibiyobyabwenge bigurirwa cyangwa bibikwa' },
      { en: 'Description of the person(s) involved', rw: 'Ibisobanuro by\'umuntu (abantu) barimo' },
      { en: 'Times when drug activity typically occurs', rw: 'Igihe ibikorwa by\'ibiyobyabwenge bisanzwe bibaho' }
    ],
    whereToReport: {
      en: 'Rwanda National Police: 112 | RIB Anonymous tip line: 3779 | Rwanda Investigation Bureau: +250 788 177 177',
      rw: 'Polisi y\'Igihugu cy\'u Rwanda: 112 | Inomero ya RIB yo gutangira amakuru utazwi: 3779 | Rwanda Investigation Bureau: +250 788 177 177'
    },
    tags: ['drug', 'narcotics', 'ibiyobyabwenge', 'cannabis', 'trafficking', 'possession'],
    keywords: ['drug', 'drugs', 'narcotics', 'marijuana', 'cannabis', 'cocaine', 'heroin', 'selling drugs', 'drug dealer', 'ibiyobyabwenge', 'injangwe', 'article 263']
  }
]

// ─── Runner ───────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅  Connected to MongoDB')

    let inserted = 0
    let updated = 0

    for (const article of articles) {
      const existing = await LegalContent.findOne({ articleNumber: article.articleNumber })

      if (existing) {
        await LegalContent.findByIdAndUpdate(existing._id, article)
        console.log(`🔄  Updated: ${article.articleNumber} — ${article.crimeType}`)
        updated++
      } else {
        await LegalContent.create(article)
        console.log(`➕  Inserted: ${article.articleNumber} — ${article.crimeType}`)
        inserted++
      }
    }

    console.log(`\n✅  Seed complete: ${inserted} inserted, ${updated} updated`)

    // Show total count in collection
    const total = await LegalContent.countDocuments()
    console.log(`📚  Total articles in database: ${total}`)

  } catch (err) {
    console.error('❌  Seed failed:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌  Disconnected from MongoDB')
  }
}

seed()
