"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Upload, Image as ImageIcon, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface VehicleFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function VehicleForm({ initialData, isEdit = false }: VehicleFormProps) {
  const router = useRouter();

  const [nickname, setNickname] = useState(initialData?.nickname || "");
  const [registrationNumber, setRegistrationNumber] = useState(
    initialData?.registrationNumber || ""
  );
  const [type, setType] = useState(initialData?.type || "CAR");
  const [make, setMake] = useState(initialData?.make || "");
  const [model, setModel] = useState(initialData?.model || "");
  const [year, setYear] = useState(
    initialData?.year?.toString() || new Date().getFullYear().toString()
  );
  const [fuelType, setFuelType] = useState(initialData?.fuelType || "PETROL");
  const [chassisNumber, setChassisNumber] = useState(initialData?.chassisNumber || "");
  const [engineNumber, setEngineNumber] = useState(initialData?.engineNumber || "");
  const [ownerName, setOwnerName] = useState(initialData?.ownerName || "");
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || "");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData?.photoUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nickname.trim() || !registrationNumber.trim() || !make.trim() || !model.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      let finalPhotoUrl = photoUrl;

      // Handle photo upload
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const upErr = await uploadRes.json();
          throw new Error(upErr.error || "Failed to upload photo");
        }

        const upData = await uploadRes.json();
        finalPhotoUrl = upData.url;
      }

      const payload = {
        nickname: nickname.trim(),
        registrationNumber: registrationNumber.toUpperCase().trim(),
        type,
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year, 10),
        fuelType,
        chassisNumber: chassisNumber.trim() || null,
        engineNumber: engineNumber.trim() || null,
        ownerName: ownerName.trim() || null,
        photoUrl: finalPhotoUrl || null,
      };

      const url = isEdit ? `/api/vehicles/${initialData.id}` : "/api/vehicles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save vehicle");
      }

      const savedVehicle = await res.json();
      router.push(`/vehicles/${savedVehicle.id || initialData?.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {/* Top back action */}
      <div className="flex items-center justify-between">
        <Link
          href={isEdit ? `/vehicles/${initialData?.id}` : "/vehicles"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {isEdit ? "vehicle details" : "vehicles list"}
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Vehicle" : "Add New Vehicle"}
            </h2>
            <p className="text-xs text-slate-500">
              Enter vehicle registration, make, model and optional engine details
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-3.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
            {error}
          </div>
        )}

        {/* Form fields */}
        <div className="mt-6 space-y-6">
          {/* Photo upload banner */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Vehicle Photo (Optional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              {photoPreview ? (
                <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100">
                  <img
                    src={photoPreview}
                    alt="Vehicle preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span className="text-[10px]">No Photo</span>
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
                  <Upload className="w-4 h-4 text-blue-500" />
                  {photoPreview ? "Change Photo" : "Upload Vehicle Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  PNG, JPG or WEBP (Max 5 MB)
                </p>
              </div>
            </div>
          </div>

          {/* Primary details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Vehicle Nickname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Daily Commuter, Dad's Fortuner"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Registration Number (Plate) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. DL-01-AB-1234"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm uppercase font-mono tracking-wider rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Type & Fuel Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Vehicle Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="CAR">Car / SUV</option>
                <option value="BIKE">Motorcycle / Bike</option>
                <option value="SCOOTER">Scooter</option>
                <option value="TRUCK">Truck</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Fuel / Power Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric (EV)</option>
                <option value="HYBRID">Hybrid</option>
                <option value="CNG">CNG</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Manufacturing Year
              </label>
              <input
                type="number"
                min="1950"
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Make & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Make (Manufacturer) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Honda, Toyota, Royal Enfield"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Model & Variant <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. City ZX, Hunter 350, Nexon EV"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Owner & Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Owner Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Turner"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chassis / VIN Number
              </label>
              <input
                type="text"
                placeholder="17-character VIN"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm uppercase font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Engine / Motor Number
              </label>
              <input
                type="text"
                placeholder="Engine identification"
                value={engineNumber}
                onChange={(e) => setEngineNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm uppercase font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Link
            href={isEdit ? `/vehicles/${initialData?.id}` : "/vehicles"}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving Vehicle..." : isEdit ? "Update Vehicle" : "Save Vehicle"}
          </button>
        </div>
      </div>
    </form>
  );
}
