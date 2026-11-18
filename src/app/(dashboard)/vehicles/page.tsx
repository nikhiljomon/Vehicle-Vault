"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Car, Plus, Search, ChevronRight, Fuel, Calendar, User } from "lucide-react";
import { getDaysRemaining } from "@/lib/utils";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadVehicles = async () => {
    try {
      const res = await fetch("/api/vehicles");
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      v.nickname.toLowerCase().includes(query) ||
      v.registrationNumber.toLowerCase().includes(query) ||
      v.make.toLowerCase().includes(query) ||
      v.model.toLowerCase().includes(query) ||
      v.ownerName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            My Vehicles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your cars, bikes, trucks, and all their legal compliance documents
          </p>
        </div>

        <Link
          href="/vehicles/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by nickname, plate number, make or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {search ? "No vehicles match your search" : "No vehicles added yet"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {search
              ? "Try clearing your search filters to view your registered vehicles."
              : "Register your vehicle to track insurance policies, pollution tests, RC validity, and more."}
          </p>
          {!search && (
            <Link
              href="/vehicles/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const docs = vehicle.documents || [];
            const expired = docs.filter((d: any) => getDaysRemaining(d.expiryDate) < 0).length;
            const expiring = docs.filter((d: any) => {
              const days = getDaysRemaining(d.expiryDate);
              return days >= 0 && days <= 30;
            }).length;

            return (
              <Link
                key={vehicle.id}
                href={`/vehicles/${vehicle.id}`}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-500/30 transition-all flex flex-col"
              >
                {/* Photo Preview / Banner */}
                <div className="h-44 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                  {vehicle.photoUrl ? (
                    <img
                      src={vehicle.photoUrl}
                      alt={vehicle.nickname}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Car className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white font-mono text-xs uppercase font-bold tracking-wider shadow">
                    {vehicle.registrationNumber}
                  </span>
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">
                    {vehicle.type}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition truncate">
                      {vehicle.nickname}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {vehicle.make} {vehicle.model}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Fuel className="w-3.5 h-3.5 text-slate-400" />
                        {vehicle.fuelType}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Year: {vehicle.year}
                      </span>
                      {vehicle.ownerName && (
                        <span className="flex items-center gap-1.5 truncate col-span-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Owner: {vehicle.ownerName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document compliance footer */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">
                      {docs.length} Document{docs.length === 1 ? "" : "s"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {expired > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
                          {expired} Expired
                        </span>
                      ) : expiring > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {expiring} Due Soon
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          All Valid
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
