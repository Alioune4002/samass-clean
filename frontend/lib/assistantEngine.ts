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
  "symptome",
  "symptôme",
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function hasCloseTokenMatch(queryTokens: string[], keyword: string) {
  const keywordTokens = tokenize(keyword);

  return keywordTokens.every((keywordToken) =>
    queryTokens.some((queryToken) => {
      if (queryToken === keywordToken) return true;
      if (queryToken.includes(keywordToken) || keywordToken.includes(queryToken)) {
        return true;
      }
      if (keywordToken.length >= 5 && queryToken.length >= 5) {
        return levenshtein(queryToken, keywordToken) <= 1;
      }
      return false;
    })
  );
}

function scoreEntry(query: string, queryTokens: string[], entry: AssistantKnowledgeEntry) {
  const normalizedQuery = normalizeText(query);
  let score = 0;

  const question = normalizeText(entry.question);
  if (normalizedQuery === question) score += 28;
  else if (normalizedQuery.includes(question)) score += 18;

  for (const phrase of entry.phrases) {
    const normalizedPhrase = normalizeText(phrase);
    if (!normalizedPhrase) continue;

    if (normalizedQuery === normalizedPhrase) score += 24;
    else if (normalizedQuery.includes(normalizedPhrase)) score += 14;
    else if (hasCloseTokenMatch(queryTokens, normalizedPhrase)) score += 8;
  }

  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;

    if (normalizedQuery.includes(normalizedKeyword)) score += normalizedKeyword.includes(" ") ? 8 : 5;
    else if (hasCloseTokenMatch(queryTokens, normalizedKeyword)) score += 3;
  }

  const titleTokens = tokenize(entry.title).filter((token) => token.length >= 4);
  for (const token of titleTokens) {
    if (queryTokens.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function findArticle(articleId?: string) {
  if (!articleId) return undefined;
  return ASSISTANT_ARTICLES.find((article) => article.id === articleId);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildKnowledgeResponse(
  entry: AssistantKnowledgeEntry,
  matches: AssistantMatch[]
): AssistantResponse {
  const article = findArticle(entry.articleId);
  const relatedSuggestions = uniqueStrings([
    ...(entry.suggestions || []),
    ...matches
      .filter((match) => match.id !== entry.id)
      .slice(0, 2)
      .map(
        (match) =>
          ASSISTANT_KNOWLEDGE_BASE.find((item) => item.id === match.id)?.question || ""
      ),
  ]).slice(0, 5);

  return {
    type: "knowledge",
    title: entry.title,
    shortAnswer: entry.shortAnswer,
    longAnswer: entry.longAnswer,
    links: entry.links?.length ? entry.links : DEFAULT_LINKS,
    suggestions: relatedSuggestions.length
      ? relatedSuggestions
      : ASSISTANT_STARTER_SUGGESTIONS.slice(0, 4),
    article,
    matches,
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

export function resolveAssistantQuery(query: string): AssistantResponse {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return buildOutOfScopeResponse();
  }

  if (MEDICAL_KEYWORDS.some((keyword) => normalizedQuery.includes(normalizeText(keyword)))) {
    const likelyContra = ASSISTANT_KNOWLEDGE_BASE.find(
      (entry) => entry.intent === "contraindications"
    );
    if (likelyContra) {
      const score = scoreEntry(query, tokenize(query), likelyContra);
      if (score >= 8) {
        return buildKnowledgeResponse(likelyContra, [
          {
            id: likelyContra.id,
            title: likelyContra.title,
            intent: likelyContra.intent,
            score,
          },
        ]);
      }
    }
    return buildMedicalBoundaryResponse();
  }

  const queryTokens = tokenize(query);

  const ranked = ASSISTANT_KNOWLEDGE_BASE.map((entry) => ({
    entry,
    score: scoreEntry(query, queryTokens, entry),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length || ranked[0].score < 8) {
    return buildOutOfScopeResponse();
  }

  const matches: AssistantMatch[] = ranked.slice(0, 3).map((item) => ({
    id: item.entry.id,
    title: item.entry.title,
    intent: item.entry.intent,
    score: item.score,
  }));

  return buildKnowledgeResponse(ranked[0].entry, matches);
}
