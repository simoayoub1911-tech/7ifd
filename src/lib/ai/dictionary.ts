import { LanguageCode } from '../../types';

export interface LexiconEntry {
  term: string;
  lang: LanguageCode;
  translations: Record<LanguageCode, string>;
  phonetic?: string;
  transliteration?: string;
  examples: Record<LanguageCode, string>;
  tags: string[];
}

export const OFFLINE_LEXICON: LexiconEntry[] = [
  {
    term: 'مرحبا',
    lang: 'ar',
    translations: {
      ar: 'مرحبا',
      en: 'Hello',
      fr: 'Bonjour',
      es: 'Hola',
      de: 'Hallo',
      pt: 'Olá',
      'zh-CN': '你好',
      ja: 'こんにちは',
      ko: '안녕하세요',
      th: 'สวัสดี',
      hi: 'नमस्ते',
    },
    phonetic: '/mar.ħa.baː/',
    transliteration: 'Marhaban',
    examples: {
      ar: 'مرحباً، كيف حالك اليوم؟',
      en: 'Hello, how are you today?',
      fr: 'Bonjour, comment allez-vous aujourd’hui ?',
      es: 'Hola, ¿cómo estás hoy?',
      de: 'Hallo, wie geht es dir heute?',
      pt: 'Olá, como você está hoje?',
      'zh-CN': '你好，你今天怎么样？',
      ja: 'こんにちは、今日のご機嫌はいかがですか？',
      ko: '안녕하세요, 오늘 기분이 어떠세요?',
      th: 'สวัสดี วันนี้เป็นอย่างไรบ้าง?',
      hi: 'नमस्ते, आज आप कैसे हैं?',
    },
    tags: ['greeting', 'essential', 'A1'],
  },
  {
    term: 'شكراً',
    lang: 'ar',
    translations: {
      ar: 'شكراً',
      en: 'Thank you',
      fr: 'Merci',
      es: 'Gracias',
      de: 'Danke',
      pt: 'Obrigado',
      'zh-CN': '谢谢',
      ja: 'ありがとう',
      ko: '감사합니다',
      th: 'ขอบคุณ',
      hi: 'धन्यवाद',
    },
    phonetic: '/ʃuk.ran/',
    transliteration: 'Shukran',
    examples: {
      ar: 'شكراً جزيلاً على المساعدة الكريمة.',
      en: 'Thank you very much for your kind help.',
      fr: 'Merci beaucoup pour votre aide précieuse.',
      es: 'Muchas gracias por tu amable ayuda.',
      de: 'Vielen Dank für deine freundliche Hilfe.',
      pt: 'Muito obrigado pela sua gentil ajuda.',
      'zh-CN': '非常感谢您的热心帮助。',
      ja: 'ご親切なお手伝いを本当にありがとうございます。',
      ko: '친절한 도움에 대단히 감사드립니다.',
      th: 'ขอบคุณมากสำหรับความช่วยเหลือของคุณ',
      hi: 'आपकी दयालु सहायता के लिए बहुत-बहुत धन्यवाद।',
    },
    tags: ['etiquette', 'essential', 'A1'],
  },
  {
    term: 'Hello',
    lang: 'en',
    translations: {
      ar: 'مرحبا',
      en: 'Hello',
      fr: 'Bonjour',
      es: 'Hola',
      de: 'Hallo',
      pt: 'Olá',
      'zh-CN': '你好',
      ja: 'こんにちは',
      ko: '안녕하세요',
      th: 'สวัสดี',
      hi: 'नमस्ते',
    },
    phonetic: '/həˈloʊ/',
    examples: {
      en: 'Hello! Pleased to meet you.',
      ar: 'مرحباً! سررت بلقائك.',
      fr: 'Bonjour ! Ravi de vous rencontrer.',
      es: '¡Hola! Encantado de conocerte.',
      de: 'Hallo! Freut mich, dich kennenzulernen.',
      pt: 'Olá! Prazer em conhecê-lo.',
      'zh-CN': '你好！很高兴认识你。',
      ja: 'こんにちは！はじめまして。',
      ko: '안녕하세요! 만나서 반갑습니다.',
      th: 'สวัสดี! ยินดีที่ได้รู้จัก',
      hi: 'नमस्ते! आपसे मिलकर खुशी हुई।',
    },
    tags: ['greeting', 'essential', 'A1'],
  },
  {
    term: 'Book',
    lang: 'en',
    translations: {
      ar: 'كتاب',
      en: 'Book',
      fr: 'Livre',
      es: 'Libro',
      de: 'Buch',
      pt: 'Livro',
      'zh-CN': '书',
      ja: '本',
      ko: '책',
      th: 'หนังสือ',
      hi: 'किताब',
    },
    phonetic: '/bʊk/',
    examples: {
      en: 'I read an interesting book every night before sleeping.',
      ar: 'أقرأ كتاباً ممتعاً كل ليلة قبل النوم.',
      fr: 'Je lis un livre captivant chaque soir avant de dormir.',
      es: 'Leo un libro interesante todas las noches antes de dormir.',
      de: 'Ich lese jeden Abend vor dem Schlafen ein interessantes Buch.',
      pt: 'Eu leio um livro interessante todas as noites antes de dormir.',
      'zh-CN': '我每天晚上睡前都会读一本有趣的书。',
      ja: '毎晩寝る前に面白い本を読みます。',
      ko: '나는 매일 밤 잠들기 전에 재미있는 책을 읽습니다.',
      th: 'ฉันอ่านหนังสือที่น่าสนใจทุกคืนก่อนนอน',
      hi: 'मैं हर रात सोने से पहले एक दिलचस्प किताब पढ़ता हूँ।',
    },
    tags: ['education', 'noun', 'A1'],
  },
  {
    term: 'Water',
    lang: 'en',
    translations: {
      ar: 'ماء',
      en: 'Water',
      fr: 'Eau',
      es: 'Agua',
      de: 'Wasser',
      pt: 'Água',
      'zh-CN': '水',
      ja: '水',
      ko: '물',
      th: 'น้ำ',
      hi: 'पानी',
    },
    phonetic: '/ˈwɔːtər/',
    examples: {
      en: 'Please give me a glass of cold water.',
      ar: 'من فضلك أعطني كوباً من الماء البارد.',
      fr: 'S’il vous plaît, donnez-moi un verre d’eau fraîche.',
      es: 'Por favor, dame un vaso de agua fría.',
      de: 'Bitte gib mir ein Glas kaltes Wasser.',
      pt: 'Por favor, me dê um copo de água fria.',
      'zh-CN': '请给我一杯冷水。',
      ja: '冷たい水を一杯ください。',
      ko: '시원한 물 한 잔 주세요.',
      th: 'ขอน้ำเย็นสักแก้วได้ไหมครับ',
      hi: 'कृपया मुझे एक गिलास ठंडा पानी दीजिए।',
    },
    tags: ['food', 'essential', 'A1'],
  },
  {
    term: 'Friend',
    lang: 'en',
    translations: {
      ar: 'صديق',
      en: 'Friend',
      fr: 'Ami',
      es: 'Amigo',
      de: 'Freund',
      pt: 'Amigo',
      'zh-CN': '朋友',
      ja: '友達',
      ko: '친구',
      th: 'เพื่อน',
      hi: 'दोस्त',
    },
    phonetic: '/frɛnd/',
    examples: {
      en: 'A true friend is a treasure in life.',
      ar: 'الصديق الوفي كنز في هذه الحياة.',
      fr: 'Un véritable ami est un trésor dans la vie.',
      es: 'Un verdadero amigo es un tesoro en la vida.',
      de: 'Ein wahrer Freund ist ein Schatz im Leben.',
      pt: 'Um verdadeiro amigo é um tesouro na vida.',
      'zh-CN': '真正的朋友是生命中的宝藏。',
      ja: '真の友人は人生の宝です。',
      ko: '진정한 친구는 인생의 보물입니다.',
      th: 'เพื่อนแท้คือสมบัติล้ำค่าในชีวิต',
      hi: 'सच्चा दोस्त जीवन का अनमोल खजाना होता है।',
    },
    tags: ['social', 'noun', 'A1'],
  },
  {
    term: 'Beautiful',
    lang: 'en',
    translations: {
      ar: 'جميل',
      en: 'Beautiful',
      fr: 'Beau',
      es: 'Hermoso',
      de: 'Schön',
      pt: 'Bonito',
      'zh-CN': '美丽',
      ja: '美しい',
      ko: '아름다운',
      th: 'สวยงาม',
      hi: 'सुंदर',
    },
    phonetic: '/ˈbjuːtəfəl/',
    examples: {
      en: 'The sunset over the horizon was extraordinarily beautiful.',
      ar: 'كان غروب الشمس في الأفق جميلاً بصورة مذهلة.',
      fr: 'Le coucher de soleil sur l’horizon était extraordinairement beau.',
      es: 'La puesta de sol en el horizonte fue extraordinariamente hermosa.',
      de: 'Der Sonnenuntergang am Horizont war außergewöhnlich schön.',
      pt: 'O pôr do sol no horizonte estava extraordinariamente bonito.',
      'zh-CN': '地平线上的日落美得令人惊叹。',
      ja: '地平線に沈む夕日は格別に美しかった。',
      ko: '지평선 너머로 지는 노을은 매우 아름다웠습니다.',
      th: 'พระอาทิตย์ตกดินที่ขอบฟ้างดงามเป็นพิเศษ',
      hi: 'क्षितिज पर सूर्यास्त असाधारण रूप से सुंदर था।',
    },
    tags: ['adjective', 'descriptive', 'A2'],
  },
  {
    term: 'To learn',
    lang: 'en',
    translations: {
      ar: 'يتعلّم',
      en: 'To learn',
      fr: 'Apprendre',
      es: 'Aprender',
      de: 'Lernen',
      pt: 'Aprender',
      'zh-CN': '学习',
      ja: '学ぶ',
      ko: '배우다',
      th: 'เรียนรู้',
      hi: 'सीखना',
    },
    phonetic: '/tə lɜːrn/',
    examples: {
      en: 'I want to learn a new language with spaced repetition.',
      ar: 'أريد أن أتعلم لغة جديدة بواسطة التكرار المتباعد.',
      fr: 'Je veux apprendre une nouvelle langue avec la répétition espacée.',
      es: 'Quiero aprender un nuevo idioma con repetición espaciada.',
      de: 'Ich möchte mit der Methode der verteilten Wiederholung eine neue Sprache lernen.',
      pt: 'Quero aprender um novo idioma com repetição espaçada.',
      'zh-CN': '我想通过间隔重复法学习一门新语言。',
      ja: '間隔反復法を使って新しい言語を学びたいです。',
      ko: '간격 반복 시스템을 활용해 새로운 언어를 배우고 싶습니다.',
      th: 'ฉันต้องการเรียนภาษาใหม่ด้วยระบบการเว้นระยะทบทวน',
      hi: 'मैं स्पेस्ड रिपीटिशन तकनीक से एक नई भाषा सीखना चाहता हूँ।',
    },
    tags: ['verb', 'education', 'A1'],
  },
  {
    term: 'Hospital',
    lang: 'en',
    translations: {
      ar: 'مستشفى',
      en: 'Hospital',
      fr: 'Hôpital',
      es: 'Hospital',
      de: 'Krankenhaus',
      pt: 'Hospital',
      'zh-CN': '医院',
      ja: '病院',
      ko: '병원',
      th: 'โรงพยาบาล',
      hi: 'अस्पताल',
    },
    phonetic: '/ˈhɒspɪtəl/',
    examples: {
      en: 'Where is the nearest emergency hospital?',
      ar: 'أين يوجد أقرب مستشفى للطوارئ؟',
      fr: 'Où se trouve l’hôpital d’urgence le plus proche ?',
      es: '¿Dónde está el hospital de urgencias más cercano?',
      de: 'Wo befindet sich das nächste Notfallkrankenhaus?',
      pt: 'Onde fica o hospital de emergência mais próximo?',
      'zh-CN': '最近的急诊医院在哪里？',
      ja: '一番近い救急病院はどこですか？',
      ko: '가장 가까운 응급 병원은 어디에 있습니까?',
      th: 'โรงพยาบาลฉุกเฉินที่ใกล้ที่สุดอยู่ที่ไหน?',
      hi: 'निकटतम आपातकालीन अस्पताल कहाँ है?',
    },
    tags: ['health', 'emergency', 'A2'],
  },
  {
    term: 'Train station',
    lang: 'en',
    translations: {
      ar: 'محطة القطار',
      en: 'Train station',
      fr: 'Gare ferroviaire',
      es: 'Estación de tren',
      de: 'Bahnhof',
      pt: 'Estação de trem',
      'zh-CN': '火车站',
      ja: '駅',
      ko: '기차역',
      th: 'สถานีรถไฟ',
      hi: 'रेलवे स्टेशन',
    },
    phonetic: '/treɪn ˈsteɪʃən/',
    examples: {
      en: 'The train to the airport departs from platform 3.',
      ar: 'القطار المتجه إلى المطار ينطلق من الرصيف رقم 3.',
      fr: 'Le train pour l’aéroport part de la voie 3.',
      es: 'El tren al aeropuerto sale del andén 3.',
      de: 'Der Zug zum Flughafen fährt von Gleis 3 ab.',
      pt: 'O trem para o aeroporto sai da plataforma 3.',
      'zh-CN': '去机场的火车从3号站台出发。',
      ja: '空港行きの列車は3番ホームから発車します。',
      ko: '공항행 열차는 3번 플랫폼에서 출발합니다.',
      th: 'รถไฟไปสนามบินออกจากชานชาลาที่ 3',
      hi: 'हवाई अड्डे जाने वाली ट्रेन प्लेटफॉर्म 3 से प्रस्थान करती है।',
    },
    tags: ['travel', 'transport', 'A1'],
  },
];

/**
 * Searches offline lexicon for a query term.
 */
export function searchOfflineDictionary(
  query: string,
  targetLang: LanguageCode,
  nativeLang: LanguageCode = 'en'
): LexiconEntry | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  for (const item of OFFLINE_LEXICON) {
    if (
      item.term.toLowerCase() === q ||
      item.translations[targetLang]?.toLowerCase() === q ||
      item.translations[nativeLang]?.toLowerCase() === q
    ) {
      return item;
    }
  }

  // Substring match
  for (const item of OFFLINE_LEXICON) {
    if (
      item.term.toLowerCase().includes(q) ||
      item.translations[targetLang]?.toLowerCase().includes(q) ||
      item.translations[nativeLang]?.toLowerCase().includes(q)
    ) {
      return item;
    }
  }

  return null;
}
