import Accordion from "./ui/Accordion";
import ReservationButton from "./ReservationButton";

type ServiceFormula = {
  duration: string;
  price: number;
};

type CardServiceProps = {
  title: string;
  description: string;
  formulas: ServiceFormula[];
  serviceId: number;
};

export default function CardService({
  title,
  description,
  formulas,
  serviceId
}: CardServiceProps) {
  const uniquePrice = formulas.length === 1;

  return (
    <div className="bg-white rounded-xl shadow-card p-6 border hover:shadow-lg transition">
      <h3 className="text-xl font-bold text-forest mb-2">{title}</h3>

      <p className="text-softgray text-sm mb-4">{description}</p>

     
      {uniquePrice ? (
        <div className="mb-4 text-sm font-medium text-ink">
          {formulas[0].duration} : {formulas[0].price.toFixed(2)}€
        </div>
      ) : (
        <Accordion title="Voir les formules">
          {formulas.map((f, index) => (
            <div key={index} className="flex justify-between">
              <span>{f.duration}</span>
              <span className="font-medium">{f.price.toFixed(2)}€</span>
            </div>
          ))}
        </Accordion>
      )}
        <div className="mt-6">
      
          <ReservationButton serviceId={serviceId} />
        </div>
    </div>
  );
}
