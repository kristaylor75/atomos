// ── Placeholder / Mockup Data ──────────────────────────────────────────────

const LOREM_WORDS = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit','voluptate','velit','esse','cillum','eu','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','culpa','qui','officia','deserunt','mollit','anim','id','est','laborum'];

export function generateLorem(sentences = 3) {
  const result = [];
  for (let i = 0; i < sentences; i++) {
    const len = 8 + Math.floor(Math.random() * 10);
    const words = Array.from({ length: len }, () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    result.push(words.join(' ') + '.');
  }
  return result.join(' ');
}

const NAMES_BY_LANG = {
  en: { first: ['James','Emma','Liam','Olivia','Noah','Sophia','Ethan','Ava','Mason','Isabella','Lucas','Mia','Logan','Charlotte','Jackson','Amelia','Aiden','Harper','Sebastian','Evelyn'], last: ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Martinez','Anderson','Taylor','Thomas','Moore','Jackson','Martin','Lee','Perez','Thompson','White'] },
  es: { first: ['Carlos','María','José','Ana','Luis','Carmen','Juan','Isabel','Pedro','Rosa','Miguel','Elena','Antonio','Sofía','Diego','Valentina','Alejandro','Lucia','Fernando','Camila'], last: ['García','Rodríguez','Martínez','López','González','Pérez','Sánchez','Ramírez','Torres','Flores','Rivera','Gómez','Díaz','Reyes','Morales','Cruz','Ortega','Herrera','Mendoza','Vargas'] },
  fr: { first: ['Pierre','Marie','Jean','Sophie','Louis','Camille','Thomas','Léa','Nicolas','Emma','Antoine','Inès','François','Clara','Alexandre','Lucie','Maxime','Chloé','Hugo','Manon'], last: ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Garcia','David','Bertrand','Roux','Vincent','Fournier'] },
  de: { first: ['Hans','Anna','Klaus','Monika','Peter','Sabine','Michael','Ursula','Thomas','Petra','Andreas','Claudia','Stefan','Heike','Christian','Andrea','Martin','Susanne','Frank','Julia'], last: ['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann','Schäfer','Koch','Bauer','Richter','Klein','Wolf','Schröder','Neumann','Schwarz','Zimmermann'] },
  it: { first: ['Marco','Maria','Luca','Anna','Matteo','Giulia','Andrea','Elena','Davide','Chiara','Lorenzo','Francesca','Stefano','Laura','Francesco','Sara','Simone','Martina','Alessandro','Valentina'], last: ['Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco','Bruno','Gallo','Conti','De Luca','Costa','Mancini','Leone','Fontana','Caruso','Rizzo'] },
  pt: { first: ['João','Ana','Pedro','Maria','Carlos','Sofia','Luis','Rita','Paulo','Beatriz','António','Inês','Miguel','Catarina','Rafael','Margarida','Tiago','Leonor','Diogo','Francisca'], last: ['Silva','Santos','Ferreira','Pereira','Oliveira','Costa','Rodrigues','Martins','Jesus','Sousa','Fernandes','Gonçalves','Gomes','Lopes','Marques','Alves','Almeida','Ribeiro','Pinto','Carvalho'] },
  zh: { first: ['伟','芳','娜','秀英','敏','静','丽','强','磊','军','洋','勇','艳','杰','娟','涛','明','超','秀兰','霞'], last: ['王','李','张','刘','陈','杨','赵','黄','周','吴','徐','孙','胡','朱','高','林','何','郭','马','罗'] },
  ja: { first: ['太郎','花子','次郎','美咲','健太','愛','翔','さくら','拓也','明日香','大輔','優','裕樹','舞','颯太','結衣','蓮','凛','陸','葵'], last: ['田中','鈴木','佐藤','山本','高橋','伊藤','渡辺','中村','小林','加藤','吉田','山田','石川','松本','井上','木村','坂本','清水','斎藤','林'] },
  ko: { first: ['민준','서연','서준','지아','예준','지우','도현','채원','시우','수아','주원','하은','지후','윤서','지호','서현','현우','지민','준서','채은'], last: ['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','류','전'] },
  ar: { first: ['محمد','فاطمة','أحمد','عائشة','علي','مريم','عمر','زينب','إبراهيم','سارة','خالد','هند','يوسف','نور','عبدالله','رنا','حسن','ليلى','حمزة','دينا'], last: ['العلي','الحسن','المحمد','الأحمد','الخالد','العمر','الصالح','الراشد','المنصور','الفهد','الزيد','الغامدي','الشمري','العتيبي','الدوسري','القحطاني','الحربي','العنزي','الرشيدي','المطيري'] },
  hi: { first: ['राहुल','प्रिया','अमित','सुनीता','विकास','अनिता','संजय','पूजा','रोहित','दीपिका','मनोज','रेखा','अजय','ममता','सुरेश','कविता','नरेश','गीता','रमेश','लता'], last: ['शर्मा','वर्मा','गुप्ता','सिंह','यादव','मिश्रा','पांडे','तिवारी','चौधरी','राव','पटेल','जोशी','त्रिपाठी','श्रीवास्तव','दुबे','कुमार','मेहता','अग्रवाल','चौहान','जैन'] },
  ru: { first: ['Александр','Мария','Дмитрий','Анна','Иван','Елена','Сергей','Ольга','Андрей','Наталья','Алексей','Татьяна','Николай','Светлана','Михаил','Ирина','Павел','Людмила','Роман','Юлия'], last: ['Иванов','Смирнов','Кузнецов','Попов','Васильев','Петров','Соколов','Михайлов','Новиков','Фёдоров','Морозов','Волков','Алексеев','Лебедев','Семёнов','Егоров','Павлов','Козлов','Степанов','Николаев'] },
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getNamesForLang(lang) { return NAMES_BY_LANG[lang] || NAMES_BY_LANG.en; }

export function generateName(lang = 'en') {
  const { first, last } = getNamesForLang(lang);
  const f = pick(first), l = pick(last);
  // CJK/Arabic/Hindi languages: family name first
  if (['zh','ja','ko','ar','hi'].includes(lang)) return `${l}${['zh','ja','ko'].includes(lang) ? '' : ' '}${f}`;
  return `${f} ${l}`;
}

const EMAIL_DOMAINS = ['gmail.com','yahoo.com','hotmail.com','outlook.com','example.com','testmail.io','devtest.org','mockmail.net','placeholder.dev','fakemail.com'];

export function generateEmail(lang = 'en') {
  const name = generateName(lang).toLowerCase().replace(/\s+/g, Math.random() > 0.5 ? '.' : '_').replace(/[^\x00-\x7F]/g, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))) + Math.floor(Math.random() * 999);
  return `${name}@${EMAIL_DOMAINS[Math.floor(Math.random() * EMAIL_DOMAINS.length)]}`;
}

const ADDRESS_DATA = {
  en: { streets: ['Main St','Oak Ave','Maple Dr','Cedar Ln','Pine Rd','Elm St','Birch Blvd','Park Ave','River Rd','Sunset Blvd'], cities: ['Springfield','Riverdale','Fairview','Madison','Franklin','Greenville','Bristol','Manchester','Salem','Arlington'], regions: ['CA','TX','NY','FL','IL','PA','OH','GA','NC','MI'], fmt: (n,s,c,r,z) => `${n} ${s}, ${c}, ${r} ${z}`, zip: () => String(10000 + Math.floor(Math.random() * 89999)) },
  es: { streets: ['Calle Mayor','Avenida Principal','Paseo del Prado','Calle Real','Gran Vía','Calle Nueva','Avenida de la Paz','Plaza Mayor','Calle del Sol','Camino Real'], cities: ['Madrid','Barcelona','Sevilla','Valencia','Bilbao','Málaga','Zaragoza','Murcia','Palma','Valladolid'], regions: ['Madrid','Cataluña','Andalucía','Valencia','País Vasco','Galicia','Castilla','Aragón','Canarias','Asturias'], fmt: (n,s,c,r,z) => `${s} ${n}, ${c}, ${r}, ${z}`, zip: () => String(10000 + Math.floor(Math.random() * 89999)) },
  fr: { streets: ['Rue de la Paix','Avenue des Champs','Boulevard Haussmann','Rue du Commerce','Avenue Victor Hugo','Rue Saint-Denis','Boulevard Voltaire','Rue de Rivoli','Avenue Foch','Rue Lafayette'], cities: ['Paris','Lyon','Marseille','Toulouse','Nice','Nantes','Strasbourg','Montpellier','Bordeaux','Rennes'], regions: ['Île-de-France','Auvergne','Provence','Occitanie','Normandie','Bretagne','Alsace','Aquitaine','Bourgogne','Loire'], fmt: (n,s,c,r,z) => `${n} ${s}, ${z} ${c}, ${r}`, zip: () => String(10000 + Math.floor(Math.random() * 89999)) },
  de: { streets: ['Hauptstraße','Bahnhofstraße','Gartenweg','Bergstraße','Schulstraße','Kirchgasse','Lindenallee','Rosenweg','Mozartstraße','Beethovenplatz'], cities: ['Berlin','Hamburg','München','Köln','Frankfurt','Stuttgart','Düsseldorf','Leipzig','Dresden','Hannover'], regions: ['Bayern','NRW','Baden-Württemberg','Hessen','Sachsen','Berlin','Niedersachsen','Brandenburg','Thüringen','Sachsen-Anhalt'], fmt: (n,s,c,r,z) => `${s} ${n}, ${z} ${c}, ${r}`, zip: () => String(10000 + Math.floor(Math.random() * 89999)) },
  it: { streets: ['Via Roma','Corso Italia','Piazza Garibaldi','Via Mazzini','Viale Libertà','Via Dante','Corso Umberto','Via Nazionale','Via del Corso','Piazza Navona'], cities: ['Roma','Milano','Napoli','Torino','Palermo','Genova','Bologna','Firenze','Bari','Catania'], regions: ['Lazio','Lombardia','Campania','Piemonte','Sicilia','Veneto','Emilia-Romagna','Toscana','Puglia','Sardegna'], fmt: (n,s,c,r,z) => `${s} ${n}, ${z} ${c} (${r})`, zip: () => String(10000 + Math.floor(Math.random() * 89999)) },
  pt: { streets: ['Rua Augusta','Avenida da Liberdade','Rua do Ouro','Avenida Brasil','Rua do Carmo','Largo do Chiado','Rua Garrett','Avenida Almirante','Rua da Prata','Praça do Comércio'], cities: ['Lisboa','Porto','Braga','Coimbra','Aveiro','Faro','Setúbal','Évora','Leiria','Funchal'], regions: ['Lisboa','Porto','Braga','Coimbra','Aveiro','Algarve','Setúbal','Alentejo','Minho','Madeira'], fmt: (n,s,c,r,z) => `${s} ${n}, ${z} ${c}, ${r}`, zip: () => `${1000 + Math.floor(Math.random() * 9000)}-${100 + Math.floor(Math.random() * 900)}` },
  zh: { streets: ['中山路','人民路','解放路','建设路','和平路','新华路','长安街','南京路','北京路','光明路'], cities: ['北京','上海','广州','深圳','成都','重庆','武汉','西安','杭州','南京'], regions: ['北京市','上海市','广东省','四川省','重庆市','湖北省','陕西省','浙江省','江苏省','山东省'], fmt: (n,s,c,r,z) => `${r}${c}市${s}${n}号，邮编${z}`, zip: () => String(100000 + Math.floor(Math.random() * 899999)) },
  ja: { streets: ['中央通り','駅前通り','本町通り','大通り','銀座通り','平和通り','緑町','東通り','西通り','南通り'], cities: ['東京','大阪','名古屋','札幌','福岡','神戸','京都','広島','仙台','横浜'], regions: ['東京都','大阪府','愛知県','北海道','福岡県','兵庫県','京都府','広島県','宮城県','神奈川県'], fmt: (n,s,c,r,z) => `〒${z} ${r}${c}市${s}${n}番地`, zip: () => `${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}` },
  ko: { streets: ['중앙로','역전로','본로','대로','평화로','녹지로','동로','서로','남로','북로'], cities: ['서울','부산','인천','대구','광주','대전','울산','수원','고양','성남'], regions: ['서울특별시','부산광역시','경기도','인천광역시','대구광역시','광주광역시','대전광역시','울산광역시','강원도','충청도'], fmt: (n,s,c,r,z) => `${r} ${c}시 ${s} ${n}, (${z})`, zip: () => String(10000 + Math.floor(Math.random() * 89999)) },
  ar: { streets: ['شارع الملك','شارع الأمير','شارع التحرير','شارع النيل','شارع الجمهورية','شارع السلام','شارع الوحدة','شارع الاستقلال','شارع الثورة','شارع العروبة'], cities: ['الرياض','جدة','دبي','القاهرة','بغداد','بيروت','دمشق','عمّان','الكويت','المنامة'], regions: ['الرياض','مكة المكرمة','المدينة المنورة','القاهرة','دبي','بغداد','بيروت','دمشق','عمّان','الكويت'], fmt: (n,s,c,r,z) => `${r}، ${c}، ${s} رقم ${n}، ص.ب. ${z}`, zip: () => String(10000 + Math.floor(Math.random() * 89999)) },
  hi: { streets: ['महात्मा गांधी मार्ग','नेहरू नगर','राजपथ','सुभाष मार्ग','विजय नगर','शास्त्री नगर','लक्ष्मी नगर','इंदिरा नगर','पटेल नगर','आजाद नगर'], cities: ['दिल्ली','मुंबई','कोलकाता','चेन्नई','बेंगलुरु','हैदराबाद','पुणे','जयपुर','लखनऊ','अहमदाबाद'], regions: ['दिल्ली','महाराष्ट्र','पश्चिम बंगाल','तमिल नाडु','कर्नाटक','तेलंगाना','राजस्थान','उत्तर प्रदेश','गुजरात','मध्य प्रदेश'], fmt: (n,s,c,r,z) => `${n}, ${s}, ${c}, ${r} - ${z}`, zip: () => String(100000 + Math.floor(Math.random() * 899999)) },
  ru: { streets: ['ул. Ленина','пр. Мира','ул. Пушкина','Московский проспект','ул. Гагарина','пр. Победы','ул. Советская','Красный проспект','ул. Кирова','ул. Октябрьская'], cities: ['Москва','Санкт-Петербург','Новосибирск','Екатеринбург','Казань','Нижний Новгород','Самара','Омск','Ростов-на-Дону','Уфа'], regions: ['Московская обл.','Ленинградская обл.','Новосибирская обл.','Свердловская обл.','Республика Татарстан','Нижегородская обл.','Самарская обл.','Омская обл.','Ростовская обл.','Республика Башкортостан'], fmt: (n,s,c,r,z) => `${c}, ${s}, д. ${n}, ${r}, ${z}`, zip: () => String(100000 + Math.floor(Math.random() * 899999)) },
};

export function generateAddress(lang = 'en') {
  const d = ADDRESS_DATA[lang] || ADDRESS_DATA.en;
  const n = 1 + Math.floor(Math.random() * 200);
  return d.fmt(n, pick(d.streets), pick(d.cities), pick(d.regions), d.zip());
}

export function generateDate(start = new Date(1970, 0, 1), end = new Date()) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

export function generateImageUrl(width = 300, height = 200) {
  return `https://placehold.co/${width}x${height}`;
}

const BIZ_BY_LANG = {
  en: { pre: ['Alpha','Beta','Nova','Prime','Apex','Nexus','Core','Bright','Blue','Peak','Vertex','Zenith','Vantage','Summit','Stellar','Horizon','Quantum','Pioneer','Catalyst','Fusion'], suf: ['Tech','Solutions','Group','Partners','Labs','Innovations','Digital','Systems','Dynamics','Ventures','Works','Strategies','Consulting','Services','Media','Hub','Design','Analytics','Industries','Global'] },
  es: { pre: ['Nova','Global','Ágil','Nexo','Cumbre','Estrella','Alfa','Prisma','Vértice','Pulso','Alianza','Visión','Ímpetu','Clave','Arco'], suf: ['Soluciones','Tecnología','Grupo','Servicios','Consultoría','Digital','Sistemas','Innovaciones','Asociados','Medios','Diseño','Estrategias','Industrias','Ventures','Red'] },
  fr: { pre: ['Nova','Apex','Horizon','Lumière','Élan','Sommet','Nexus','Aurore','Vecteur','Prisme','Alliance','Vision','Impulsion','Clé','Arc'], suf: ['Solutions','Technologie','Groupe','Services','Conseil','Numérique','Systèmes','Innovations','Associés','Médias','Design','Stratégies','Industries','Ventures','Réseau'] },
  de: { pre: ['Nova','Apex','Gipfel','Licht','Schwung','Nexus','Aurora','Vektor','Prisma','Allianz','Vision','Impuls','Schlüssel','Bogen','Stern'], suf: ['Lösungen','Technologie','Gruppe','Dienste','Beratung','Digital','Systeme','Innovationen','Partner','Medien','Design','Strategien','Industrien','Ventures','Netzwerk'] },
  it: { pre: ['Nova','Apice','Orizzonte','Luce','Slancio','Vertice','Aurora','Vettore','Prisma','Alleanza','Visione','Impulso','Chiave','Arco','Stella'], suf: ['Soluzioni','Tecnologia','Gruppo','Servizi','Consulenza','Digitale','Sistemi','Innovazioni','Associati','Media','Design','Strategie','Industrie','Ventures','Rete'] },
  pt: { pre: ['Nova','Ápice','Horizonte','Luz','Ímpeto','Nexo','Vértice','Aurora','Vetor','Prisma','Aliança','Visão','Impulso','Chave','Arco'], suf: ['Soluções','Tecnologia','Grupo','Serviços','Consultoria','Digital','Sistemas','Inovações','Associados','Mídia','Design','Estratégias','Indústrias','Ventures','Rede'] },
  zh: { pre: ['新','博','宏','聚','创','智','达','云','远','恒','盛','联','鑫','华','泰'], suf: ['科技','解决方案','集团','服务','咨询','数字','系统','创新','合伙人','媒体','设计','战略','工业','投资','网络'] },
  ja: { pre: ['新','博','宏','聚','創','智','達','雲','遠','恒','盛','聯','鑫','華','泰'], suf: ['テクノロジー','ソリューションズ','グループ','サービス','コンサルティング','デジタル','システムズ','イノベーション','パートナーズ','メディア','デザイン','ストラテジー','インダストリーズ','ベンチャーズ','ネットワーク'] },
  ko: { pre: ['노바','에이펙스','넥서스','글로벌','스타','코어','퓨전','비전','정상','지평'], suf: ['테크','솔루션','그룹','서비스','컨설팅','디지털','시스템','이노베이션','파트너스','미디어'] },
  ar: { pre: ['نوفا','القمة','النجم','الأفق','النبض','الرؤية','التحالف','الإبداع','الريادة','الطموح'], suf: ['للتقنية','للحلول','للمجموعة','للخدمات','للاستشارات','الرقمية','للأنظمة','للابتكار','للشركاء','للإعلام'] },
  hi: { pre: ['नोवा','शिखर','क्षितिज','प्रकाश','वेग','दृष्टि','गठबंधन','सृजन','नेतृत्व','महत्वाकांक्षा'], suf: ['टेक','समाधान','समूह','सेवाएं','परामर्श','डिजिटल','सिस्टम','इनोवेशन','साझेदार','मीडिया'] },
  ru: { pre: ['Нова','Апекс','Горизонт','Свет','Импульс','Вектор','Призма','Альянс','Видение','Зенит','Вершина','Нексус','Аврора','Звезда','Ключ'], suf: ['Технологии','Решения','Группа','Сервисы','Консалтинг','Диджитал','Системы','Инновации','Партнёры','Медиа','Дизайн','Стратегии','Индустрии','Венчурс','Сеть'] },
};

export function generateBusinessName(lang = 'en') {
  const d = BIZ_BY_LANG[lang] || BIZ_BY_LANG.en;
  return `${pick(d.pre)} ${pick(d.suf)}`;
}

// ── Security / Keys ────────────────────────────────────────────────────────

const WORDLISTS = {
  en: ['apple','bridge','cloud','dragon','eagle','forest','garden','harbor','island','jungle','knight','lantern','marble','needle','ocean','puzzle','quartz','rocket','silver','thunder','umbrella','valley','window','xenon','yellow','zebra','amber','basket','candle','desert','ember','falcon','glass','honey','iron','jasper','kettle','lemon','mirror','north','orbit','petal','quill','river','stone','tower','ultra','violet','walnut','yarn','zephyr'],
  es: ['ábaco','brisa','campo','danza','época','finca','globo','helio','isla','jungla','karate','luna','mango','nieve','ópera','panda','queso','rayo','salsa','tigre','único','velas','whisky','yate','zorro','arena','bosque','cielo','dulce','estrella','fuego','gato','hielo','inicio','jardín','karma','libro','mañana','nacho','océano','perro','quinto','río','sol','toro','uva','viento','agua'],
  fr: ['aigle','brume','cerise','danse','étoile','forêt','glace','hiver','île','jardin','karma','lune','miel','neige','ombre','pluie','quartz','rivière','sable','tigre','unique','vallon','wagon','xénon','yacht','zèbre','arbre','balcon','cerf','dôme','écume','figue','grotte','herbe','iris','jonc','kiwi','lierre','marée','nuit'],
  de: ['Adler','Birke','Cloud','Donner','Eiche','Fuchs','Garten','Hafen','Insel','Jagd','Karte','Laube','Mond','Nebel','Otter','Pfad','Quarz','Regen','Silber','Tanne','Ufer','Veil','Wasser','Xenon','Yacht','Zeder','Amsel','Bach','Comet','Drift','Ebene','Falke','Gipfel','Heide','Ilex','Juwel'],
  it: ['aquila','brezza','cielo','danza','estate','foresta','giardino','isola','jungla','karma','luna','miele','neve','ombra','prato','quartz','raggio','sabbia','tigre','uva','valle','vento','yacht','zebra','alba','bosco','campo','dolce','erba','farfalla','gatto','ieri','lago','mare','notte'],
  pt: ['águia','brisa','céu','dança','estrela','floresta','jardim','ilha','karma','lua','mel','neve','ombra','prado','quartz','raio','sol','tigre','uva','vale','vento','yacht','zebra','alba','bosque','campo','doce','erva','gato','lago','mar','noite','pão','rio'],
  zh: ['苹果','桥梁','云朵','龙','鹰','森林','花园','海港','岛屿','丛林','骑士','灯笼','大理石','针','海洋','谜题','石英','火箭','银色','雷声','雨伞','山谷','窗户','黄色','斑马','琥珀','篮子','蜡烛','沙漠','河流','石头','塔','紫罗兰','核桃','纱线'],
  ja: ['りんご','橋','雲','龍','鷹','森','庭','港','島','密林','騎士','提灯','大理石','針','海','謎','石英','ロケット','銀','雷','傘','谷','窓','黄色','斑馬','琥珀','籠','蝋燭','砂漠','川','石','塔','紫','胡桃','糸'],
  ko: ['사과','다리','구름','용','독수리','숲','정원','항구','섬','정글','기사','등불','대리석','바늘','바다','퍼즐','석영','로켓','은색','천둥','우산','계곡','창문','노란','얼룩말','호박','바구니','양초','사막','강','돌','탑','보라','호두','실'],
  ar: ['تفاحة','جسر','سحابة','تنين','نسر','غابة','حديقة','ميناء','جزيرة','غابة','فارس','فانوس','رخام','إبرة','محيط','لغز','كوارتز','صاروخ','فضة','رعد','مظلة','وادي','نافذة','أصفر','حمار وحشي','كهرمان','سلة','شمعة','صحراء','نهر','حجر','برج','بنفسج','جوز','خيط'],
  hi: ['सेब','पुल','बादल','अजगर','बाज','जंगल','बगीचा','बंदरगाह','द्वीप','जंगल','शूरवीर','लालटेन','संगमरमर','सुई','सागर','पहेली','क्वार्ट्ज','रॉकेट','चांदी','गड़गड़ाहट','छाता','घाटी','खिड़की','पीला','ज़ेबरा','अंबर','टोकरी','मोमबत्ती','रेगिस्तान','नदी','पत्थर','मीनार','बैंगनी','अखरोट','धागा'],
  ru: ['яблоко','мост','облако','дракон','орёл','лес','сад','гавань','остров','джунгли','рыцарь','фонарь','мрамор','игла','океан','загадка','кварц','ракета','серебро','гром','зонтик','долина','окно','жёлтый','зебра','янтарь','корзина','свеча','пустыня','река','камень','башня','фиолетовый','орех','пряжа'],
};

export function generatePassphrase(wordCount = 4, lang = 'en') {
  const list = WORDLISTS[lang] || WORDLISTS.en;
  return Array.from({ length: wordCount }, () => list[Math.floor(Math.random() * list.length)]).join('-');
}

const STRONG_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
export function generateStrongPassword(length = 20) {
  let pass;
  do {
    pass = Array.from({ length }, () => STRONG_CHARS[Math.floor(Math.random() * STRONG_CHARS.length)]).join('');
  } while (!/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || !/[0-9]/.test(pass) || !/[^A-Za-z0-9]/.test(pass));
  return pass;
}

export function generatePin(length = 4) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

const USERNAME_BY_LANG = {
  en: { adj: ['cool','fast','bold','dark','wild','calm','wise','keen','soft','bright','sharp','swift'], noun: ['fox','wolf','hawk','bear','lion','owl','cat','dog','fish','crow','deer','leopard'] },
  es: { adj: ['rapido','audaz','sereno','sabio','veloz','brillante','noble','calmado','agudo','firme','unico','leal'], noun: ['zorro','lobo','halcon','oso','leon','buho','gato','perro','pez','cuervo','ciervo','leopardo'] },
  fr: { adj: ['rapide','audacieux','serein','sage','vif','brillant','noble','calme','agile','ferme','unique','loyal'], noun: ['renard','loup','faucon','ours','lion','hibou','chat','chien','poisson','corbeau','cerf','leopard'] },
  de: { adj: ['schnell','mutig','ruhig','weise','flink','hell','edel','sanft','agil','stark','klug','treu'], noun: ['fuchs','wolf','falke','bar','lowe','eule','katze','hund','fisch','rabe','hirsch','leopard'] },
  it: { adj: ['veloce','audace','sereno','saggio','vivace','brillante','nobile','calmo','agile','fermo','unico','leale'], noun: ['volpe','lupo','falco','orso','leone','gufo','gatto','cane','pesce','corvo','cervo','leopardo'] },
  pt: { adj: ['rapido','audaz','sereno','sabio','vivo','brilhante','nobre','calmo','agil','firme','unico','leal'], noun: ['raposa','lobo','falcao','urso','leao','coruja','gato','cao','peixe','corvo','cervo','leopardo'] },
  zh: { adj: ['酷','快','猛','暗','野','静','智','锐','柔','亮','犀','疾'], noun: ['狐','狼','鹰','熊','狮','鸮','猫','犬','鱼','鸦','鹿','豹'] },
  ja: { adj: ['クール','速い','大胆','闇','野生','静','賢い','鋭い','柔','明るい','鋭','疾'], noun: ['狐','狼','鷹','熊','獅子','梟','猫','犬','魚','鴉','鹿','豹'] },
  ko: { adj: ['빠른','대담한','고요한','지혜로운','야생의','차분한','현명한','날카로운','부드러운','밝은','예리한','신속한'], noun: ['여우','늑대','매','곰','사자','수리','고양이','개','물고기','까마귀','사슴','표범'] },
  ar: { adj: ['سريع','جريء','هادئ','حكيم','ماهر','ساطع','نبيل','ثابت','فريد','وفي','حاد','خفيف'], noun: ['ثعلب','ذئب','صقر','دب','أسد','بومة','قط','كلب','سمكة','غداب','غزال','فهد'] },
  hi: { adj: ['तेज','साहसी','शांत','बुद्धिमान','चपल','उज्ज्वल','महान','स्निग्ध','दीप्तिमान','तीक्ष्ण','स्विफ्ट','वफादार'], noun: ['लोमड़ी','भेड़िया','बाज','भालू','शेर','उल्लू','बिल्ली','कुत्ता','मछली','कौवा','हिरण','तेंदुआ'] },
  ru: { adj: ['быстрый','смелый','спокойный','мудрый','ловкий','яркий','благородный','мягкий','острый','крепкий','умный','верный'], noun: ['лиса','волк','ястреб','медведь','лев','сова','кот','пес','рыба','ворон','олень','барс'] },
};

export function generateUsername(lang = 'en') {
  const d = USERNAME_BY_LANG[lang] || USERNAME_BY_LANG.en;
  const adj = pick(d.adj);
  const noun = pick(d.noun);
  const num = Math.floor(Math.random() * 999);
  // CJK reads naturally without a delimiter; Latin/Arabic/Hindi/Cyrillic keep the underscore.
  if (['zh', 'ja', 'ko'].includes(lang)) return `${adj}${noun}${num}`;
  return `${adj}_${noun}${num}`;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateSecretKey(length = 32) {
  return Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

// Simple hash implementations (no crypto API needed for MD5/basic)
function rotateLeft(n, s) { return (n << s) | (n >>> (32 - s)); }
function safeAdd(x, y) { const lsw = (x & 0xFFFF) + (y & 0xFFFF); const msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); }

function md5(str) {
  // Use Web Crypto if available in a sync polyfill approach, otherwise use a simple JS md5
  // Simple md5 implementation
  function md5cmn(q, a, b, x, s, t) { return safeAdd(rotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

  const x = str2blks(str);
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d;
    a = md5ff(a,b,c,d,x[i],7,-680876936);d=md5ff(d,a,b,c,x[i+1],12,-389564586);c=md5ff(c,d,a,b,x[i+2],17,606105819);b=md5ff(b,c,d,a,x[i+3],22,-1044525330);
    a=md5ff(a,b,c,d,x[i+4],7,-176418897);d=md5ff(d,a,b,c,x[i+5],12,1200080426);c=md5ff(c,d,a,b,x[i+6],17,-1473231341);b=md5ff(b,c,d,a,x[i+7],22,-45705983);
    a=md5ff(a,b,c,d,x[i+8],7,1770035416);d=md5ff(d,a,b,c,x[i+9],12,-1958414417);c=md5ff(c,d,a,b,x[i+10],17,-42063);b=md5ff(b,c,d,a,x[i+11],22,-1990404162);
    a=md5ff(a,b,c,d,x[i+12],7,1804603682);d=md5ff(d,a,b,c,x[i+13],12,-40341101);c=md5ff(c,d,a,b,x[i+14],17,-1502002290);b=md5ff(b,c,d,a,x[i+15],22,1236535329);
    a=md5gg(a,b,c,d,x[i+1],5,-165796510);d=md5gg(d,a,b,c,x[i+6],9,-1069501632);c=md5gg(c,d,a,b,x[i+11],14,643717713);b=md5gg(b,c,d,a,x[i],20,-373897302);
    a=md5gg(a,b,c,d,x[i+5],5,-701558691);d=md5gg(d,a,b,c,x[i+10],9,38016083);c=md5gg(c,d,a,b,x[i+15],14,-660478335);b=md5gg(b,c,d,a,x[i+4],20,-405537848);
    a=md5gg(a,b,c,d,x[i+9],5,568446438);d=md5gg(d,a,b,c,x[i+14],9,-1019803690);c=md5gg(c,d,a,b,x[i+3],14,-187363961);b=md5gg(b,c,d,a,x[i+8],20,1163531501);
    a=md5gg(a,b,c,d,x[i+13],5,-1444681467);d=md5gg(d,a,b,c,x[i+2],9,-51403784);c=md5gg(c,d,a,b,x[i+7],14,1735328473);b=md5gg(b,c,d,a,x[i+12],20,-1926607734);
    a=md5hh(a,b,c,d,x[i+5],4,-378558);d=md5hh(d,a,b,c,x[i+8],11,-2022574463);c=md5hh(c,d,a,b,x[i+11],16,1839030562);b=md5hh(b,c,d,a,x[i+14],23,-35309556);
    a=md5hh(a,b,c,d,x[i+1],4,-1530992060);d=md5hh(d,a,b,c,x[i+4],11,1272893353);c=md5hh(c,d,a,b,x[i+7],16,-155497632);b=md5hh(b,c,d,a,x[i+10],23,-1094730640);
    a=md5hh(a,b,c,d,x[i+13],4,681279174);d=md5hh(d,a,b,c,x[i],11,-358537222);c=md5hh(c,d,a,b,x[i+3],16,-722521979);b=md5hh(b,c,d,a,x[i+6],23,76029189);
    a=md5hh(a,b,c,d,x[i+9],4,-640364487);d=md5hh(d,a,b,c,x[i+12],11,-421815835);c=md5hh(c,d,a,b,x[i+15],16,530742520);b=md5hh(b,c,d,a,x[i+2],23,-995338651);
    a=md5ii(a,b,c,d,x[i],6,-198630844);d=md5ii(d,a,b,c,x[i+7],10,1126891415);c=md5ii(c,d,a,b,x[i+14],15,-1416354905);b=md5ii(b,c,d,a,x[i+5],21,-57434055);
    a=md5ii(a,b,c,d,x[i+12],6,1700485571);d=md5ii(d,a,b,c,x[i+3],10,-1894986606);c=md5ii(c,d,a,b,x[i+10],15,-1051523);b=md5ii(b,c,d,a,x[i+1],21,-2054922799);
    a=md5ii(a,b,c,d,x[i+8],6,1873313359);d=md5ii(d,a,b,c,x[i+15],10,-30611744);c=md5ii(c,d,a,b,x[i+6],15,-1560198380);b=md5ii(b,c,d,a,x[i+13],21,1309151649);
    a=md5ii(a,b,c,d,x[i+4],6,-145523070);d=md5ii(d,a,b,c,x[i+11],10,-1120210379);c=md5ii(c,d,a,b,x[i+2],15,718787259);b=md5ii(b,c,d,a,x[i+9],21,-343485551);
    a=safeAdd(a,olda);b=safeAdd(b,oldb);c=safeAdd(c,oldc);d=safeAdd(d,oldd);
  }
  return [a, b, c, d];
}

function str2blks(str) {
  const nblk = ((str.length + 8) >> 6) + 1;
  const blks = new Array(nblk * 16).fill(0);
  for (let i = 0; i < str.length; i++) blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  blks[str.length >> 2] |= 0x80 << ((str.length % 4) * 8);
  blks[nblk * 16 - 2] = str.length * 8;
  return blks;
}

function num2hex(n) { return ('0' + ((n < 0 ? n + 4294967296 : n)).toString(16)).slice(-8); }
function revertBytes(s) { return s.match(/../g).map(b => b).reverse().join(''); }

export function hashMD5(str) {
  return md5(str).map(n => revertBytes(num2hex(n))).join('');
}

export async function hashSHA1(str) {
  if (!crypto?.subtle) return 'SHA-1 not available';
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashSHA256(str) {
  if (!crypto?.subtle) return 'SHA-256 not available';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Text Converters ────────────────────────────────────────────────────────

export function toUpperCase(str) { return str.toUpperCase(); }
export function toLowerCase(str) { return str.toLowerCase(); }
export function toTitleCase(str) { return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }
export function toCamelCase(str) {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase());
}
export function toSnakeCase(str) {
  return str.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

const ONES = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

function numToWordsLt1000(n) {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numToWordsLt1000(n % 100) : '');
}

export function numberToWords(n) {
  if (isNaN(n)) return 'Invalid number';
  if (n === 0) return 'zero';
  const parts = [];
  if (n < 0) { parts.push('negative'); n = -n; }
  if (n >= 1e9) { parts.push(numToWordsLt1000(Math.floor(n / 1e9)) + ' billion'); n %= 1e9; }
  if (n >= 1e6) { parts.push(numToWordsLt1000(Math.floor(n / 1e6)) + ' million'); n %= 1e6; }
  if (n >= 1e3) { parts.push(numToWordsLt1000(Math.floor(n / 1e3)) + ' thousand'); n %= 1e3; }
  if (n > 0) parts.push(numToWordsLt1000(n));
  return parts.join(' ');
}

const ROMAN_VALS = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];

export function toRoman(n) {
  if (isNaN(n) || n <= 0 || n >= 4000) return 'Out of range (1–3999)';
  let result = '';
  for (const [val, sym] of ROMAN_VALS) { while (n >= val) { result += sym; n -= val; } }
  return result;
}

export function fromRoman(str) {
  const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  let result = 0;
  const s = str.toUpperCase().trim();
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]], next = map[s[i+1]];
    if (!cur) return 'Invalid Roman numeral';
    result += (next && cur < next) ? -cur : cur;
  }
  return String(result);
}

const MORSE_MAP = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',' ':'/'};
const MORSE_REVERSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k,v]) => [v,k]));

export function toMorse(str) {
  return str.toUpperCase().split('').map(c => MORSE_MAP[c] || '?').join(' ');
}

export function fromMorse(str) {
  return str.split(' ').map(c => MORSE_REVERSE[c] || '?').join('').toLowerCase();
}

export function toBinary(n) {
  const num = parseInt(n);
  if (isNaN(num)) return 'Invalid';
  return num.toString(2);
}

export function toHex(n) {
  const num = parseInt(n);
  if (isNaN(num)) return 'Invalid';
  return num.toString(16).toUpperCase();
}

export function toOctal(n) {
  const num = parseInt(n);
  if (isNaN(num)) return 'Invalid';
  return num.toString(8);
}

export function fromBinary(str) { const n = parseInt(str, 2); return isNaN(n) ? 'Invalid' : String(n); }
export function fromHex(str) { const n = parseInt(str, 16); return isNaN(n) ? 'Invalid' : String(n); }
export function fromOctal(str) { const n = parseInt(str, 8); return isNaN(n) ? 'Invalid' : String(n); }