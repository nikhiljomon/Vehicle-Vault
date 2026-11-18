"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VehicleForm } from "@/components/vehicles/VehicleForm";

export default function EditVehiclePage() {
  const params = useParams();
  const id = params?.id as string;
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/vehicles/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setVehicle(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8 animate-pulse">
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12 text-slate-500">
        Vehicle not found.
      </div>
    );
  }

  return (
    <div className="py-2">
      <VehicleForm initialData={vehicle} isEdit={true} />
    </div>
  );
}
