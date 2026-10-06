"use client";

import { useState } from "react";
import ReservationModal from "./ReservationModal";

type Props = {
  serviceId?: number;
};

export default function ReservationButton({ serviceId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ritual-booking-button"
      >
        Demander ce massage <span aria-hidden="true">↗</span>
      </button>

      <ReservationModal
        isOpen={open}
        onClose={() => setOpen(false)}
        initialServiceId={serviceId ?? null}
      />
    </>
  );
}
