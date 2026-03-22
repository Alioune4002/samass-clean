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

type IntentDetection = {
  intent: QueryIntent;
  score: number;
};

type AssistantContext = {
  query: string;
  normalizedQuery: string;
  tokens: string[];
  service: ServiceTarget | null;
  intent: QueryIntent;
  requestedDuration: number | null;
  medicalBoundary: boolean;
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
      "tantra",
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

function containsCandidate(tokens: string[], candidate: string) {
  const normalizedCandidate = normalizeText(candidate);

  return tokens.some((token) => {
    if (token === normalizedCandidate) return true;
    if (
      token.length >= 4 &&
      normalizedCandidate.length >= 4 &&
      (token.includes(normalizedCandidate) || normalizedCandidate.includes(token))
    ) {
      return true;
    }
    if (token.length >= 5 && normalizedCandidate.length >= 5) {
      return levenshtein(token, normalizedCandidate) <= 1;
    }
    return false;
  });
}

function matchesAnyCandidate(tokens: string[], candidates: string[]) {
  return candidates.some((candidate) => containsCandidate(tokens, candidate));
}

function hasCloseTokenMatch(tokens: string[], candidate: string) {
  return tokenize(candidate).every((candidateToken) =>
    tokens.some((token) => {
      if (token === candidateToken) return true;
      if (token.includes(candidateToken) || candidateToken.includes(token)) {
        return true;
      }
      if (token.length >= 5 && candidateToken.length >= 5) {
        return levenshtein(token, candidateToken) <= 1;
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

function getArticle(articleId: string) {
  return ASSISTANT_ARTICLES.find((article) => article.id === articleId);
}

function getKnowledgeEntry(entryId: string) {
  const entry = ASSISTANT_KNOWLEDGE_BASE.find((item) => item.id === entryId);
  if (!entry) {
    throw new Error(`Missing assistant knowledge entry "${entryId}".`);
  }
  return entry;
}

function buildMatches(entry: AssistantKnowledgeEntry, score = 100): AssistantMatch[] {
  return [{ id: entry.id, title: entry.title, intent: entry.intent, score }];
}

function buildKnowledgeResponse(
  entry: AssistantKnowledgeEntry,
  overrides?: Partial<AssistantResponse>
): AssistantResponse {
  const article = entry.articleId ? getArticle(entry.articleId) : undefined;

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

function buildServiceLinks(serviceTitle: string): AssistantLink[] {
  return [
    { href: "/reservation", label: `Réserver ${serviceTitle}` },
    { href: "/services", label: "Voir les massages" },
    { href: "/contact", label: "Contacter Sam" },
  ];
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

function scoreEntry(query: string, tokens: string[], entry: AssistantKnowledgeEntry) {
  const normalizedQuery = normalizeText(query);
  let score = 0;

  const normalizedQuestion = normalizeText(entry.question);
  if (normalizedQuery === normalizedQuestion) score += 20;
  else if (normalizedQuery.includes(normalizedQuestion)) score += 12;

  for (const phrase of entry.phrases) {
    const normalizedPhrase = normalizeText(phrase);
    if (!normalizedPhrase) continue;

    if (normalizedQuery === normalizedPhrase) score += 18;
    else if (normalizedQuery.includes(normalizedPhrase)) score += 10;
    else if (hasCloseTokenMatch(tokens, normalizedPhrase)) score += 6;
  }

  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;

    if (normalizedQuery.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(" ") ? 5 : 3;
    } else if (hasCloseTokenMatch(tokens, normalizedKeyword)) {
      score += 1;
    }
  }

  return score;
}

function fallbackKnowledgeSearch(query: string, tokens: string[]) {
  const ranked = ASSISTANT_KNOWLEDGE_BASE.map((entry) => ({
    entry,
    score: scoreEntry(query, tokens, entry),
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

function buildServicePricingResponse(context: AssistantContext) {
  const serviceTarget = context.service!;
  const service = getServiceData(serviceTarget.title);
  const durations = Object.keys(service.durations_prices).map(Number).sort((a, b) => a - b);

  if (context.requestedDuration) {
    const price = service.durations_prices[String(context.requestedDuration)];
    if (price) {
      return {
        type: "knowledge" as const,
        title: `Tarifs du ${service.title}`,
        shortAnswer: `Oui, le ${service.title} est proposé en ${formatDurationLabel(
          context.requestedDuration
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
        context.requestedDuration
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

function buildServiceDurationResponse(context: AssistantContext) {
  const serviceTarget = context.service!;
  const service = getServiceData(serviceTarget.title);
  const durations = Object.keys(service.durations_prices).map(Number).sort((a, b) => a - b);

  if (context.requestedDuration) {
    const exists = durations.includes(context.requestedDuration);
    return {
      type: "knowledge" as const,
      title: `Durée du ${service.title}`,
      shortAnswer: exists
        ? `Oui, le ${service.title} existe en ${formatDurationLabel(context.requestedDuration)}.`
        : `Non, le ${service.title} n’est pas proposé en ${formatDurationLabel(context.requestedDuration)}.`,
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

function buildServiceProcessResponse(context: AssistantContext) {
  const serviceTarget = context.service!;
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

function buildServiceAftercareResponse(context: AssistantContext) {
  const serviceTarget = context.service!;
  const service = getServiceData(serviceTarget.title);
  const articleId =
    serviceTarget.key === "tantrique"
      ? "after-tantrique"
      : serviceTarget.key === "tonique"
      ? "after-tonic"
      : "after-massage";
  const article = getArticle(articleId);

  const shortAnswer =
    serviceTarget.key === "tantrique"
      ? "Après un massage tantrique, l’idéal est souvent de préserver un peu de calme pour intégrer la séance avec douceur."
      : serviceTarget.key === "tonique"
      ? "Après un massage tonique, mieux vaut éviter de repartir immédiatement sur un effort intense et laisser le corps intégrer le travail musculaire."
      : "Après un massage relaxant tonique, l’idéal est de prolonger un peu le calme, de bien s’hydrater et de laisser le corps garder les effets de la séance.";

  return {
    type: "knowledge" as const,
    title: `Après le ${service.title}`,
    shortAnswer,
    longAnswer: article ? article.body : getKnowledgeEntry("aftercare").longAnswer,
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

function buildServicePreparationResponse(context: AssistantContext) {
  const serviceTarget = context.service!;
  const service = getServiceData(serviceTarget.title);

  let shortAnswer =
    `Pour le ${service.title}, l’essentiel est de venir dans une tenue confortable, sans précipitation si possible, et de signaler simplement votre état du moment au début de la séance.`;

  if (context.normalizedQuery.includes("manger")) {
    shortAnswer =
      "Mieux vaut éviter un repas trop lourd juste avant la séance. L’idée est d’arriver le plus confortablement possible.";
  } else if (
    context.normalizedQuery.includes("habille") ||
    context.normalizedQuery.includes("tenue")
  ) {
    shortAnswer =
      "Une tenue simple et confortable est généralement le meilleur choix pour venir à votre séance.";
  }

  return {
    type: "knowledge" as const,
    title: `Préparer votre ${service.title.toLowerCase()}`,
    shortAnswer,
    longAnswer: getKnowledgeEntry("preparation").longAnswer,
    article: getArticle("prepare-session"),
    links: buildServiceLinks(service.title),
    suggestions: [
      "Comment se passe une première séance ?",
      `Comment se déroule le ${service.title.toLowerCase()} ?`,
    ],
    matches: [],
  };
}

function buildServiceSportResponse(context: AssistantContext) {
  const serviceTarget = context.service!;

  if (serviceTarget.key === "tonique") {
    return {
      type: "knowledge" as const,
      title: "Massage tonique et sport",
      shortAnswer:
        "Oui, le massage tonique est souvent le plus adapté après le sport si vous cherchez une récupération plus musculaire et un travail plus profond.",
      longAnswer: getArticle("massage-sport")?.body || getKnowledgeEntry("sport-recovery").longAnswer,
      article: getArticle("massage-sport"),
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

function buildServiceOverviewResponse(context: AssistantContext) {
  const serviceTarget = context.service!;
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

function buildPreparationResponse(context: AssistantContext) {
  const entry = getKnowledgeEntry("preparation");
  let shortAnswer = entry.shortAnswer;

  if (context.normalizedQuery.includes("manger")) {
    shortAnswer =
      "Il vaut mieux éviter un repas trop lourd juste avant un massage afin d’arriver plus confortablement à la séance.";
  } else if (
    context.normalizedQuery.includes("habille") ||
    context.normalizedQuery.includes("tenue")
  ) {
    shortAnswer =
      "Une tenue simple et confortable est généralement préférable pour venir à votre séance.";
  } else if (context.normalizedQuery.includes("apprehension")) {
    shortAnswer =
      "C’est tout à fait normal d’avoir un peu d’appréhension. Le temps d’accueil au début sert justement à poser un cadre rassurant et à avancer à votre rythme.";
  }

  return buildKnowledgeResponse(entry, {
    shortAnswer,
    article: getArticle("prepare-session"),
  });
}

function buildAftercareResponse(context: AssistantContext) {
  const oilsEntry = getKnowledgeEntry("oils-hydration-rest");
  const aftercareEntry = getKnowledgeEntry("aftercare");

  if (
    context.normalizedQuery.includes("eau") ||
    context.normalizedQuery.includes("boire")
  ) {
    return buildKnowledgeResponse(oilsEntry, {
      shortAnswer:
        "Oui, boire de l’eau après un massage est un bon réflexe simple pour rester confortable et prolonger la sensation de fluidité.",
    });
  }

  if (
    context.normalizedQuery.includes("douche") ||
    context.normalizedQuery.includes("reposer") ||
    context.normalizedQuery.includes("repos")
  ) {
    return buildKnowledgeResponse(oilsEntry);
  }

  return buildKnowledgeResponse(aftercareEntry, {
    article: getArticle("after-massage"),
  });
}

function buildRecommendationResponse(context: AssistantContext) {
  const entry = getKnowledgeEntry("choose-massage");

  if (
    context.normalizedQuery.includes("sportif") ||
    context.normalizedQuery.includes("sport")
  ) {
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

  if (context.normalizedQuery.includes("stress")) {
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
    context.normalizedQuery.includes("fatigue") ||
    context.normalizedQuery.includes("dos") ||
    context.normalizedQuery.includes("epaules")
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

  return buildKnowledgeResponse(entry);
}

function buildGenericIntentResponse(context: AssistantContext) {
  if (context.intent === "difference") {
    return buildKnowledgeResponse(getKnowledgeEntry("services-difference"));
  }

  if (context.intent === "pricing") {
    return buildKnowledgeResponse(getKnowledgeEntry("pricing"));
  }

  if (context.intent === "duration") {
    return buildKnowledgeResponse(getKnowledgeEntry("duration"));
  }

  if (context.intent === "process") {
    return buildGeneralSessionProcessResponse();
  }

  if (context.intent === "preparation") {
    return buildPreparationResponse(context);
  }

  if (context.intent === "aftercare") {
    return buildAftercareResponse(context);
  }

  if (context.intent === "booking") {
    if (
      context.normalizedQuery.includes("aucun creneau") ||
      context.normalizedQuery.includes("pas de disponibilite") ||
      context.normalizedQuery.includes("aucune disponibilite")
    ) {
      return buildKnowledgeResponse(getKnowledgeEntry("booking-no-slots"));
    }
    return buildKnowledgeResponse(getKnowledgeEntry("booking"));
  }

  if (context.intent === "contact") {
    return buildKnowledgeResponse(getKnowledgeEntry("contact"));
  }

  if (context.intent === "contraindications") {
    return buildKnowledgeResponse(getKnowledgeEntry("contraindications"));
  }

  if (context.intent === "frequency") {
    return buildKnowledgeResponse(getKnowledgeEntry("frequency"), {
      article: getArticle("frequency"),
    });
  }

  if (context.intent === "sport") {
    return buildKnowledgeResponse(getKnowledgeEntry("sport-recovery"), {
      article: getArticle("massage-sport"),
    });
  }

  if (context.intent === "first_session") {
    return buildKnowledgeResponse(getKnowledgeEntry("first-session"));
  }

  if (context.intent === "choose") {
    return buildRecommendationResponse(context);
  }

  return null;
}

export function detectService(query: string) {
  const tokens = tokenize(query);
  const hasRelaxAnchor = matchesAnyCandidate(tokens, ["relaxant", "relaxation"]);
  const hasTonicAnchor = matchesAnyCandidate(tokens, ["tonique", "tonik"]);
  const hasTantricAnchor = matchesAnyCandidate(tokens, ["tantrique", "tantrik", "tantra"]);

  if (hasRelaxAnchor && hasTonicAnchor) {
    return SERVICE_TARGETS.find((service) => service.key === "relaxant-tonique") ?? null;
  }

  if (hasTantricAnchor) {
    return SERVICE_TARGETS.find((service) => service.key === "tantrique") ?? null;
  }

  if (hasTonicAnchor && !hasRelaxAnchor) {
    return SERVICE_TARGETS.find((service) => service.key === "tonique") ?? null;
  }

  return null;
}

export function detectIntent(query: string): IntentDetection {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);

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

  const scored = (Object.keys(INTENT_KEYWORDS) as QueryIntent[])
    .filter((intent) => intent !== "unknown")
    .map((intent) => {
      let score = 0;
      for (const keyword of INTENT_KEYWORDS[intent]) {
        const normalizedKeyword = normalizeText(keyword);
        if (!normalizedKeyword) continue;

        if (normalizedQuery.includes(normalizedKeyword)) {
          score += normalizedKeyword.includes(" ") ? 8 : 4;
        } else if (hasCloseTokenMatch(tokens, normalizedKeyword)) {
          score += 2;
        }
      }
      return { intent, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score <= 0) {
    return { intent: "unknown", score: 0 };
  }

  return best;
}

export function buildContext(
  service: ServiceTarget | null,
  intentDetection: IntentDetection,
  query: string
): AssistantContext {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);
  const requestedDuration = extractRequestedDuration(query);

  const medicalBoundary =
    intentDetection.intent !== "booking" &&
    MEDICAL_KEYWORDS.some((keyword) =>
      normalizedQuery.includes(normalizeText(keyword))
    ) &&
    !normalizedQuery.includes("aucun creneau");

  return {
    query,
    normalizedQuery,
    tokens,
    service,
    intent: intentDetection.intent,
    requestedDuration,
    medicalBoundary,
  };
}

export function generateResponse(context: AssistantContext): AssistantResponse {
  if (
    context.medicalBoundary &&
    (context.normalizedQuery.includes("soigne") ||
      context.normalizedQuery.includes("remplace") ||
      context.normalizedQuery.includes("traitement"))
  ) {
    return buildMedicalBoundaryResponse();
  }

  if (context.medicalBoundary) {
    return buildKnowledgeResponse(getKnowledgeEntry("contraindications"));
  }

  if (context.service) {
    if (context.intent === "pricing") {
      return buildServicePricingResponse(context);
    }

    if (context.intent === "duration") {
      return buildServiceDurationResponse(context);
    }

    if (context.intent === "process") {
      return buildServiceProcessResponse(context);
    }

    if (context.intent === "aftercare") {
      return buildServiceAftercareResponse(context);
    }

    if (context.intent === "sport") {
      return buildServiceSportResponse(context);
    }

    if (context.intent === "preparation" || context.intent === "first_session") {
      return buildServicePreparationResponse(context);
    }

    return buildServiceOverviewResponse(context);
  }

  const genericIntentResponse = buildGenericIntentResponse(context);
  if (genericIntentResponse) {
    return genericIntentResponse;
  }

  const fallbackResponse = fallbackKnowledgeSearch(context.query, context.tokens);
  if (fallbackResponse) {
    return fallbackResponse;
  }

  return buildOutOfScopeResponse();
}

export function resolveAssistantQuery(query: string): AssistantResponse {
  const service = detectService(query);
  const intentDetection = detectIntent(query);
  const context = buildContext(service, intentDetection, query);
  return generateResponse(context);
}
