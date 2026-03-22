import {
  ASSISTANT_ARTICLES,
  ASSISTANT_KNOWLEDGE_BASE,
  ASSISTANT_MEDICAL_BOUNDARY,
  ASSISTANT_SCOPE_NOTE,
  ASSISTANT_STARTER_SUGGESTIONS,
  AssistantArticle,
  AssistantIntent,
  AssistantKnowledgeEntry,
  AssistantLink,
} from "./assistantKnowledge";
import { getServiceCatalogEntry } from "./serviceCatalog";

type QueryIntent =
  | "pricing"
  | "duration"
  | "process"
  | "preparation"
  | "aftercare"
  | "booking"
  | "contact"
  | "contraindications"
  | "frequency"
  | "sport"
  | "first_session"
  | "choose"
  | "difference"
  | "unknown";

type ServiceKey = "relaxant-tonique" | "tonique" | "tantrique";

type ServiceTarget = {
  key: ServiceKey;
  title: string;
  aliases: string[];
};

type IntentResolution = {
  intent: QueryIntent;
  score: number;
};

export type AssistantMatch = {
  id: string;
  title: string;
  intent: AssistantIntent;
  score: number;
};

export type AssistantResponse = {
  type: "knowledge" | "medical-boundary" | "out-of-scope";
  title: string;
  shortAnswer: string;
  longAnswer: string[];
  links: AssistantLink[];
  suggestions: string[];
  article?: AssistantArticle;
  matches: AssistantMatch[];
};

const DEFAULT_LINKS: AssistantLink[] = [
  { href: "/services", label: "Voir les massages" },
  { href: "/reservation", label: "Réserver" },
  { href: "/contact", label: "Contacter Sam" },
];

const SERVICE_TARGETS: ServiceTarget[] = [
  {
    key: "relaxant-tonique",
    title: "Massage Relaxant Tonique",
    aliases: [
      "massage relaxant tonique",
      "relaxant tonique",
      "relaxation tonique",
      "massage relaxation tonique",
      "relax tonique",
    ],
  },
  {
    key: "tantrique",
    title: "Massage Tantrique",
    aliases: [
      "massage tantrique",
      "tantrique",
      "tantrik",
      "massage tantrik",
      "massage tantra",
    ],
  },
  {
    key: "tonique",
    title: "Massage Tonique",
    aliases: [
      "massage tonique",
      "tonique",
      "tonik",
      "massage tonik",
    ],
  },
];

const MEDICAL_KEYWORDS = [
  "douleur importante",
  "douleur forte",
  "pathologie",
  "traitement",
  "infection",
  "fievre",
  "fièvre",
  "grossesse",
  "enceinte",
  "operation",
  "opération",
  "blessure",
  "entorse",
  "fracture",
  "maladie",
  "soigne",
  "remplace un traitement",
];

const INTENT_KEYWORDS: Record<QueryIntent, string[]> = {
  pricing: [
    "tarif",
    "tarifs",
    "prix",
    "combien",
    "cout",
    "coute",
    "coût",
    "euro",
    "euros",
  ],
  duration: [
    "duree",
    "durée",
    "combien de temps",
    "temps",
    "1h",
    "1h30",
    "2h",
    "45 min",
    "60 min",
    "90 min",
    "120 min",
    "existe",
    "disponible en",
    "propose en",
    "dure t il",
  ],
  process: [
    "comment se deroule",
    "comment se déroule",
    "deroulement",
    "déroulement",
    "comment se passe",
    "en quoi consiste",
    "comment ca se passe",
  ],
  preparation: [
    "avant massage",
    "avant une seance",
    "avant une séance",
    "preparer",
    "préparer",
    "venir habille",
    "venir habillé",
    "tenue",
    "manger avant",
    "que faire avant",
  ],
  aftercare: [
    "apres massage",
    "après massage",
    "apres seance",
    "après séance",
    "boire",
    "eau",
    "douche",
    "repos",
    "reposer",
    "que faire apres",
  ],
  booking: [
    "reserver",
    "réserver",
    "reservation",
    "réservation",
    "rendez vous",
    "rdv",
    "créneau",
    "creneau",
    "disponibilite",
    "disponibilité",
  ],
  contact: [
    "contact",
    "contacter",
    "joindre",
    "email",
    "telephone",
    "téléphone",
    "parler a sam",
  ],
  contraindications: [
    "douleur importante",
    "blessure",
    "fievre",
    "fièvre",
    "enceinte",
    "grossesse",
    "pathologie",
    "traitement",
    "soigne",
    "remplace",
  ],
  frequency: [
    "frequence",
    "fréquence",
    "combien de fois",
    "par mois",
    "souvent",
    "regulierement",
    "régulièrement",
  ],
  sport: [
    "sport",
    "sportif",
    "recuperation",
    "récupération",
    "musculaire",
    "apres le sport",
    "après le sport",
  ],
  first_session: [
    "premiere seance",
    "première séance",
    "premiere fois",
    "première fois",
    "apprehension",
    "appréhension",
    "premier massage",
  ],
  choose: [
    "quel massage",
    "choisir",
    "me convient",
    "pour moi",
    "stress",
    "fatigue",
    "mal au dos",
    "tensions",
  ],
  difference: [
    "difference",
    "différence",
    "comparer",
    "comparaison",
    "quelle est la difference",
  ],
  unknown: [],
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) =>
    Array.from({ length: a.length + 1 }, (_, col) =>
      row === 0 ? col : col === 0 ? row : 0
    )
  );

  for (let row = 1; row <= b.length; row += 1) {
    for (let col = 1; col <= a.length; col += 1) {
      const cost = a[col - 1] === b[row - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

function hasCloseTokenMatch(queryTokens: string[], candidate: string) {
  const candidateTokens = tokenize(candidate);

  return candidateTokens.every((candidateToken) =>
    queryTokens.some((queryToken) => {
      if (queryToken === candidateToken) return true;
      if (
        queryToken.includes(candidateToken) ||
        candidateToken.includes(queryToken)
      ) {
        return true;
      }
      if (candidateToken.length >= 5 && queryToken.length >= 5) {
        return levenshtein(queryToken, candidateToken) <= 1;
      }
      return false;
    })
  );
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function formatDurationLabel(duration: number) {
  if (duration === 60) return "1h";
  if (duration === 90) return "1h30";
  if (duration === 120) return "2h";
  return `${duration} min`;
}

function formatDurationList(durations: number[]) {
  return durations.map(formatDurationLabel).join(", ");
}

function getServiceData(title: string) {
  const service = getServiceCatalogEntry(title);
  if (!service) {
    throw new Error(`Missing service catalog entry for "${title}".`);
  }
  return service;
}

function findArticle(articleId: string) {
  return ASSISTANT_ARTICLES.find((article) => article.id === articleId);
}

function findEntry(entryId: string) {
  const entry = ASSISTANT_KNOWLEDGE_BASE.find((item) => item.id === entryId);
  if (!entry) {
    throw new Error(`Missing assistant knowledge entry "${entryId}".`);
  }
  return entry;
}

function buildMatches(entry: AssistantKnowledgeEntry, score = 100): AssistantMatch[] {
  return [
    {
      id: entry.id,
      title: entry.title,
      intent: entry.intent,
      score,
    },
  ];
}

function buildKnowledgeResponse(
  entry: AssistantKnowledgeEntry,
  overrides?: Partial<AssistantResponse>
): AssistantResponse {
  const article = entry.articleId ? findArticle(entry.articleId) : undefined;

  return {
    type: "knowledge",
    title: entry.title,
    shortAnswer: entry.shortAnswer,
    longAnswer: entry.longAnswer,
    links: entry.links?.length ? entry.links : DEFAULT_LINKS,
    suggestions: entry.suggestions?.length
      ? entry.suggestions
      : ASSISTANT_STARTER_SUGGESTIONS.slice(0, 4),
    article,
    matches: buildMatches(entry),
    ...overrides,
  };
}

function buildMedicalBoundaryResponse(): AssistantResponse {
  return {
    type: "medical-boundary",
    title: "Question sensible",
    shortAnswer:
      "Pour ce type de sujet, le plus prudent est de rester sur des repères simples et de ne pas improviser de conseil médical.",
    longAnswer: [ASSISTANT_MEDICAL_BOUNDARY],
    links: [{ href: "/contact", label: "Parler de votre situation à Sam" }],
    suggestions: [
      "Y a-t-il des précautions à prendre ?",
      "Comment se passe une première séance ?",
      "Quel massage choisir ?",
    ],
    matches: [],
  };
}

function buildOutOfScopeResponse(): AssistantResponse {
  return {
    type: "out-of-scope",
    title: "Je peux surtout aider sur les massages SAMASS",
    shortAnswer: ASSISTANT_SCOPE_NOTE,
    longAnswer: [
      "Je peux vous guider sur les massages proposés, les durées, les tarifs, la préparation d’une séance, l’après-séance, la réservation et le contact.",
      "Si vous avez une question plus précise sur votre besoin, reformulez-la simplement et je vous orienterai au mieux.",
    ],
    links: DEFAULT_LINKS,
    suggestions: ASSISTANT_STARTER_SUGGESTIONS.slice(0, 6),
    matches: [],
  };
}

function detectServiceTarget(query: string, queryTokens: string[]) {
  const normalizedQuery = normalizeText(query);
  const hasToken = (candidate: string) =>
    queryTokens.some((token) => {
      const normalizedCandidate = normalizeText(candidate);
      if (token === normalizedCandidate) return true;
      if (
        token.length >= 5 &&
        normalizedCandidate.length >= 5 &&
        levenshtein(token, normalizedCandidate) <= 1
      ) {
        return true;
      }
      return false;
    });

  const hasExactAlias = (aliases: string[]) =>
    aliases.some((alias) => normalizedQuery.includes(normalizeText(alias)));

  if (
    hasExactAlias(SERVICE_TARGETS[0].aliases) ||
    ((hasToken("relaxant") || hasToken("relaxation")) &&
      (hasToken("tonique") || hasToken("tonik")))
  ) {
    return SERVICE_TARGETS[0];
  }

  if (
    hasExactAlias(SERVICE_TARGETS[1].aliases) ||
    hasToken("tantrique") ||
    hasToken("tantrik") ||
    hasToken("tantra")
  ) {
    return SERVICE_TARGETS[1];
  }

  if (
    hasExactAlias(SERVICE_TARGETS[2].aliases) ||
    hasToken("tonique") ||
    hasToken("tonik")
  ) {
    return SERVICE_TARGETS[2];
  }

  return null;
}

function detectIntent(query: string, queryTokens: string[]): IntentResolution {
  const normalizedQuery = normalizeText(query);

  if (
    normalizedQuery.includes("aucun creneau") ||
    normalizedQuery.includes("pas de disponibilite") ||
    normalizedQuery.includes("aucune disponibilite")
  ) {
    return { intent: "booking", score: 100 };
  }

  if (
    normalizedQuery.includes("premiere seance") ||
    normalizedQuery.includes("premiere fois") ||
    normalizedQuery.includes("apprehension")
  ) {
    return { intent: "first_session", score: 100 };
  }

  if (
    normalizedQuery.includes("quel massage") ||
    normalizedQuery.includes("massage choisir") ||
    normalizedQuery.includes("me convient")
  ) {
    return { intent: "choose", score: 100 };
  }

  if (
    normalizedQuery.includes("difference") ||
    normalizedQuery.includes("comparaison")
  ) {
    return { intent: "difference", score: 100 };
  }

  if (
    normalizedQuery.includes("se deroule") ||
    normalizedQuery.includes("deroulement") ||
    normalizedQuery.includes("en quoi consiste")
  ) {
    return { intent: "process", score: 100 };
  }

  if (
    normalizedQuery.includes("apres massage") ||
    normalizedQuery.includes("que faire apres") ||
    normalizedQuery.includes("douche") ||
    normalizedQuery.includes("eau") ||
    normalizedQuery.includes("reposer") ||
    normalizedQuery.includes("repos")
  ) {
    return { intent: "aftercare", score: 100 };
  }

  const baseScores: IntentResolution[] = (Object.keys(INTENT_KEYWORDS) as QueryIntent[])
    .filter((intent) => intent !== "unknown")
    .map((intent) => {
      let score = 0;
      for (const keyword of INTENT_KEYWORDS[intent]) {
        const normalizedKeyword = normalizeText(keyword);
        if (!normalizedKeyword) continue;

        if (normalizedQuery.includes(normalizedKeyword)) {
          score += normalizedKeyword.includes(" ") ? 8 : 4;
        } else if (hasCloseTokenMatch(queryTokens, normalizedKeyword)) {
          score += 2;
        }
      }
      return { intent, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = baseScores[0];
  if (!best || best.score <= 0) {
    return { intent: "unknown", score: 0 };
  }
  return best;
}

function extractRequestedDuration(query: string) {
  const normalizedQuery = normalizeText(query);

  if (
    /\b120\s*min\b/.test(normalizedQuery) ||
    /\b2\s*h\b/.test(normalizedQuery) ||
    /\b2\s*heures?\b/.test(normalizedQuery)
  ) {
    return 120;
  }

  if (
    /\b90\s*min\b/.test(normalizedQuery) ||
    /\b1\s*h\s*30\b/.test(normalizedQuery) ||
    /\b1h30\b/.test(normalizedQuery)
  ) {
    return 90;
  }

  if (
    /\b60\s*min\b/.test(normalizedQuery) ||
    /\b1\s*h\b/.test(normalizedQuery) ||
    /\b1\s*heure\b/.test(normalizedQuery)
  ) {
    return 60;
  }

  if (/\b45\s*min\b/.test(normalizedQuery) || /\b45\s*minutes?\b/.test(normalizedQuery)) {
    return 45;
  }

  return null;
}

function scoreEntry(query: string, queryTokens: string[], entry: AssistantKnowledgeEntry) {
  const normalizedQuery = normalizeText(query);
  let score = 0;

  const question = normalizeText(entry.question);
  if (normalizedQuery === question) score += 20;
  else if (normalizedQuery.includes(question)) score += 12;

  for (const phrase of entry.phrases) {
    const normalizedPhrase = normalizeText(phrase);
    if (!normalizedPhrase) continue;

    if (normalizedQuery === normalizedPhrase) score += 18;
    else if (normalizedQuery.includes(normalizedPhrase)) score += 10;
    else if (hasCloseTokenMatch(queryTokens, normalizedPhrase)) score += 6;
  }

  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;

    if (normalizedQuery.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(" ") ? 5 : 3;
    } else if (hasCloseTokenMatch(queryTokens, normalizedKeyword)) {
      score += 1;
    }
  }

  return score;
}

function buildServiceLinks(serviceTitle: string): AssistantLink[] {
  return [
    { href: "/reservation", label: `Réserver ${serviceTitle}` },
    { href: "/services", label: "Voir les massages" },
    { href: "/contact", label: "Contacter Sam" },
  ];
}

function buildServicePricingResponse(serviceTarget: ServiceTarget, requestedDuration: number | null) {
  const service = getServiceData(serviceTarget.title);
  const durations = Object.keys(service.durations_prices).map(Number).sort((a, b) => a - b);

  if (requestedDuration) {
    const price = service.durations_prices[String(requestedDuration)];
    if (price) {
      return {
        type: "knowledge" as const,
        title: `Tarif du ${service.title}`,
        shortAnswer: `Oui, le ${service.title} est proposé en ${formatDurationLabel(
          requestedDuration
        )}, au tarif de ${price} €.`,
        longAnswer: [
          `Formules actuellement proposées : ${durations
            .map((duration) => `${formatDurationLabel(duration)} : ${service.durations_prices[String(duration)]} €`)
            .join(" • ")}.`,
        ],
        links: buildServiceLinks(service.title),
        suggestions: [
          `Combien dure le ${service.title.toLowerCase()} ?`,
          `Comment se déroule le ${service.title.toLowerCase()} ?`,
          "Comment réserver ?",
        ],
        matches: [],
      };
    }

    return {
      type: "knowledge" as const,
      title: `Tarifs du ${service.title}`,
      shortAnswer: `Non, le ${service.title} n’est pas proposé en ${formatDurationLabel(
        requestedDuration
      )}.`,
      longAnswer: [
        `Formules actuellement proposées : ${durations
          .map((duration) => `${formatDurationLabel(duration)} : ${service.durations_prices[String(duration)]} €`)
          .join(" • ")}.`,
      ],
      links: buildServiceLinks(service.title),
      suggestions: [
        `Combien dure le ${service.title.toLowerCase()} ?`,
        "Quels sont les tarifs ?",
      ],
      matches: [],
    };
  }

  return {
    type: "knowledge" as const,
    title: `Tarifs du ${service.title}`,
    shortAnswer: `Voici les tarifs actuellement proposés pour le ${service.title}.`,
    longAnswer: durations.map(
      (duration) =>
        `${formatDurationLabel(duration)} : ${service.durations_prices[String(duration)]} €`
    ),
    links: buildServiceLinks(service.title),
    suggestions: [
      `Combien dure le ${service.title.toLowerCase()} ?`,
      `Comment se déroule le ${service.title.toLowerCase()} ?`,
      "Comment réserver ?",
    ],
    matches: [],
  };
}

function buildServiceDurationResponse(serviceTarget: ServiceTarget, requestedDuration: number | null) {
  const service = getServiceData(serviceTarget.title);
  const durations = Object.keys(service.durations_prices).map(Number).sort((a, b) => a - b);

  if (requestedDuration) {
    const exists = durations.includes(requestedDuration);

    return {
      type: "knowledge" as const,
      title: `Durée du ${service.title}`,
      shortAnswer: exists
        ? `Oui, le ${service.title} existe en ${formatDurationLabel(requestedDuration)}.`
        : `Non, le ${service.title} n’est pas proposé en ${formatDurationLabel(requestedDuration)}.`,
      longAnswer: [
        `Durées actuellement proposées : ${durations
          .map((duration) => `${formatDurationLabel(duration)} (${service.durations_prices[String(duration)]} €)`)
          .join(" • ")}.`,
      ],
      links: buildServiceLinks(service.title),
      suggestions: [
        `Quels sont les tarifs du ${service.title.toLowerCase()} ?`,
        `Comment se déroule le ${service.title.toLowerCase()} ?`,
      ],
      matches: [],
    };
  }

  return {
    type: "knowledge" as const,
    title: `Durées du ${service.title}`,
    shortAnswer: `Le ${service.title} est actuellement proposé en ${formatDurationList(
      durations
    )}.`,
    longAnswer: durations.map(
      (duration) =>
        `${formatDurationLabel(duration)} : ${service.durations_prices[String(duration)]} €`
    ),
    links: buildServiceLinks(service.title),
    suggestions: [
      `Quels sont les tarifs du ${service.title.toLowerCase()} ?`,
      `Comment se déroule le ${service.title.toLowerCase()} ?`,
    ],
    matches: [],
  };
}

function buildServiceProcessResponse(serviceTarget: ServiceTarget) {
  const service = getServiceData(serviceTarget.title);

  return {
    type: "knowledge" as const,
    title: `Déroulement du ${service.title}`,
    shortAnswer: service.description,
    longAnswer: service.long_description.split("\n\n"),
    links: buildServiceLinks(service.title),
    suggestions: [
      `Quels sont les tarifs du ${service.title.toLowerCase()} ?`,
      `Combien dure le ${service.title.toLowerCase()} ?`,
      "Comment préparer ma séance ?",
    ],
    matches: [],
  };
}

function buildServiceAftercareResponse(serviceTarget: ServiceTarget) {
  const service = getServiceData(serviceTarget.title);
  const articleId =
    serviceTarget.key === "tantrique"
      ? "after-tantrique"
      : serviceTarget.key === "tonique"
      ? "after-tonic"
      : "after-massage";
  const article = findArticle(articleId);

  const serviceSpecificIntro =
    serviceTarget.key === "tantrique"
      ? "Après un massage tantrique, l’idéal est souvent de préserver un peu de calme pour intégrer la séance avec douceur."
      : serviceTarget.key === "tonique"
      ? "Après un massage tonique, mieux vaut éviter de repartir immédiatement sur un effort intense et laisser le corps intégrer le travail musculaire."
      : "Après un massage relaxant tonique, l’idéal est de prolonger un peu le calme, de bien s’hydrater et de laisser le corps garder les effets de la séance.";

  return {
    type: "knowledge" as const,
    title: `Après le ${service.title}`,
    shortAnswer: serviceSpecificIntro,
    longAnswer: article ? article.body : findEntry("aftercare").longAnswer,
    article,
    links: buildServiceLinks(service.title),
    suggestions: [
      "Faut-il boire de l’eau après ?",
      "Peut-on prendre une douche après ?",
      "Faut-il se reposer après un massage ?",
    ],
    matches: [],
  };
}

function buildServiceRecommendationResponse(serviceTarget: ServiceTarget) {
  const service = getServiceData(serviceTarget.title);
  return {
    type: "knowledge" as const,
    title: service.title,
    shortAnswer: service.description,
    longAnswer: [
      ...service.long_description.split("\n\n").slice(0, 2),
      `Durées proposées : ${Object.keys(service.durations_prices)
        .map((duration) => formatDurationLabel(Number(duration)))
        .join(", ")}.`,
    ],
    links: buildServiceLinks(service.title),
    suggestions: [
      `Quels sont les tarifs du ${service.title.toLowerCase()} ?`,
      `Combien dure le ${service.title.toLowerCase()} ?`,
      `Comment se déroule le ${service.title.toLowerCase()} ?`,
    ],
    matches: [],
  };
}

function buildServiceSportResponse(serviceTarget: ServiceTarget) {
  if (serviceTarget.key === "tonique") {
    return {
      type: "knowledge" as const,
      title: "Massage tonique et sport",
      shortAnswer:
        "Oui, le massage tonique est souvent le plus adapté après le sport si vous cherchez une récupération plus musculaire et un travail plus profond.",
      longAnswer: findArticle("massage-sport")?.body || findEntry("sport-recovery").longAnswer,
      article: findArticle("massage-sport"),
      links: buildServiceLinks("Massage Tonique"),
      suggestions: [
        "Que faire après un massage tonique ?",
        "Combien dure le massage tonique ?",
      ],
      matches: [],
    };
  }

  if (serviceTarget.key === "relaxant-tonique") {
    return {
      type: "knowledge" as const,
      title: "Massage relaxant tonique et sport",
      shortAnswer:
        "Le massage relaxant tonique peut convenir après le sport si vous cherchez à la fois relâcher les tensions et retrouver un peu de fluidité, avec une intensité moins directement axée récupération profonde qu’un tonique pur.",
      longAnswer: [
        "Si votre objectif principal est la récupération musculaire appuyée, le massage tonique reste généralement le plus ciblé.",
        "Si vous voulez relâcher les tensions tout en gardant une dimension apaisante, le massage relaxant tonique peut être une bonne option.",
      ],
      links: buildServiceLinks("Massage Relaxant Tonique"),
      suggestions: [
        "Quel massage après le sport ?",
        "Quels sont les tarifs du massage relaxant tonique ?",
      ],
      matches: [],
    };
  }

  return {
    type: "knowledge" as const,
    title: "Massage tantrique et sport",
    shortAnswer:
      "Le massage tantrique n’est généralement pas celui que l’on choisit en premier dans une logique de récupération sportive. Il répond plutôt à un besoin de présence, de lenteur et de reconnexion au corps.",
    longAnswer: [
      "Après le sport, si vous cherchez avant tout un travail orienté récupération musculaire, le massage tonique sera souvent plus adapté.",
      "Le massage tantrique peut avoir du sens dans une autre intention, plus sensorielle et introspective.",
    ],
    links: buildServiceLinks("Massage Tantrique"),
    suggestions: [
      "Quel massage après le sport ?",
      "Quelle est la différence entre les massages ?",
    ],
    matches: [],
  };
}

function buildServicePreparationResponse(serviceTarget: ServiceTarget, normalizedQuery: string) {
  const service = getServiceData(serviceTarget.title);
  let shortAnswer =
    `Pour le ${service.title}, l’essentiel est de venir dans une tenue confortable, sans précipitation si possible, et de signaler simplement votre état du moment au début de la séance.`;

  if (normalizedQuery.includes("manger")) {
    shortAnswer =
      "Mieux vaut éviter un repas trop lourd juste avant la séance. L’idée est d’arriver le plus confortablement possible.";
  } else if (
    normalizedQuery.includes("habille") ||
    normalizedQuery.includes("habillé") ||
    normalizedQuery.includes("tenue")
  ) {
    shortAnswer =
      "Une tenue simple et confortable est généralement le meilleur choix pour venir à votre séance.";
  }

  return {
    type: "knowledge" as const,
    title: `Préparer votre ${service.title.toLowerCase()}`,
    shortAnswer,
    longAnswer: findEntry("preparation").longAnswer,
    article: findArticle("prepare-session"),
    links: buildServiceLinks(service.title),
    suggestions: [
      "Comment se passe une première séance ?",
      `Comment se déroule le ${service.title.toLowerCase()} ?`,
    ],
    matches: [],
  };
}

function buildGeneralSessionProcessResponse() {
  return {
    type: "knowledge" as const,
    title: "Déroulement d’une séance",
    shortAnswer:
      "Une séance commence par un temps d’accueil et d’échange, puis le massage est ajusté à votre rythme, à vos tensions et à votre besoin du moment.",
    longAnswer: [
      "Le début de la séance sert à poser un cadre simple et clair : besoin du moment, zones de tension, intensité recherchée, durée et rythme souhaité.",
      "Vous vous installez ensuite dans un espace calme et la séance se déroule de façon personnalisée.",
      "Elle se termine par un retour plus posé afin de vous laisser repartir dans un état plus détendu et plus ancré.",
    ],
    links: DEFAULT_LINKS,
    suggestions: [
      "Quelle est la différence entre les massages ?",
      "Comment se passe une première séance ?",
      "Quel massage choisir ?",
    ],
    matches: [],
  };
}

function buildPreparationResponse(normalizedQuery: string) {
  const entry = findEntry("preparation");
  let shortAnswer = entry.shortAnswer;

  if (normalizedQuery.includes("manger")) {
    shortAnswer =
      "Il vaut mieux éviter un repas trop lourd juste avant un massage afin d’arriver plus confortablement à la séance.";
  } else if (
    normalizedQuery.includes("habille") ||
    normalizedQuery.includes("habillé") ||
    normalizedQuery.includes("tenue")
  ) {
    shortAnswer =
      "Une tenue simple et confortable est généralement préférable pour venir à votre séance.";
  } else if (normalizedQuery.includes("apprehension") || normalizedQuery.includes("appréhension")) {
    shortAnswer =
      "C’est tout à fait normal d’avoir un peu d’appréhension. Le temps d’accueil au début sert justement à poser un cadre rassurant et à avancer à votre rythme.";
  }

  return buildKnowledgeResponse(entry, {
    shortAnswer,
    article: findArticle("prepare-session"),
  });
}

function buildAftercareResponse(normalizedQuery: string) {
  const oilsEntry = findEntry("oils-hydration-rest");
  const aftercareEntry = findEntry("aftercare");

  if (
    normalizedQuery.includes("eau") ||
    normalizedQuery.includes("boire")
  ) {
    return buildKnowledgeResponse(oilsEntry, {
      shortAnswer:
        "Oui, boire de l’eau après un massage est un bon réflexe simple pour rester confortable et prolonger la sensation de fluidité.",
    });
  }

  if (
    normalizedQuery.includes("douche") ||
    normalizedQuery.includes("reposer") ||
    normalizedQuery.includes("repos")
  ) {
    return buildKnowledgeResponse(oilsEntry);
  }

  return buildKnowledgeResponse(aftercareEntry, {
    article: findArticle("after-massage"),
  });
}

function buildRecommendationResponse(normalizedQuery: string) {
  const chooseEntry = findEntry("choose-massage");

  if (normalizedQuery.includes("sportif") || normalizedQuery.includes("sport")) {
    return {
      type: "knowledge" as const,
      title: "Quel massage après le sport ?",
      shortAnswer:
        "Si votre besoin principal est la récupération musculaire après le sport, le massage tonique est généralement le plus adapté.",
      longAnswer: [
        "Le massage tonique aide davantage à travailler les tensions musculaires et la récupération.",
        "Si vous cherchez quelque chose de plus équilibré entre détente et relance, le massage relaxant tonique peut aussi convenir.",
      ],
      links: DEFAULT_LINKS,
      suggestions: [
        "Le massage tonique est-il adapté après le sport ?",
        "Quels sont les tarifs du massage tonique ?",
      ],
      matches: [],
    };
  }

  if (normalizedQuery.includes("stress")) {
    return {
      type: "knowledge" as const,
      title: "Massage pour le stress",
      shortAnswer:
        "Si votre besoin principal est de relâcher la pression et de retrouver du calme, le massage relaxant tonique est souvent le meilleur point d’entrée.",
      longAnswer: [
        "Il combine douceur et relance légère, ce qui convient bien quand le corps et le mental ont besoin de se relâcher sans perdre complètement l’élan.",
        "Si vous cherchez une approche plus lente et plus centrée sur la sensation, le massage tantrique peut aussi avoir du sens selon votre besoin.",
      ],
      links: DEFAULT_LINKS,
      suggestions: [
        "Quelle est la différence entre les massages ?",
        "Quels sont les tarifs du massage relaxant tonique ?",
      ],
      matches: [],
    };
  }

  if (
    normalizedQuery.includes("fatigue") ||
    normalizedQuery.includes("dos") ||
    normalizedQuery.includes("epaules") ||
    normalizedQuery.includes("épaules")
  ) {
    return {
      type: "knowledge" as const,
      title: "Massage pour tensions ou fatigue",
      shortAnswer:
        "Si vous sentez surtout des tensions physiques ou une fatigue musculaire, le massage tonique est souvent le plus adapté. Si vous voulez un équilibre entre relâchement et douceur, le relaxant tonique peut aussi convenir.",
      longAnswer: [
        "Le bon choix dépend surtout de l’intensité que vous recherchez et de la façon dont votre corps se sent aujourd’hui.",
        "Si la douleur est importante, s’il y a une blessure ou une situation médicale particulière, mieux vaut en parler avant la séance.",
      ],
      links: DEFAULT_LINKS,
      suggestions: [
        "Le massage tonique est-il adapté après le sport ?",
        "Y a-t-il des précautions à prendre ?",
      ],
      matches: [],
    };
  }

  return buildKnowledgeResponse(chooseEntry);
}

function buildGenericIntentResponse(intent: QueryIntent, normalizedQuery: string) {
  if (intent === "difference") {
    return buildKnowledgeResponse(findEntry("services-difference"));
  }

  if (intent === "pricing") {
    return buildKnowledgeResponse(findEntry("pricing"));
  }

  if (intent === "duration") {
    return buildKnowledgeResponse(findEntry("duration"));
  }

  if (intent === "process") {
    return buildGeneralSessionProcessResponse();
  }

  if (intent === "preparation") {
    return buildPreparationResponse(normalizedQuery);
  }

  if (intent === "aftercare") {
    return buildAftercareResponse(normalizedQuery);
  }

  if (intent === "booking") {
    if (
      normalizedQuery.includes("aucun creneau") ||
      normalizedQuery.includes("pas de disponibilite") ||
      normalizedQuery.includes("indisponible")
    ) {
      return buildKnowledgeResponse(findEntry("booking-no-slots"));
    }
    return buildKnowledgeResponse(findEntry("booking"));
  }

  if (intent === "contact") {
    return buildKnowledgeResponse(findEntry("contact"));
  }

  if (intent === "contraindications") {
    return buildKnowledgeResponse(findEntry("contraindications"));
  }

  if (intent === "frequency") {
    return buildKnowledgeResponse(findEntry("frequency"), {
      article: findArticle("frequency"),
    });
  }

  if (intent === "sport") {
    return buildKnowledgeResponse(findEntry("sport-recovery"), {
      article: findArticle("massage-sport"),
    });
  }

  if (intent === "first_session") {
    return buildKnowledgeResponse(findEntry("first-session"));
  }

  if (intent === "choose") {
    return buildRecommendationResponse(normalizedQuery);
  }

  return null;
}

function buildServiceSpecificResponse(
  serviceTarget: ServiceTarget,
  intent: QueryIntent,
  normalizedQuery: string,
  requestedDuration: number | null
) {
  if (intent === "pricing") {
    return buildServicePricingResponse(serviceTarget, requestedDuration);
  }

  if (intent === "duration") {
    return buildServiceDurationResponse(serviceTarget, requestedDuration);
  }

  if (intent === "process") {
    return buildServiceProcessResponse(serviceTarget);
  }

  if (intent === "aftercare") {
    return buildServiceAftercareResponse(serviceTarget);
  }

  if (intent === "sport") {
    return buildServiceSportResponse(serviceTarget);
  }

  if (intent === "preparation" || intent === "first_session") {
    return buildServicePreparationResponse(serviceTarget, normalizedQuery);
  }

  return buildServiceRecommendationResponse(serviceTarget);
}

function fallbackKnowledgeSearch(query: string) {
  const queryTokens = tokenize(query);

  const ranked = ASSISTANT_KNOWLEDGE_BASE.map((entry) => ({
    entry,
    score: scoreEntry(query, queryTokens, entry),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length || ranked[0].score < 7) {
    return null;
  }

  const topEntry = ranked[0].entry;
  const matches: AssistantMatch[] = ranked.slice(0, 3).map((item) => ({
    id: item.entry.id,
    title: item.entry.title,
    intent: item.entry.intent,
    score: item.score,
  }));

  return buildKnowledgeResponse(topEntry, { matches });
}

export function resolveAssistantQuery(query: string): AssistantResponse {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  if (!normalizedQuery) {
    return buildOutOfScopeResponse();
  }

  if (
    MEDICAL_KEYWORDS.some((keyword) =>
      normalizedQuery.includes(normalizeText(keyword))
    )
  ) {
    if (
      normalizedQuery.includes("soigne") ||
      normalizedQuery.includes("remplace") ||
      normalizedQuery.includes("traitement")
    ) {
      return buildMedicalBoundaryResponse();
    }

    return buildKnowledgeResponse(findEntry("contraindications"));
  }

  const serviceTarget = detectServiceTarget(query, queryTokens);
  const { intent } = detectIntent(query, queryTokens);
  const requestedDuration = extractRequestedDuration(query);

  if (serviceTarget) {
    const serviceResponse = buildServiceSpecificResponse(
      serviceTarget,
      intent,
      normalizedQuery,
      requestedDuration
    );
    if (serviceResponse) {
      return serviceResponse;
    }
  }

  const genericResponse = buildGenericIntentResponse(intent, normalizedQuery);
  if (genericResponse) {
    return genericResponse;
  }

  const fallbackMatch = fallbackKnowledgeSearch(query);
  if (fallbackMatch) {
    return fallbackMatch;
  }

  return buildOutOfScopeResponse();
}
