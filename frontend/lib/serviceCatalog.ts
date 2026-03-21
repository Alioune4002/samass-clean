import { Service } from "./types";

type ServiceCatalogEntry = {
  title: string;
  description: string;
  long_description: string;
  durations_prices: Record<string, number>;
  image: string;
};

export const SAMASS_SERVICE_CATALOG: ServiceCatalogEntry[] = [
  {
    title: "Massage Relaxant Tonique",
    description:
      "Un massage complet mêlant douceur et gestes toniques, pour relâcher les tensions et retrouver de l’énergie.",
    long_description:
      "Un moment pour ralentir, relâcher et se reconnecter à soi. La séance commence par un temps d’accueil et d’échange afin de comprendre vos besoins du moment. Vous êtes ensuite invité à vous installer confortablement dans un espace calme et apaisant.\n\nDéroulement : Le massage débute en douceur, avec des gestes enveloppants qui permettent au corps de lâcher progressivement les tensions. Au fil de la séance, des mouvements plus toniques viennent stimuler la circulation, dénouer les zones contractées et redonner de l’énergie. Chaque geste s’adapte à votre respiration, à votre rythme et à votre état du jour. La séance se termine par un retour au calme, pour vous laisser repartir détendu, ancré et plus léger.",
    durations_prices: {
      "45": 55,
      "60": 80,
      "90": 120,
    },
    image: "/images/relax-massage.jpeg",
  },
  {
    title: "Massage Tonique",
    description:
      "Un massage dynamique et revitalisant pour stimuler la circulation et dénouer les contractures.",
    long_description:
      "Un massage profond pour relâcher les tensions accumulées et revitaliser le corps.\n\nDéroulement : Après un temps d’échange pour cibler vos besoins, la séance commence par une mise en condition progressive. Les gestes deviennent ensuite plus appuyés et précis, permettant de travailler en profondeur sur les muscles. Le massage alterne pressions, pétrissages et mouvements dynamiques pour stimuler la circulation et libérer les zones de tension. Idéal si vous ressentez des blocages physiques ou une fatigue musculaire, ce massage vous aide à retrouver de la mobilité et de l’énergie. La séance se termine par des mouvements plus lents pour intégrer les effets du massage.",
    durations_prices: {
      "45": 50,
      "60": 70,
      "90": 115,
    },
    image: "/images/tonic-massage.jpeg",
  },
  {
    title: "Massage Tantrique",
    description:
      "Une expérience sensorielle profonde, centrée sur la présence et la reconnexion au corps.",
    long_description:
      "Une expérience sensorielle profonde, centrée sur la présence et la reconnexion au corps.\n\nDéroulement : La séance débute par un temps d’échange et de mise en confiance. L’objectif est de créer un espace sécurisant, respectueux et sans jugement. Le massage se déroule dans une atmosphère calme, avec des gestes lents, conscients et fluides. L’attention est portée sur la respiration, les sensations et la circulation de l’énergie dans le corps. Ce massage invite à ralentir, à ressentir pleinement et à se reconnecter à soi dans une approche globale du bien-être. Chaque séance est unique, guidée par votre état intérieur et votre niveau de lâcher-prise. Un temps de retour est prévu à la fin pour vous permettre de réintégrer doucement.",
    durations_prices: {
      "60": 80,
      "90": 120,
      "120": 150,
    },
    image: "/images/tantric-massage.jpeg",
  },
];

const serviceCatalogByTitle = new Map(
  SAMASS_SERVICE_CATALOG.map((service) => [service.title, service])
);

export function getServiceCatalogEntry(title: string) {
  return serviceCatalogByTitle.get(title) ?? null;
}

export function buildFallbackServices(): Service[] {
  return SAMASS_SERVICE_CATALOG.map((service, index) => ({
    id: index + 1,
    title: service.title,
    description: service.description,
    long_description: service.long_description,
    durations_prices: { ...service.durations_prices },
    image: service.image,
    is_active: true,
  }));
}

export function enrichServiceForDisplay(service: Service): Service {
  const catalogEntry = getServiceCatalogEntry(service.title);

  if (!catalogEntry) {
    return {
      ...service,
      long_description: service.long_description ?? null,
      durations_prices: { ...service.durations_prices },
    };
  }

  return {
    ...service,
    description: catalogEntry.description,
    long_description: catalogEntry.long_description,
    durations_prices: { ...catalogEntry.durations_prices },
    image: service.image || catalogEntry.image,
  };
}

export function enrichServicesForDisplay(services: Service[]) {
  return services.map(enrichServiceForDisplay);
}
