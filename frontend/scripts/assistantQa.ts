import { resolveAssistantQuery } from "../lib/assistantEngine";

type QaCase = {
  query: string;
  titleIncludes?: string;
  shortIncludes?: string[];
  longIncludes?: string[];
};

const cases: QaCase[] = [
  { query: "Quel massage choisir ?", titleIncludes: "Quel massage choisir" },
  { query: "Quelle est la différence entre les massages ?", titleIncludes: "Différence" },
  { query: "Quels sont les tarifs ?", titleIncludes: "Tarifs des massages", longIncludes: ["55 €", "150 €"] },
  { query: "Combien de temps dure une séance ?", titleIncludes: "Durée des séances" },
  { query: "Comment se déroule une séance ?", titleIncludes: "Déroulement d’une séance" },
  { query: "Comment réserver ?", titleIncludes: "Réservation" },
  { query: "Comment contacter Sam ?", titleIncludes: "Contacter SAMASS" },
  { query: "Que faire si aucun créneau n’est disponible ?", titleIncludes: "Aucun créneau disponible" },

  { query: "Quels sont les tarifs du massage tantrique ?", titleIncludes: "Tarifs du Massage Tantrique", longIncludes: ["2h : 150 €"] },
  { query: "Quels sont les tarifs du massage tonique ?", titleIncludes: "Tarifs du Massage Tonique", longIncludes: ["1h30 : 115 €"] },
  { query: "Quels sont les tarifs du massage relaxant tonique ?", titleIncludes: "Tarifs du Massage Relaxant Tonique", longIncludes: ["45 min : 55 €"] },
  { query: "Combien dure le massage tantrique ?", titleIncludes: "Durées du Massage Tantrique", shortIncludes: ["1h", "1h30", "2h"] },
  { query: "Combien dure le massage tonique ?", titleIncludes: "Durées du Massage Tonique", shortIncludes: ["45 min", "1h", "1h30"] },
  { query: "Combien dure le massage relaxant tonique ?", titleIncludes: "Durées du Massage Relaxant Tonique", shortIncludes: ["45 min", "1h", "1h30"] },
  { query: "Comment se déroule le massage tantrique ?", titleIncludes: "Déroulement du Massage Tantrique" },
  { query: "Comment se déroule le massage tonique ?", titleIncludes: "Déroulement du Massage Tonique" },
  { query: "Comment se déroule le massage relaxant tonique ?", titleIncludes: "Déroulement du Massage Relaxant Tonique" },
  { query: "Le massage tantrique dure-t-il 2 heures ?", titleIncludes: "Durée du Massage Tantrique", shortIncludes: ["Oui"] },
  { query: "Le massage tonique existe-t-il en 1h30 ?", titleIncludes: "Durée du Massage Tonique", shortIncludes: ["Oui"] },
  { query: "Le massage relaxant tonique existe-t-il en 45 minutes ?", titleIncludes: "Durée du Massage Relaxant Tonique", shortIncludes: ["Oui"] },

  { query: "Comment préparer ma séance ?", titleIncludes: "Préparer sa séance" },
  { query: "Que faire avant un massage ?", titleIncludes: "Préparer sa séance" },
  { query: "Faut-il manger avant un massage ?", titleIncludes: "Préparer sa séance", shortIncludes: ["éviter un repas trop lourd"] },
  { query: "Comment venir habillé ?", titleIncludes: "Préparer sa séance", shortIncludes: ["tenue simple et confortable"] },
  { query: "Comment se passe une première séance ?", titleIncludes: "Première séance" },
  { query: "J’ai un peu d’appréhension, comment ça se passe ?", titleIncludes: "Première séance" },

  { query: "Que faire après un massage ?", titleIncludes: "Après la séance" },
  { query: "Faut-il boire de l’eau après ?", titleIncludes: "Hydratation, douche et repos", shortIncludes: ["boire de l’eau"] },
  { query: "Peut-on prendre une douche après ?", titleIncludes: "Hydratation, douche et repos" },
  { query: "Faut-il se reposer après un massage ?", titleIncludes: "Hydratation, douche et repos" },
  { query: "Que faire après un massage tonique ?", titleIncludes: "Après le Massage Tonique" },
  { query: "Que faire après un massage tantrique ?", titleIncludes: "Après le Massage Tantrique" },
  { query: "Que faire après un massage relaxant tonique ?", titleIncludes: "Après le Massage Relaxant Tonique" },

  { query: "Peut-on faire un massage après le sport ?", titleIncludes: "Massage et récupération sportive" },
  { query: "Quel massage après le sport ?", titleIncludes: "Quel massage après le sport ?" },
  { query: "Le massage tonique est-il adapté après le sport ?", titleIncludes: "Massage tonique et sport" },
  { query: "À quelle fréquence recevoir un massage ?", titleIncludes: "Fréquence des massages" },
  { query: "Combien de fois par mois peut-on faire un massage ?", titleIncludes: "Fréquence des massages" },

  { query: "Puis-je venir avec une douleur importante ?", titleIncludes: "Précautions" },
  { query: "Puis-je venir si j’ai une blessure ?", titleIncludes: "Précautions" },
  { query: "Puis-je venir si j’ai de la fièvre ?", titleIncludes: "Précautions" },
  { query: "Puis-je venir si je suis enceinte ?", titleIncludes: "Précautions" },
  { query: "Est-ce que ce massage soigne une pathologie ?", titleIncludes: "Question sensible" },
  { query: "Est-ce que ce massage remplace un traitement ?", titleIncludes: "Question sensible" },

  { query: "tarif massage tantrik", titleIncludes: "Tarifs du Massage Tantrique" },
  { query: "prix massage tonik", titleIncludes: "Tarifs du Massage Tonique" },
  { query: "combie coute massage relaxant tonique", titleIncludes: "Tarifs du Massage Relaxant Tonique" },
  { query: "massage pour stress", titleIncludes: "Massage pour le stress" },
  { query: "massage pour fatigue", titleIncludes: "Massage pour tensions ou fatigue" },
  { query: "comment se deroule une seance", titleIncludes: "Déroulement d’une séance" },
  { query: "apres massage faut faire quoi", titleIncludes: "Après la séance" },
  { query: "je veux reserver un massage", titleIncludes: "Réservation" },
  { query: "j’ai mal au dos, quel massage choisir ?", titleIncludes: "Massage pour tensions ou fatigue" },
  { query: "je suis sportif, quel massage me convient ?", titleIncludes: "Quel massage après le sport ?" },
];

let failures = 0;

for (const testCase of cases) {
  const response = resolveAssistantQuery(testCase.query);

  if (testCase.titleIncludes && !response.title.includes(testCase.titleIncludes)) {
    console.error(`FAIL title: "${testCase.query}" -> "${response.title}"`);
    failures += 1;
    continue;
  }

  if (
    testCase.shortIncludes &&
    !testCase.shortIncludes.every((fragment) => response.shortAnswer.includes(fragment))
  ) {
    console.error(`FAIL short: "${testCase.query}" -> "${response.shortAnswer}"`);
    failures += 1;
    continue;
  }

  const fullLongText = response.longAnswer.join(" ");
  if (
    testCase.longIncludes &&
    !testCase.longIncludes.every((fragment) => fullLongText.includes(fragment))
  ) {
    console.error(`FAIL long: "${testCase.query}" -> "${fullLongText}"`);
    failures += 1;
    continue;
  }

  console.log(`OK: ${testCase.query} -> ${response.title}`);
}

if (failures > 0) {
  throw new Error(`${failures} assistant QA case(s) failed.`);
}

console.log(`All assistant QA cases passed: ${cases.length}`);
