import { getServiceCatalogEntry, SAMASS_SERVICE_CATALOG } from "./serviceCatalog";

export type AssistantIntent =
  | "service_details"
  | "pricing"
  | "duration"
  | "preparation_before_session"
  | "aftercare"
  | "relaxation_tonic"
  | "tonic"
  | "tantrique"
  | "booking"
  | "contact"
  | "contraindications"
  | "frequency"
  | "massage_after_sport"
  | "first_session"
  | "oils";

export type AssistantLink = {
  href: string;
  label: string;
};

export type AssistantArticle = {
  id: string;
  title: string;
  summary: string;
  body: string[];
  intents: AssistantIntent[];
  keywords: string[];
  links?: AssistantLink[];
  suggestions?: string[];
};

export type AssistantKnowledgeEntry = {
  id: string;
  intent: AssistantIntent;
  title: string;
  question: string;
  shortAnswer: string;
  longAnswer: string[];
  keywords: string[];
  phrases: string[];
  links?: AssistantLink[];
  suggestions?: string[];
  articleId?: string;
};

function requireService(title: string) {
  const service = getServiceCatalogEntry(title);
  if (!service) {
    throw new Error(`Service catalog entry missing for "${title}".`);
  }
  return service;
}

function formatPriceLines(title: string) {
  const service = requireService(title);
  return Object.entries(service.durations_prices).map(
    ([duration, price]) => `${duration} min : ${price} €`
  );
}

const relaxantTonique = requireService("Massage Relaxant Tonique");
const tonique = requireService("Massage Tonique");
const tantrique = requireService("Massage Tantrique");

export const ASSISTANT_STARTER_SUGGESTIONS = [
  "Quel massage choisir ?",
  "Quelle est la différence entre les massages ?",
  "Quels sont les tarifs ?",
  "Comment se déroule une séance ?",
  "Comment préparer ma séance ?",
  "Que faire après un massage ?",
  "Peut-on faire un massage après le sport ?",
  "Comment réserver ?",
];

export const ASSISTANT_ARTICLES: AssistantArticle[] = [
  {
    id: "prepare-session",
    title: "Comment préparer sa séance de massage",
    summary:
      "Des repères simples pour arriver serein, disponible et confortable le jour de la séance.",
    body: [
      "Avant la séance, l’idéal est d’arriver avec un peu de marge afin de ne pas commencer dans la précipitation. Une tenue simple et confortable est généralement préférable.",
      "Évitez si possible un repas trop lourd juste avant. Si vous venez après une journée chargée ou après le sport, prenez quelques instants pour ralentir et revenir à votre respiration.",
      "Si vous avez des tensions particulières, une fatigue marquée, une zone sensible ou une contrainte du moment, dites-le simplement au début. Cela permet d’adapter la séance avec justesse.",
      "L’objectif n’est pas de performer ni d’arriver “parfaitement détendu”, mais d’entrer dans la séance avec le plus de disponibilité possible.",
    ],
    intents: ["preparation_before_session", "first_session"],
    keywords: ["preparer", "préparer", "avant séance", "avant massage", "première séance"],
    links: [
      { href: "/services", label: "Voir les massages" },
      { href: "/reservation", label: "Réserver" },
    ],
    suggestions: [
      "Comment se passe une première séance ?",
      "Quels sont les tarifs ?",
      "Comment réserver ?",
    ],
  },
  {
    id: "after-massage",
    title: "Que faire après un massage",
    summary:
      "Après une séance, mieux vaut laisser au corps un peu d’espace pour intégrer les effets du massage.",
    body: [
      "Après un massage, il est souvent utile de prolonger le calme plutôt que d’enchaîner immédiatement avec un rythme intense. Écouter son corps reste le meilleur repère.",
      "Boire de l’eau dans les heures qui suivent peut aider à retrouver une sensation de fraîcheur et de confort. Il n’est pas nécessaire d’en faire trop, simplement rester bien hydraté.",
      "Si possible, évitez les efforts brusques ou une stimulation trop forte juste après la séance, surtout si le massage a été profond ou très enveloppant.",
      "En cas de sensation inhabituelle importante, de douleur marquée ou de pathologie connue, il est préférable d’en parler à Sam et, si besoin, de demander l’avis d’un professionnel de santé.",
    ],
    intents: ["aftercare", "oils"],
    keywords: ["après massage", "apres massage", "hydratation", "repos", "douche", "eau"],
    links: [{ href: "/contact", label: "Poser une question à Sam" }],
    suggestions: [
      "Faut-il boire de l’eau après ?",
      "Faut-il se reposer après un massage ?",
      "Peut-on prendre une douche juste après ?",
    ],
  },
  {
    id: "after-tonic",
    title: "Conseils après un massage tonique",
    summary:
      "Un massage tonique peut donner un regain d’énergie, mais aussi révéler des tensions relâchées en profondeur.",
    body: [
      "Après un massage tonique, l’idéal est d’éviter de repartir immédiatement sur un effort intense. Le corps a souvent besoin de quelques heures pour intégrer le travail musculaire.",
      "Hydratez-vous normalement, respirez, marchez tranquillement si cela vous fait du bien et laissez la mobilité revenir naturellement.",
      "Si vous êtes sportif, adaptez simplement le reste de la journée selon vos sensations. L’idée n’est pas de forcer, mais d’écouter le corps.",
    ],
    intents: ["aftercare", "tonic", "massage_after_sport"],
    keywords: ["massage tonique apres", "après tonique", "apres tonique", "recuperation tonique"],
    links: [{ href: "/services", label: "Voir le massage tonique" }],
    suggestions: [
      "Peut-on faire un massage après le sport ?",
      "Que faire après un massage ?",
    ],
  },
  {
    id: "after-tantrique",
    title: "Conseils après un massage tantrique",
    summary:
      "Après une séance plus sensorielle et introspective, il est souvent bénéfique de préserver un temps calme.",
    body: [
      "Après un massage tantrique, beaucoup de personnes apprécient de garder un peu de silence et de lenteur plutôt que de retourner tout de suite à un rythme agité.",
      "Hydratation, respiration calme, marche douce ou repos léger peuvent aider à intégrer la séance. Il n’y a rien à “faire parfaitement”, l’essentiel est d’écouter ce qui vous fait du bien.",
      "Si des émotions ou des sensations particulières émergent, elles peuvent simplement être accueillies avec douceur. En cas de question, le contact avec Sam reste le plus utile.",
    ],
    intents: ["aftercare", "tantrique"],
    keywords: ["après tantrique", "apres tantrique", "massage tantrique après", "integration séance"],
    links: [{ href: "/services", label: "Voir le massage tantrique" }],
    suggestions: [
      "Comment se déroule une séance tantrique ?",
      "Faut-il se reposer après un massage ?",
    ],
  },
  {
    id: "rest-after-massage",
    title: "Faut-il se reposer après un massage ?",
    summary:
      "Souvent oui, au moins un peu. Le repos n’a pas besoin d’être long pour être utile.",
    body: [
      "Un massage crée souvent un changement de rythme dans le corps et l’esprit. Même un court moment plus calme après la séance peut être bénéfique.",
      "Se reposer ne veut pas forcément dire dormir. Cela peut simplement signifier ralentir, respirer, marcher tranquillement ou éviter d’enchaîner avec trop de sollicitations.",
      "Le bon repère reste votre ressenti. Certaines personnes repartent dynamisées, d’autres ont besoin d’un temps plus posé.",
    ],
    intents: ["aftercare", "oils"],
    keywords: ["repos", "se reposer", "fatigue après massage", "calme après massage"],
    links: [{ href: "/contact", label: "Contacter Sam" }],
    suggestions: [
      "Que faire après un massage ?",
      "Faut-il boire de l’eau après ?",
    ],
  },
  {
    id: "massage-sport",
    title: "Massage et sport : avant ou après ?",
    summary:
      "Tout dépend du moment, de l’objectif et de l’intensité recherchée.",
    body: [
      "Après le sport, un massage peut aider à relâcher certaines tensions, retrouver de la mobilité et revenir à un état plus détendu. Le massage tonique est souvent demandé dans cette logique.",
      "Avant un effort important, on évite généralement un massage trop profond juste avant si l’objectif est la performance immédiate. Le plus utile dépend du timing et de l’état du corps.",
      "Si vous avez un doute, dites simplement à Sam dans quel contexte vous venez : récupération, fatigue musculaire, stress, besoin de détente ou recentrage.",
    ],
    intents: ["massage_after_sport", "tonic", "frequency"],
    keywords: ["sport", "apres sport", "avant sport", "recuperation", "récupération"],
    links: [
      { href: "/services", label: "Voir les services" },
      { href: "/contact", label: "Demander conseil" },
    ],
    suggestions: [
      "Le massage tonique est-il adapté après le sport ?",
      "Quel massage choisir ?",
    ],
  },
  {
    id: "frequency",
    title: "À quelle fréquence recevoir un massage bien-être ?",
    summary:
      "Il n’y a pas de règle unique : la bonne fréquence dépend surtout de votre besoin du moment.",
    body: [
      "Certaines personnes viennent ponctuellement pour relâcher une tension ou traverser une période chargée. D’autres préfèrent un rythme plus régulier pour entretenir leur équilibre.",
      "Le plus important est la cohérence avec votre quotidien, vos sensations et votre budget. Une séance bien choisie au bon moment a souvent plus de valeur qu’un rythme forcé.",
      "Si vous hésitez, le mieux est simplement d’en parler avec Sam pour choisir une fréquence réaliste et adaptée.",
    ],
    intents: ["frequency"],
    keywords: ["fréquence", "frequence", "combien de fois", "régulièrement", "souvent"],
    links: [
      { href: "/reservation", label: "Réserver une séance" },
      { href: "/contact", label: "Demander conseil" },
    ],
    suggestions: [
      "Quel massage choisir ?",
      "Comment se passe une première séance ?",
    ],
  },
];

export const ASSISTANT_KNOWLEDGE_BASE: AssistantKnowledgeEntry[] = [
  {
    id: "choose-massage",
    intent: "service_details",
    title: "Quel massage choisir ?",
    question: "Quel massage choisir ?",
    shortAnswer:
      "Le bon massage dépend surtout de votre besoin du moment : détente, récupération musculaire, recentrage ou expérience plus sensorielle.",
    longAnswer: [
      `Le ${relaxantTonique.title} convient bien si vous cherchez un équilibre entre relâchement et redynamisation.`,
      `Le ${tonique.title} est plus orienté récupération, circulation et travail musculaire appuyé.`,
      `Le ${tantrique.title} s’inscrit dans une approche plus lente, sensorielle et centrée sur la présence au corps.`,
      "Si vous hésitez, le plus simple est d’écrire à Sam ou de réserver en indiquant votre besoin principal.",
    ],
    keywords: [
      "choisir",
      "quel massage",
      "massage choisir",
      "besoin",
      "stress",
      "fatigue",
      "tensions",
      "sensoriel",
    ],
    phrases: [
      "quel massage choisir",
      "je ne sais pas quel massage choisir",
      "quel massage me conviendrait",
      "quel massage pour moi",
    ],
    links: [
      { href: "/services", label: "Comparer les massages" },
      { href: "/reservation", label: "Réserver" },
    ],
    suggestions: [
      "Quelle est la différence entre les massages ?",
      "Le massage tonique est-il adapté après le sport ?",
      "Comment se déroule une séance ?",
    ],
  },
  {
    id: "services-difference",
    intent: "service_details",
    title: "Différence entre les massages",
    question: "Quelle est la différence entre relaxant tonique, tonique et tantrique ?",
    shortAnswer:
      "Les trois massages n’ont pas le même rythme ni la même intention : l’un équilibre détente et énergie, l’autre travaille plus en profondeur, le troisième privilégie la présence et la sensation.",
    longAnswer: [
      `${relaxantTonique.title} : ${relaxantTonique.description}`,
      `${tonique.title} : ${tonique.description}`,
      `${tantrique.title} : ${tantrique.description}`,
      "Chaque séance reste personnalisée : pression, rythme et durée s’adaptent à votre état du moment.",
    ],
    keywords: ["différence", "difference", "comparaison", "relaxant tonique", "tonique", "tantrique"],
    phrases: [
      "quelle est la différence entre les massages",
      "difference entre relaxant tonique et tonique",
      "différence entre relaxant tonique tonique et tantrique",
    ],
    links: [{ href: "/services", label: "Voir les détails des massages" }],
    suggestions: [
      "Quel massage choisir ?",
      "Quels sont les tarifs ?",
      "Comment se déroule une séance ?",
    ],
  },
  {
    id: "pricing",
    intent: "pricing",
    title: "Tarifs des massages",
    question: "Quels sont les tarifs ?",
    shortAnswer:
      "Les tarifs varient selon le massage et la durée. Voici les formules actuellement proposées.",
    longAnswer: [
      `${relaxantTonique.title} : ${formatPriceLines(relaxantTonique.title).join(" • ")}`,
      `${tonique.title} : ${formatPriceLines(tonique.title).join(" • ")}`,
      `${tantrique.title} : ${formatPriceLines(tantrique.title).join(" • ")}`,
    ],
    keywords: ["tarif", "tarifs", "prix", "combien", "coût", "cout"],
    phrases: [
      "quels sont les tarifs",
      "combien coûte un massage",
      "combien coute un massage",
      "prix massage",
    ],
    links: [
      { href: "/services", label: "Voir les services" },
      { href: "/reservation", label: "Réserver" },
    ],
    suggestions: [
      "Combien de temps dure une séance ?",
      "Quel massage choisir ?",
    ],
  },
  {
    id: "duration",
    intent: "duration",
    title: "Durée des séances",
    question: "Combien de temps dure une séance ?",
    shortAnswer:
      "Les durées disponibles dépendent du massage choisi, avec plusieurs formats selon l’expérience recherchée.",
    longAnswer: [
      `${relaxantTonique.title} : ${Object.keys(relaxantTonique.durations_prices).join(", ")} min.`,
      `${tonique.title} : ${Object.keys(tonique.durations_prices).join(", ")} min.`,
      `${tantrique.title} : ${Object.keys(tantrique.durations_prices).join(", ")} min.`,
      "Si vous hésitez entre deux durées, le plus simple est de choisir selon votre besoin : relâchement rapide, travail plus complet ou expérience plus immersive.",
    ],
    keywords: ["durée", "duree", "combien de temps", "temps", "1h", "1h30", "45 min", "2h"],
    phrases: [
      "combien de temps dure une séance",
      "quelle durée choisir",
      "quelles sont les durées",
    ],
    links: [{ href: "/reservation", label: "Voir les créneaux" }],
    suggestions: [
      "Quels sont les tarifs ?",
      "Quel massage choisir ?",
    ],
  },
  {
    id: "service-relaxant-tonique",
    intent: "relaxation_tonic",
    title: relaxantTonique.title,
    question: "Parlez-moi du massage relaxant tonique",
    shortAnswer: relaxantTonique.description,
    longAnswer: relaxantTonique.long_description.split("\n\n"),
    keywords: ["relaxant tonique", "relaxation tonique", "doux et tonique", "détente et énergie"],
    phrases: [
      "massage relaxant tonique",
      "parlez moi du massage relaxant tonique",
      "comment se déroule le massage relaxant tonique",
    ],
    links: [{ href: "/reservation", label: "Réserver ce massage" }],
    suggestions: [
      "Quels sont les tarifs ?",
      "Comment préparer ma séance ?",
    ],
  },
  {
    id: "service-tonique",
    intent: "tonic",
    title: tonique.title,
    question: "Parlez-moi du massage tonique",
    shortAnswer: tonique.description,
    longAnswer: tonique.long_description.split("\n\n"),
    keywords: ["massage tonique", "tonique", "récupération", "recuperation", "musculaire", "contractures"],
    phrases: [
      "massage tonique",
      "comment se déroule le massage tonique",
      "le massage tonique est il adapté après le sport",
    ],
    links: [{ href: "/reservation", label: "Réserver ce massage" }],
    suggestions: [
      "Peut-on faire un massage après le sport ?",
      "Que faire après un massage tonique ?",
    ],
    articleId: "after-tonic",
  },
  {
    id: "service-tantrique",
    intent: "tantrique",
    title: tantrique.title,
    question: "Parlez-moi du massage tantrique",
    shortAnswer: tantrique.description,
    longAnswer: tantrique.long_description.split("\n\n"),
    keywords: ["massage tantrique", "tantrique", "sensoriel", "présence", "presence", "reconnexion", "souffle"],
    phrases: [
      "massage tantrique",
      "comment se déroule le massage tantrique",
      "en quoi consiste le massage tantrique",
    ],
    links: [{ href: "/reservation", label: "Réserver ce massage" }],
    suggestions: [
      "Comment se passe une première séance ?",
      "Que faire après un massage tantrique ?",
    ],
    articleId: "after-tantrique",
  },
  {
    id: "preparation",
    intent: "preparation_before_session",
    title: "Préparer sa séance",
    question: "Comment préparer sa séance ?",
    shortAnswer:
      "Venez simplement dans un état aussi calme que possible, avec une tenue confortable et en signalant vos besoins du moment au début de la séance.",
    longAnswer: [
      "Il n’y a pas de préparation compliquée. L’essentiel est d’arriver sans précipitation si possible, d’éviter un repas trop lourd juste avant et de venir avec des informations utiles sur vos tensions ou votre fatigue du moment.",
      "Si c’est votre première séance, pas besoin de “bien faire”. Le temps d’échange au début sert justement à poser le cadre et à choisir le bon rythme.",
    ],
    keywords: ["préparer", "preparer", "avant massage", "avant séance", "comment venir", "tenue"],
    phrases: [
      "comment préparer sa séance",
      "comment me préparer avant un massage",
      "que faire avant un massage",
    ],
    links: [
      { href: "/reservation", label: "Réserver une séance" },
      { href: "/contact", label: "Poser une question" },
    ],
    suggestions: [
      "Comment se passe une première séance ?",
      "Quels sont les tarifs ?",
    ],
    articleId: "prepare-session",
  },
  {
    id: "aftercare",
    intent: "aftercare",
    title: "Après la séance",
    question: "Que faire après un massage ?",
    shortAnswer:
      "Après une séance, il est souvent utile de prolonger un peu le calme, de bien s’hydrater et d’éviter d’en faire trop immédiatement.",
    longAnswer: [
      "Le bon réflexe est d’écouter votre corps. Certaines personnes se sentent très détendues, d’autres plus dynamiques mais avec un besoin de douceur dans les heures qui suivent.",
      "Hydratation, respiration calme, marche tranquille ou repos léger sont généralement de bonnes options.",
      "Si vous avez une question particulière après la séance, le mieux est d’en parler directement à Sam.",
    ],
    keywords: ["après massage", "apres massage", "après séance", "apres séance", "que faire après"],
    phrases: [
      "que faire après un massage",
      "comment se sentir après un massage",
      "après la séance",
    ],
    links: [{ href: "/contact", label: "Contacter Sam" }],
    suggestions: [
      "Faut-il boire de l’eau après ?",
      "Faut-il se reposer après un massage ?",
      "Peut-on prendre une douche juste après ?",
    ],
    articleId: "after-massage",
  },
  {
    id: "oils-hydration-rest",
    intent: "oils",
    title: "Hydratation, douche et repos",
    question: "Faut-il boire de l’eau, se reposer ou éviter la douche après ?",
    shortAnswer:
      "En général, bien s’hydrater et garder un peu de calme après la séance sont de bons repères. La douche n’est pas interdite, mais il est souvent agréable de laisser la séance se prolonger un peu.",
    longAnswer: [
      "Boire de l’eau après le massage est une habitude simple et utile pour accompagner le retour à un bon confort corporel.",
      "Il n’est pas nécessaire de s’immobiliser totalement, mais éviter de repartir immédiatement sur un rythme trop intense est souvent une bonne idée.",
      "Pour la douche, rien d’absolu : beaucoup de personnes préfèrent attendre un peu pour conserver la sensation de la séance, surtout si elles souhaitent rester dans un état de calme.",
    ],
    keywords: ["eau", "hydrater", "hydratation", "douche", "reposer", "repos", "huiles", "huile"],
    phrases: [
      "faut il boire de l eau après",
      "peut on prendre une douche juste après",
      "faut il se reposer après un massage",
    ],
    links: [{ href: "/contact", label: "Demander conseil" }],
    suggestions: [
      "Que faire après un massage tonique ?",
      "Que faire après un massage tantrique ?",
    ],
    articleId: "rest-after-massage",
  },
  {
    id: "first-session",
    intent: "first_session",
    title: "Première séance",
    question: "Comment se passe une première séance ?",
    shortAnswer:
      "Une première séance commence par un temps d’accueil et d’échange pour comprendre votre besoin, poser un cadre clair et adapter le massage.",
    longAnswer: [
      "Le début de la séance sert à parler de vos attentes, de votre état du moment, de vos tensions et du massage le plus adapté.",
      "Le cadre est posé simplement, avec douceur et clarté. L’objectif est que vous puissiez vous sentir à l’aise, écouté et en confiance.",
      "Ensuite, la séance se déroule à votre rythme, avec une approche personnalisée.",
    ],
    keywords: ["première séance", "premiere seance", "premier massage", "première fois", "début"],
    phrases: [
      "comment se passe une première séance",
      "c est ma première séance",
      "premier massage chez samass",
    ],
    links: [{ href: "/contact", label: "Poser une question avant de réserver" }],
    suggestions: [
      "Comment préparer ma séance ?",
      "Quel massage choisir ?",
      "Comment réserver ?",
    ],
  },
  {
    id: "frequency",
    intent: "frequency",
    title: "Fréquence des massages",
    question: "À quelle fréquence recevoir un massage ?",
    shortAnswer:
      "Il n’existe pas de fréquence idéale pour tout le monde. Cela dépend surtout de votre rythme de vie, de vos tensions et de votre besoin du moment.",
    longAnswer: [
      "Certaines personnes réservent ponctuellement, d’autres préfèrent un rythme plus régulier. L’important est de choisir un rythme cohérent avec votre quotidien.",
      "Si vous avez besoin d’aide pour choisir une fréquence réaliste, Sam peut vous orienter simplement.",
    ],
    keywords: ["fréquence", "frequence", "régulièrement", "combien de fois", "souvent"],
    phrases: [
      "à quelle fréquence recevoir un massage",
      "combien de fois faire un massage",
      "faut il venir régulièrement",
    ],
    links: [{ href: "/contact", label: "Demander conseil" }],
    suggestions: [
      "Peut-on faire un massage après le sport ?",
      "Quel massage choisir ?",
    ],
    articleId: "frequency",
  },
  {
    id: "sport-recovery",
    intent: "massage_after_sport",
    title: "Massage et récupération sportive",
    question: "Peut-on faire un massage après le sport ?",
    shortAnswer:
      "Oui, cela peut être pertinent selon votre état du moment, surtout si vous cherchez à délier certaines tensions et à récupérer plus confortablement.",
    longAnswer: [
      "Après le sport, le massage tonique est souvent celui qui correspond le mieux à une logique de récupération musculaire et de circulation.",
      "Le choix dépend aussi de votre fatigue réelle, de l’intensité de l’effort et de ce que vous recherchez : récupération, apaisement ou recentrage.",
      "Si vous avez une blessure, une douleur importante ou une situation médicale particulière, mieux vaut le signaler avant la séance et demander un avis de santé si nécessaire.",
    ],
    keywords: ["sport", "après sport", "apres sport", "récupération", "recuperation", "musculaire"],
    phrases: [
      "peut on faire un massage après le sport",
      "massage après le sport",
      "massage de récupération",
    ],
    links: [{ href: "/services", label: "Voir le massage tonique" }],
    suggestions: [
      "Que faire après un massage tonique ?",
      "Quel massage choisir ?",
    ],
    articleId: "massage-sport",
  },
  {
    id: "contraindications",
    intent: "contraindications",
    title: "Précautions et contre-indications simples",
    question: "Y a-t-il des précautions à prendre ?",
    shortAnswer:
      "Oui, si vous avez une douleur importante, une pathologie connue, un traitement, de la fièvre, une infection, une blessure ou une situation particulière, il faut le signaler avant la séance.",
    longAnswer: [
      "L’assistant peut donner des repères généraux, mais il ne remplace pas un avis de santé. En cas de doute médical, le plus prudent est de demander l’avis d’un professionnel de santé.",
      "Le bon réflexe est aussi d’en parler à Sam avant la séance afin d’adapter le cadre ou de voir ensemble si le massage est approprié.",
      "Le massage bien-être ne doit jamais être présenté comme une promesse de résultat médical.",
    ],
    keywords: [
      "contre indication",
      "contre indication massage",
      "précaution",
      "precaution",
      "fièvre",
      "fievre",
      "blessure",
      "douleur",
      "pathologie",
      "traitement",
      "grossesse",
      "infection",
    ],
    phrases: [
      "y a t il des précautions à prendre",
      "y a t il des contre indications",
      "est ce adapté si j ai une douleur",
      "massage et pathologie",
    ],
    links: [{ href: "/contact", label: "Parler de votre situation à Sam" }],
    suggestions: [
      "Comment se passe une première séance ?",
      "Quel massage choisir ?",
    ],
  },
  {
    id: "stress-fatigue",
    intent: "service_details",
    title: "Massage pour stress, fatigue ou tensions",
    question: "Le massage est-il adapté si on a du stress, de la fatigue ou des tensions ?",
    shortAnswer:
      "Oui, beaucoup de demandes tournent autour du stress, de la fatigue et des tensions. Le massage se choisit ensuite selon votre besoin précis du moment.",
    longAnswer: [
      "Pour un besoin de détente avec un peu de relance, le massage relaxant tonique est souvent une bonne porte d’entrée.",
      "Pour une fatigue musculaire plus marquée ou des zones contractées, le massage tonique peut mieux correspondre.",
      "Pour une approche plus lente, sensorielle et axée sur la présence au corps, le massage tantrique peut être envisagé dans le cadre proposé par SAMASS.",
    ],
    keywords: ["stress", "fatigue", "tensions", "anxieux", "détente", "detente"],
    phrases: [
      "le massage est il adapté si on a des tensions",
      "massage pour stress",
      "massage pour fatigue",
    ],
    links: [
      { href: "/services", label: "Voir les massages" },
      { href: "/contact", label: "Demander conseil" },
    ],
    suggestions: [
      "Quel massage choisir ?",
      "Quelle est la différence entre les massages ?",
    ],
  },
  {
    id: "booking",
    intent: "booking",
    title: "Réservation",
    question: "Comment réserver ?",
    shortAnswer:
      "Vous pouvez réserver directement depuis le site en choisissant votre massage, la durée puis un créneau disponible.",
    longAnswer: [
      "Le parcours de réservation vous guide pas à pas : choix du massage, de la durée, du créneau, puis saisie de vos coordonnées.",
      "Si la réservation en ligne est momentanément indisponible ou si aucun créneau n’apparaît, vous pouvez toujours passer par la page Contact pour organiser votre rendez-vous avec Sam.",
    ],
    keywords: ["réserver", "reservation", "comment réserver", "comment reserver", "créneau", "creneau"],
    phrases: [
      "comment réserver",
      "comment reserver",
      "comment prendre rendez vous",
      "je veux réserver",
    ],
    links: [
      { href: "/reservation", label: "Ouvrir la réservation" },
      { href: "/contact", label: "Contacter Sam" },
    ],
    suggestions: [
      "Que faire si aucun créneau n’est disponible ?",
      "Quels sont les tarifs ?",
    ],
  },
  {
    id: "booking-no-slots",
    intent: "booking",
    title: "Aucun créneau disponible",
    question: "Que faire si aucun créneau n’est disponible ?",
    shortAnswer:
      "Si aucun créneau n’est disponible, le plus simple est de contacter Sam directement pour voir s’il est possible d’organiser un rendez-vous autrement.",
    longAnswer: [
      "Le planning affiché dépend des disponibilités ouvertes. S’il n’y a rien au moment de votre visite, cela ne veut pas forcément dire qu’aucune solution n’est possible.",
      "La page Contact reste la meilleure option pour expliquer votre besoin, vos contraintes horaires et voir avec Sam s’il peut vous proposer un autre créneau.",
    ],
    keywords: ["aucun créneau", "aucun creneau", "pas de disponibilité", "pas de disponibilite", "indisponible"],
    phrases: [
      "que faire si aucun créneau n est disponible",
      "je ne vois aucun créneau",
      "pas de disponibilité",
    ],
    links: [{ href: "/contact", label: "Contacter Sam" }],
    suggestions: [
      "Comment réserver ?",
      "Quel massage choisir ?",
    ],
  },
  {
    id: "contact",
    intent: "contact",
    title: "Contacter SAMASS",
    question: "Comment contacter Sam ?",
    shortAnswer:
      "Pour une question ou une demande particulière, la page Contact est le meilleur point d’entrée. Vous pouvez aussi utiliser le téléphone si besoin.",
    longAnswer: [
      "La page Contact vous permet d’écrire directement à Sam et d’expliquer votre besoin.",
      "Si votre demande est urgente ou si vous préférez un échange direct, le téléphone reste adapté.",
    ],
    keywords: ["contact", "contacter", "email", "téléphone", "telephone", "joindre sam"],
    phrases: [
      "comment contacter sam",
      "j ai une question",
      "comment vous joindre",
    ],
    links: [{ href: "/contact", label: "Aller à la page Contact" }],
    suggestions: [
      "Comment réserver ?",
      "Quel massage choisir ?",
    ],
  },
];

export const ASSISTANT_SCOPE_NOTE =
  "Je réponds surtout aux questions liées aux massages SAMASS, au déroulement des séances, aux tarifs, à la réservation et aux conseils généraux autour de l’expérience.";

export const ASSISTANT_MEDICAL_BOUNDARY =
  "Si votre question concerne une douleur importante, une pathologie, un traitement ou une situation médicale particulière, le plus prudent est d’en parler à Sam avant la séance et, si besoin, de demander l’avis d’un professionnel de santé.";

export const ASSISTANT_SERVICE_OVERVIEW = SAMASS_SERVICE_CATALOG.map((service) => ({
  title: service.title,
  description: service.description,
  durations_prices: { ...service.durations_prices },
}));
