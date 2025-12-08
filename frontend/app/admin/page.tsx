"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function AdminAlias() {
  useEffect(() => {
    redirect("/admin-samass-98342");
  }, []);

  return null;
}
