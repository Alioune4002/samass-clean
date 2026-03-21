import Accordion from "./ui/Accordion";
import ReservationButton from "./ReservationButton";

type ServiceFormula = {
  duration: string;
  price: number;
};

type CardServiceProps = {
  title: string;
  description: string;
  longDescription?: string | null;
  formulas: ServiceFormula[];
  serviceId: number;
};

export default function CardService({
  title,
  description,
  longDescription,
  formulas,
  serviceId
}: CardServiceProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-emerald-100/70 hover:shadow-lg transition">
      <h3 className="text-xl font-bold text-forest mb-2 text-center md:text-left">
        {title}
      </h3>

      <p className="text-softgray text-sm leading-relaxed mb-4 text-center md:text-left">
        {description}
      </p>

      <div className="mb-4 grid gap-2">
        {formulas.map((f, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm text-ink"
          >
            <span>{f.duration}</span>
            <span className="font-semibold">{f.price.toFixed(2)}€</span>
          </div>
        ))}
      </div>

      {longDescription ? (
        <Accordion title="Voir le déroulement">
          <div className="space-y-3 leading-relaxed">
            {longDescription.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </Accordion>
      ) : null}

      <div className="mt-6">
        <ReservationButton serviceId={serviceId} />
      </div>
    </div>
  );
}
