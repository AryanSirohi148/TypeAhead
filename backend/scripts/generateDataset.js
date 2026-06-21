'use strict';

// Synthetic Search Query Dataset Generator
//
// generates ~100k queries with zipf distribution so it feels like a real search engine
// i used 500 random subjects and 200 templates like "how to use X", "X review" etc.
//
// zipf formula: count = max_count / rank
// so rank 1 gets 1M searches, rank 100k gets 10 searches.

function generateDataset() {
  const queryMap = new Map(); // query → insertion rank (used for Zipf count)

  // Helper to add a query if it's not already present
  function add(query) {
    const q = query.toLowerCase().trim();
    if (!q || queryMap.has(q)) return;
    queryMap.set(q, queryMap.size + 1);
  }

  // ==========================================================================
  // SUBJECTS — 500 realistic search subjects
  // ==========================================================================

  // --- Tech: Phones ---
  const phoneBase = [
    'iphone 15', 'iphone 15 pro', 'iphone 15 pro max', 'iphone 14', 'iphone 13',
    'iphone 12', 'iphone se', 'iphone 16', 'iphone charger', 'iphone case',
    'samsung galaxy s24', 'samsung galaxy s24 ultra', 'samsung galaxy s23',
    'samsung galaxy a54', 'samsung galaxy a34', 'samsung galaxy z fold 5',
    'samsung galaxy z flip 5', 'google pixel 8', 'google pixel 8 pro',
    'google pixel 7a', 'oneplus 12', 'oneplus 11', 'oneplus nord 3',
    'xiaomi 14', 'xiaomi redmi note 13', 'xiaomi poco x6', 'realme 12 pro',
    'oppo reno 11', 'vivo v30', 'motorola edge 40', 'nothing phone 2',
  ];

  // --- Tech: Laptops ---
  const laptopBase = [
    'macbook pro', 'macbook air', 'macbook air m2', 'macbook pro m3',
    'macbook pro 14', 'macbook pro 16', 'dell xps 13', 'dell xps 15',
    'dell inspiron 15', 'hp spectre x360', 'hp envy 13', 'hp pavilion 15',
    'lenovo thinkpad x1', 'lenovo ideapad 5', 'lenovo yoga 7i', 'lenovo legion 5',
    'asus zenbook 14', 'asus rog strix', 'asus tuf gaming', 'asus vivobook 15',
    'acer swift 3', 'acer aspire 5', 'acer predator helios', 'acer nitro 5',
    'microsoft surface pro', 'microsoft surface laptop', 'gaming laptop',
    'budget laptop', 'student laptop', 'thin and light laptop',
  ];

  // --- Tech: Components & Peripherals ---
  const techPeripherals = [
    'rtx 4090', 'rtx 4080', 'rtx 4070', 'rtx 3090', 'rx 7900 xtx',
    'intel core i9', 'intel core i7', 'amd ryzen 9', 'amd ryzen 7',
    'ddr5 ram', '32gb ram', 'nvme ssd', '4tb ssd', 'samsung 990 pro',
    'logitech mx master 3', 'logitech g pro x', 'razer deathadder',
    'corsair k70', 'mechanical keyboard', 'gaming mouse', 'gaming headset',
    'lg 4k monitor', 'samsung odyssey g7', 'ultrawide monitor',
    'airpods pro 2', 'sony wh-1000xm5', 'bose quietcomfort 45',
    'samsung galaxy buds 2 pro', 'jbl earbuds', 'boat airdopes',
    'apple watch ultra 2', 'apple watch series 9', 'samsung galaxy watch 6',
    'fitbit sense 2', 'garmin fenix 7',
  ];

  // --- Tech: AI & Software ---
  const aiAndSoftware = [
    'chatgpt', 'chatgpt 4', 'openai', 'gemini ai', 'claude ai',
    'midjourney', 'stable diffusion', 'dall e 3', 'github copilot',
    'microsoft copilot', 'google bard', 'perplexity ai', 'character ai',
    'photoshop', 'adobe illustrator', 'figma', 'canva', 'notion',
    'obsidian notes', 'vs code', 'jetbrains intellij', 'pycharm',
    'windows 11', 'macos sonoma', 'ubuntu 24.04', 'linux mint',
    'zoom', 'microsoft teams', 'slack', 'discord', 'telegram',
  ];

  // --- Programming ---
  const programmingTopics = [
    'python', 'javascript', 'java', 'typescript', 'golang', 'rust',
    'c++', 'c#', 'kotlin', 'swift', 'php', 'ruby', 'scala', 'dart',
    'react', 'nextjs', 'vuejs', 'angular', 'svelte', 'nodejs',
    'express js', 'fastapi', 'django', 'flask', 'spring boot', 'laravel',
    'docker', 'kubernetes', 'aws', 'azure', 'google cloud', 'terraform',
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'machine learning', 'deep learning', 'neural network', 'tensorflow',
    'pytorch', 'pandas', 'numpy', 'data science', 'data analysis', 'sql',
    'graphql', 'rest api', 'microservices', 'system design', 'leetcode',
  ];

  // --- Entertainment ---
  const entertainmentTopics = [
    'netflix', 'amazon prime', 'disney plus', 'hbo max', 'apple tv plus',
    'youtube premium', 'spotify', 'apple music', 'youtube music',
    'oppenheimer', 'barbie movie', 'avatar 2', 'spider-man', 'avengers',
    'batman', 'dune part 2', 'mission impossible', 'john wick 4',
    'guardians of the galaxy 3', 'the batman', 'black panther 2',
    'taylor swift', 'drake', 'bad bunny', 'the weeknd', 'billie eilish',
    'ariana grande', 'ed sheeran', 'eminem', 'beyonce', 'adele',
    'dua lipa', 'olivia rodrigo', 'harry styles', 'coldplay', 'imagine dragons',
    'arijit singh', 'shreya ghoshal', 'atif aslam', 'sonu nigam',
    'bts', 'blackpink', 'twice', 'stray kids',
  ];

  // --- E-commerce & Shopping ---
  const shoppingTopics = [
    'amazon', 'flipkart', 'meesho', 'myntra', 'nykaa', 'ajio',
    'ebay', 'aliexpress', 'shein', 'temu',
    'best headphones', 'best earbuds', 'best smartwatch', 'best tablet',
    'best gaming pc', 'best gaming chair', 'best mechanical keyboard',
    'electric scooter', 'electric bike', 'electric car india',
    'tata nexon ev', 'ola electric scooter', 'pure ev', 'ather 450x',
    'air purifier', 'robot vacuum', 'air fryer', 'instant pot', 'coffee maker',
    'lg oled tv', 'samsung qled tv', 'sony bravia 4k', 'mi tv',
  ];

  // --- Health & Fitness ---
  const healthTopics = [
    'weight loss diet', 'keto diet plan', 'intermittent fasting',
    'diabetes symptoms', 'high blood pressure symptoms', 'thyroid symptoms',
    'vitamin d deficiency', 'vitamin b12 deficiency', 'iron deficiency',
    'yoga for beginners', 'home workout', 'gym workout plan',
    'protein powder', 'creatine supplement', 'pre workout supplement',
    'best diet plan', 'calorie calculator', 'bmi calculator',
    'mental health tips', 'anxiety symptoms', 'depression treatment',
    'meditation for beginners', 'sleep better tips', 'stress relief',
    'home remedies cold', 'home remedies headache', 'home remedies cough',
  ];

  // --- Finance ---
  const financeTopics = [
    'stock market today', 'sensex today', 'nifty 50 today', 'gold price today',
    'bitcoin price', 'ethereum price', 'dogecoin price', 'crypto market',
    'mutual fund investment', 'sip calculator', 'how to invest',
    'best mutual funds 2024', 'index funds india', 'nps account',
    'income tax return', 'itr filing', 'gst return', 'epf withdrawal',
    'usd to inr', 'euro to inr', 'pound to inr', 'dollar rate',
    'home loan interest rate', 'personal loan', 'car loan emi calculator',
    'term insurance', 'health insurance', 'car insurance',
  ];

  // --- Sports & Gaming ---
  const sportsGamingTopics = [
    'cricket score', 'ipl 2024', 'india vs australia', 'india vs pakistan',
    'nba scores', 'nfl scores', 'premier league', 'champions league',
    'formula 1 2024', 'wimbledon 2024', 'olympics 2024',
    'minecraft', 'fortnite', 'valorant', 'gta 5', 'gta 6',
    'call of duty', 'elden ring', 'baldurs gate 3', 'starfield',
    'pubg mobile', 'free fire', 'cod mobile', 'pokemon',
    'ps5 games', 'xbox series x', 'nintendo switch', 'steam games',
    'best gaming setup', 'streamer setup', 'youtube gaming',
  ];

  // --- Food & Recipes ---
  const foodTopics = [
    'biryani recipe', 'butter chicken recipe', 'paneer tikka', 'dal makhani',
    'chole bhature', 'pav bhaji', 'samosa recipe', 'gulab jamun recipe',
    'pasta recipe', 'pizza recipe', 'burger recipe', 'sandwich recipe',
    'chocolate cake recipe', 'banana bread', 'cheesecake recipe',
    'smoothie recipes', 'protein shake recipe', 'healthy salad recipe',
    'chicken curry', 'fish curry', 'egg fried rice', 'hakka noodles',
    'masala chai recipe', 'cold coffee recipe', 'lemonade recipe',
    'restaurants near me', 'pizza near me', 'chinese food near me',
    'zomato coupon', 'swiggy offers', 'dominos pizza', 'kfc menu',
  ];

  // --- Travel ---
  const travelTopics = [
    'goa tourist places', 'kerala tourist places', 'manali tourist places',
    'shimla tourist places', 'rajasthan tourist places', 'kashmir tourism',
    'ooty tourist places', 'coorg tourist places', 'andaman islands',
    'flight booking', 'cheap flights india', 'flights to dubai',
    'singapore trip package', 'thailand tour package', 'maldives trip',
    'paris travel guide', 'london travel guide', 'japan travel guide',
    'visa for usa', 'visa for canada', 'visa for uk', 'visa for europe',
    'airbnb india', 'oyo rooms', 'irctc booking', 'train ticket booking',
    'hotels in mumbai', 'hotels in delhi', 'hotels in goa',
  ];

  // --- Education ---
  const educationTopics = [
    'iit jee preparation', 'neet preparation', 'cat exam prep',
    'upsc preparation', 'ssc cgl', 'bank po exam', 'gate exam',
    'gre exam', 'gmat preparation', 'ielts preparation', 'toefl prep',
    'coursera courses', 'udemy courses', 'edx courses', 'nptel courses',
    'google certification', 'aws certification', 'azure certification',
    'data science bootcamp', 'coding bootcamp', 'digital marketing course',
    'graphic design course', 'ui ux design', 'video editing course',
    'photography tutorial', 'blender 3d', 'unity game development',
    'free online courses', 'youtube tutorials', 'spoken english tips',
  ];

  // --- General & How-To ---
  const generalTopics = [
    'weather today', 'weather forecast', 'rain forecast', 'temperature today',
    'google maps', 'google translate', 'google photos', 'google drive',
    'gmail tips', 'whatsapp tips', 'instagram tips', 'facebook tips',
    'how to make money online', 'passive income ideas', 'freelancing tips',
    'work from home jobs', 'remote jobs', 'data entry jobs', 'part time jobs',
    'resume writing tips', 'interview tips', 'salary negotiation',
    'coding interview', 'system design interview', 'behavioral interview',
    'startup ideas', 'business ideas', 'dropshipping guide', 'amazon fba',
    'social media marketing', 'seo tips', 'content marketing', 'email marketing',
  ];

  // Combine all subjects into one flat array
  const subjects = [
    ...phoneBase, ...laptopBase, ...techPeripherals,
    ...aiAndSoftware, ...programmingTopics, ...entertainmentTopics,
    ...shoppingTopics, ...healthTopics, ...financeTopics,
    ...sportsGamingTopics, ...foodTopics, ...travelTopics,
    ...educationTopics, ...generalTopics,
  ];

  // Add raw subjects first (they get lowest rank numbers → highest counts)
  for (const s of subjects) add(s);

  // ==========================================================================
  // QUERY TEMPLATES — applied to subjects to reach 100k+
  // ==========================================================================

  const templates = [
    s => `${s} review`,
    s => `${s} price`,
    s => `buy ${s}`,
    s => `${s} tutorial`,
    s => `${s} for beginners`,
    s => `how to use ${s}`,
    s => `${s} 2024`,
    s => `${s} guide`,
    s => `best ${s}`,
    s => `${s} tips`,
    s => `${s} tricks`,
    s => `${s} examples`,
    s => `${s} vs`,
    s => `${s} alternatives`,
    s => `${s} features`,
    s => `${s} specs`,
    s => `${s} download`,
    s => `${s} free`,
    s => `${s} app`,
    s => `${s} software`,
    s => `${s} tool`,
    s => `${s} course`,
    s => `${s} certification`,
    s => `${s} jobs`,
    s => `${s} salary`,
    s => `${s} career`,
    s => `how to learn ${s}`,
    s => `how to install ${s}`,
    s => `how to setup ${s}`,
    s => `how to fix ${s}`,
    s => `what is ${s}`,
    s => `${s} explained`,
    s => `${s} crash course`,
    s => `${s} full course`,
    s => `${s} complete guide`,
    s => `${s} step by step`,
    s => `${s} quick start`,
    s => `${s} getting started`,
    s => `${s} interview questions`,
    s => `${s} cheat sheet`,
    s => `${s} roadmap`,
    s => `${s} projects`,
    s => `${s} project ideas`,
    s => `${s} use cases`,
    s => `${s} advantages`,
    s => `${s} disadvantages`,
    s => `${s} pros and cons`,
    s => `${s} meaning`,
    s => `${s} definition`,
    s => `${s} for dummies`,
    s => `${s} from scratch`,
    s => `${s} in 2024`,
    s => `${s} 2023`,
    s => `${s} news`,
    s => `${s} latest news`,
    s => `${s} update`,
    s => `${s} release date`,
    s => `${s} launch date`,
    s => `${s} problems`,
    s => `${s} issues`,
    s => `${s} not working`,
    s => `${s} error`,
    s => `${s} fix`,
    s => `${s} slow`,
    s => `${s} crash`,
    s => `${s} setup`,
    s => `${s} configuration`,
    s => `${s} installation`,
    s => `${s} documentation`,
    s => `${s} github`,
    s => `${s} reddit`,
    s => `${s} community`,
    s => `${s} support`,
    s => `${s} help`,
    s => `${s} tutorial youtube`,
    s => `${s} video`,
    s => `${s} demo`,
    s => `${s} example`,
    s => `${s} template`,
    s => `${s} open source`,
    s => `${s} paid`,
    s => `${s} premium`,
    s => `${s} subscription`,
    s => `${s} coupon code`,
    s => `${s} discount`,
    s => `${s} offer`,
    s => `${s} deal`,
    s => `${s} refurbished`,
    s => `${s} second hand`,
    s => `${s} warranty`,
    s => `${s} repair`,
    s => `${s} accessories`,
    s => `${s} case`,
    s => `${s} cover`,
    s => `${s} charger`,
    s => `${s} cable`,
    s => `${s} battery`,
    s => `${s} replacement`,
    s => `${s} unboxing`,
    s => `${s} hands on`,
    s => `${s} first look`,
    s => `${s} impressions`,
    s => `${s} long term review`,
    s => `${s} worth buying`,
    s => `is ${s} worth it`,
    s => `should i buy ${s}`,
    s => `${s} price in india`,
    s => `${s} price comparison`,
    s => `${s} lowest price`,
    s => `${s} india`,
    s => `${s} online`,
    s => `${s} offline`,
    s => `${s} near me`,
    s => `${s} for students`,
    s => `${s} for professionals`,
    s => `${s} for beginners 2024`,
    s => `${s} advanced tutorial`,
    s => `${s} api`,
    s => `${s} integration`,
    s => `${s} plugin`,
    s => `${s} extension`,
    s => `${s} module`,
    s => `${s} library`,
    s => `${s} framework`,
    s => `${s} benchmark`,
    s => `${s} performance`,
    s => `${s} comparison`,
    s => `${s} ranking`,
    s => `top 10 ${s}`,
    s => `best ${s} 2024`,
    s => `best ${s} india`,
    s => `best ${s} for money`,
    s => `cheap ${s}`,
    s => `free ${s} download`,
    s => `${s} login`,
    s => `${s} sign up`,
    s => `${s} account`,
    s => `${s} settings`,
    s => `${s} dashboard`,
    s => `${s} analytics`,
    s => `${s} statistics`,
    s => `${s} data`,
    s => `${s} cloud`,
    s => `${s} hosting`,
    s => `${s} server`,
    s => `${s} mobile app`,
    s => `${s} web app`,
    s => `${s} ios`,
    s => `${s} android`,
    s => `${s} windows`,
    s => `${s} mac`,
    s => `${s} linux`,
    s => `learn ${s}`,
    s => `${s} for kids`,
    s => `${s} for school`,
    s => `${s} for college`,
    s => `${s} for work`,
    s => `${s} beginners guide`,
    s => `${s} advanced guide`,
    s => `${s} masterclass`,
    s => `${s} bootcamp`,
    s => `${s} training`,
    s => `${s} certification exam`,
    s => `${s} mock test`,
    s => `${s} practice questions`,
    s => `${s} sample questions`,
    s => `${s} past papers`,
    s => `${s} study guide`,
    s => `${s} notes`,
    s => `${s} summary`,
    s => `${s} overview`,
    s => `${s} introduction`,
    s => `${s} basics`,
    s => `${s} fundamentals`,
    s => `${s} concepts`,
    s => `${s} theory`,
    s => `${s} practical`,
    s => `${s} hands on tutorial`,
    s => `${s} lab`,
    s => `${s} exercise`,
    s => `${s} assignment`,
    s => `${s} homework`,
    s => `${s} solution`,
    s => `${s} answer`,
    s => `${s} question`,
    s => `${s} quiz`,
    s => `${s} test`,
    s => `${s} exam`,
    s => `${s} score`,
    s => `${s} result`,
    s => `${s} marks`,
    s => `${s} grade`,
    s => `${s} passing`,
    s => `${s} failing`,
    s => `${s} tips and tricks`,
    s => `${s} hacks`,
    s => `${s} shortcuts`,
    s => `${s} cheatsheet`,
    s => `${s} reference`,
    s => `${s} manual`,
    s => `${s} handbook`,
    s => `${s} textbook`,
    s => `${s} book`,
    s => `${s} pdf`,
    s => `${s} ebook`,
    s => `${s} tutorial pdf`,
    s => `${s} notes pdf`,
    s => `${s} slides`,
    s => `${s} presentation`,
    s => `${s} ppt`,
    s => `${s} infographic`,
    s => `${s} diagram`,
    s => `${s} architecture`,
    s => `${s} design pattern`,
    s => `${s} best practices`,
    s => `${s} common mistakes`,
    s => `${s} faq`,
    s => `${s} forum`,
    s => `${s} stack overflow`,
    s => `${s} medium article`,
    s => `${s} blog`,
    s => `${s} podcast`,
  ];

  // Apply every template to every subject
  for (const subject of subjects) {
    for (const tpl of templates) {
      add(tpl(subject));
    }
  }

  // ==========================================================================
  // Extra: common standalone searches and city-based queries
  // ==========================================================================

  const standaloneSearches = [
    'youtube', 'google', 'facebook', 'instagram', 'twitter', 'linkedin',
    'amazon', 'netflix', 'whatsapp', 'tiktok', 'reddit', 'wikipedia',
    'gmail', 'google maps', 'weather', 'translate', 'calculator',
    'news today', 'breaking news', 'stock market', 'sports news',
    'ipl score', 'cricket live', 'nba live', 'football scores',
    'corona virus update', 'election results', 'budget 2024 india',
  ];
  for (const s of standaloneSearches) add(s);

  const cities = [
    'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata',
    'pune', 'ahmedabad', 'jaipur', 'lucknow', 'surat', 'kanpur',
    'new york', 'london', 'dubai', 'singapore', 'tokyo', 'paris',
    'sydney', 'toronto', 'chicago', 'los angeles', 'san francisco', 'berlin',
  ];
  const cityMods = [
    ' weather', ' weather today', ' weather forecast', ' temperature',
    ' news', ' restaurants', ' hotels', ' traffic', ' map',
    ' pin code', ' population', ' time', ' airport',
  ];
  for (const city of cities) {
    for (const mod of cityMods) add(`${city}${mod}`);
  }

  // ==========================================================================
  // Convert to sorted array and apply Zipf counts
  // ==========================================================================
  const MAX_COUNT = 1_000_000;
  const ALPHA     = 1.0;

  const result = [];
  for (const [query, rank] of queryMap) {
    result.push({
      query,
      count: Math.max(1, Math.round(MAX_COUNT / Math.pow(rank, ALPHA))),
    });
  }

  // Sort by count descending (cosmetic — DB handles its own ordering)
  result.sort((a, b) => b.count - a.count);

  return result;
}

module.exports = { generateDataset };
