"use client";

import { useState, useEffect } from "react";
import {
  FileDown,
  Printer,
  FileSpreadsheet,
  ShieldCheck,
  Car,
  CheckCircle,
} from "lucide-react";
import { formatDate, formatDocumentType, calculateExpiryStatus } from "@/lib/utils";

export default function ExportPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setVehicles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    if (vehicles.length === 0) return;

    const headers = [
      "Vehicle Nickname",
      "Registration Number",
      "Type",
      "Make",
      "Model",
      "Year",
      "Fuel Type",
      "Owner Name",
      "Chassis / VIN",
      "Engine Number",
      "Document Type",
      "Document / Policy Number",
      "Issue Date",
      "Expiry Date",
      "Compliance Status",
      "Notes",
    ];

    const rows: string[][] = [];

    vehicles.forEach((v) => {
      if (!v.documents || v.documents.length === 0) {
        rows.push([
          v.nickname,
          v.registrationNumber,
          v.type,
          v.make,
          v.model,
          v.year.toString(),
          v.fuelType,
          v.ownerName || "",
          v.chassisNumber || "",
          v.engineNumber || "",
          "No Documents",
          "",
          "",
          "",
          "",
          "",
        ]);
      } else {
        v.documents.forEach((d: any) => {
          const status = calculateExpiryStatus(d.expiryDate).status;
          rows.push([
            v.nickname,
            v.registrationNumber,
            v.type,
            v.make,
            v.model,
            v.year.toString(),
            v.fuelType,
            v.ownerName || "",
            v.chassisNumber || "",
            v.engineNumber || "",
            formatDocumentType(d.type, d.customTypeName),
            d.documentNumber || "",
            d.issueDate ? formatDate(d.issueDate) : "",
            formatDate(d.expiryDate),
            status,
            (d.notes || "").replace(/"/g, '""'),
          ]);
        });
      }
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((f) => `"${f}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `VehicleVault_Export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Export Vehicle Data
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Download your vehicle portfolio as a CSV spreadsheet or print/save as PDF
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            disabled={loading || vehicles.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || vehicles.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Info Card (hidden in print) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
          Export Uses
        </h3>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
          <li><strong>CSV Export</strong>: Ideal for opening in Excel or Google Sheets, sharing with fleet accountants, or creating custom reports.</li>
          <li><strong>Print / PDF</strong>: Formats all vehicle specifications and active document certificates into a clean legal dossier suitable for traffic police inspection, insurance claims, or physical glovebox storage.</li>
        </ul>
      </div>

      {/* Printable Report Dossier */}
      <div className="bg-white dark:bg-slate-900 print:bg-white print:text-black border border-slate-200 dark:border-slate-800 print:border-none rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        {/* Dossier Header */}
        <div className="flex items-center justify-between border-b pb-6 border-slate-200 dark:border-slate-800 print:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm print:bg-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                VehicleVault Compliance Dossier
              </h2>
              <p className="text-xs text-slate-500 print:text-slate-600">
                Generated on {new Date().toLocaleDateString("en-GB", { dateStyle: "full" })}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 print:text-slate-600">
            <span>Fleet Count: <strong>{vehicles.length}</strong></span>
          </div>
        </div>

        {/* Vehicle Dossier Cards */}
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-2xl p-6 space-y-4 break-inside-avoid"
          >
            {/* Vehicle Title & Specs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 print:border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white print:text-black">
                  {v.nickname}
                </h3>
                <p className="text-xs text-slate-500 print:text-slate-600">
                  {v.make} {v.model} ({v.year}) • {v.fuelType} • Owner: {v.ownerName || "Alex Turner"}
                </p>
              </div>
              <span className="font-mono text-sm font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 print:bg-slate-100 print:text-black rounded-lg">
                {v.registrationNumber}
              </span>
            </div>

            {/* Documents Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-black uppercase tracking-wider mb-2">
                Document Compliance Records
              </h4>

              {v.documents?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No documents attached.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 print:border-slate-300 text-slate-500 print:text-black font-semibold">
                      <th className="py-2">Type</th>
                      <th className="py-2">Document / Policy #</th>
                      <th className="py-2">Issue Date</th>
                      <th className="py-2">Expiry Date</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                    {v.documents.map((d: any) => {
                      const { status, label } = calculateExpiryStatus(d.expiryDate);
                      return (
                        <tr key={d.id} className="py-2">
                          <td className="py-2 font-medium text-slate-800 dark:text-slate-200 print:text-black">
                            {formatDocumentType(d.type, d.customTypeName)}
                          </td>
                          <td className="py-2 font-mono text-slate-600 dark:text-slate-400 print:text-black">
                            {d.documentNumber || "—"}
                          </td>
                          <td className="py-2 text-slate-500 print:text-slate-600">
                            {formatDate(d.issueDate)}
                          </td>
                          <td className="py-2 font-bold text-slate-800 dark:text-slate-200 print:text-black">
                            {formatDate(d.expiryDate)}
                          </td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                status === "EXPIRED"
                                  ? "bg-red-100 text-red-700"
                                  : status === "EXPIRING_SOON"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
