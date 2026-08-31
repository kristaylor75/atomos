// Translated display names for the Translate panel's target-language list.
// Keyed by target language code, each holding translations per UI language.
export const LANGUAGE_NAMES = {
  en: { en: 'English', es: 'Inglés', fr: 'Anglais', de: 'Englisch', it: 'Inglese', pt: 'Inglês', zh: '英语', ja: '英語', ko: '영어', ar: 'الإنجليزية', hi: 'अंग्रेज़ी', ru: 'Английский' },
  es: { en: 'Spanish', es: 'Español', fr: 'Espagnol', de: 'Spanisch', it: 'Spagnolo', pt: 'Espanhol', zh: '西班牙语', ja: 'スペイン語', ko: '스페인어', ar: 'الإسبانية', hi: 'स्पेनिश', ru: 'Испанский' },
  fr: { en: 'French', es: 'Francés', fr: 'Français', de: 'Französisch', it: 'Francese', pt: 'Francês', zh: '法语', ja: 'フランス語', ko: '프랑스어', ar: 'الفرنسية', hi: 'फ्रेंच', ru: 'Французский' },
  de: { en: 'German', es: 'Alemán', fr: 'Allemand', de: 'Deutsch', it: 'Tedesco', pt: 'Alemão', zh: '德语', ja: 'ドイツ語', ko: '독일어', ar: 'الألمانية', hi: 'जर्मन', ru: 'Немецкий' },
  it: { en: 'Italian', es: 'Italiano', fr: 'Italien', de: 'Italienisch', it: 'Italiano', pt: 'Italiano', zh: '意大利语', ja: 'イタリア語', ko: '이탈리아어', ar: 'الإيطالية', hi: 'इतालवी', ru: 'Итальянский' },
  pt: { en: 'Portuguese', es: 'Portugués', fr: 'Portugais', de: 'Portugiesisch', it: 'Portoghese', pt: 'Português', zh: '葡萄牙语', ja: 'ポルトガル語', ko: '포르투갈어', ar: 'البرتغالية', hi: 'पुर्तगाली', ru: 'Португальский' },
  nl: { en: 'Dutch', es: 'Neerlandés', fr: 'Néerlandais', de: 'Niederländisch', it: 'Olandese', pt: 'Holandês', zh: '荷兰语', ja: 'オランダ語', ko: '네덜란드어', ar: 'الهولندية', hi: 'डच', ru: 'Голландский' },
  ru: { en: 'Russian', es: 'Ruso', fr: 'Russe', de: 'Russisch', it: 'Russo', pt: 'Russo', zh: '俄语', ja: 'ロシア語', ko: '러시아어', ar: 'الروسية', hi: 'रूसी', ru: 'Русский' },
  zh: { en: 'Chinese', es: 'Chino', fr: 'Chinois', de: 'Chinesisch', it: 'Cinese', pt: 'Chinês', zh: '中文', ja: '中国語', ko: '중국어', ar: 'الصينية', hi: 'चीनी', ru: 'Китайский' },
  ja: { en: 'Japanese', es: 'Japonés', fr: 'Japonais', de: 'Japanisch', it: 'Giapponese', pt: 'Japonês', zh: '日语', ja: '日本語', ko: '일본어', ar: 'اليابانية', hi: 'जापानी', ru: 'Японский' },
  ko: { en: 'Korean', es: 'Coreano', fr: 'Coréen', de: 'Koreanisch', it: 'Coreano', pt: 'Coreano', zh: '韩语', ja: '韓国語', ko: '한국어', ar: 'الكورية', hi: 'कोरियाई', ru: 'Корейский' },
  ar: { en: 'Arabic', es: 'Árabe', fr: 'Arabe', de: 'Arabisch', it: 'Arabo', pt: 'Árabe', zh: '阿拉伯语', ja: 'アラビア語', ko: '아랍어', ar: 'العربية', hi: 'अरबी', ru: 'Арабский' },
  hi: { en: 'Hindi', es: 'Hindi', fr: 'Hindi', de: 'Hindi', it: 'Hindi', pt: 'Hindi', zh: '印地语', ja: 'ヒンディー語', ko: '힌디어', ar: 'الهندية', hi: 'हिन्दी', ru: 'Хинди' },
  tr: { en: 'Turkish', es: 'Turco', fr: 'Turc', de: 'Türkisch', it: 'Turco', pt: 'Turco', zh: '土耳其语', ja: 'トルコ語', ko: '터키어', ar: 'التركية', hi: 'तुर्की', ru: 'Турецкий' },
  pl: { en: 'Polish', es: 'Polaco', fr: 'Polonais', de: 'Polnisch', it: 'Polacco', pt: 'Polonês', zh: '波兰语', ja: 'ポーランド語', ko: '폴란드어', ar: 'البولندية', hi: 'पोलिश', ru: 'Польский' },
  sv: { en: 'Swedish', es: 'Sueco', fr: 'Suédois', de: 'Schwedisch', it: 'Svedese', pt: 'Sueco', zh: '瑞典语', ja: 'スウェーデン語', ko: '스웨덴어', ar: 'السويدية', hi: 'स्वीडिश', ru: 'Шведский' },
  he: { en: 'Hebrew', es: 'Hebreo', fr: 'Hébreu', de: 'Hebräisch', it: 'Ebraico', pt: 'Hebraico', zh: '希伯来语', ja: 'ヘブライ語', ko: '히브리어', ar: 'العبرية', hi: 'हिब्रू', ru: 'Иврит' },
};

export function getLanguageName(code, uiLang) {
  const entry = LANGUAGE_NAMES[code];
  if (!entry) return code;
  return entry[uiLang] || entry.en || code;
}