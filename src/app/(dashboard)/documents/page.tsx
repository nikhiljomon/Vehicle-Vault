"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Plus,
  Car,
} from "lucide-react";
import { DocumentBadge } from "@/components/documents/DocumentBadge";
import { RenewModal } from "@/components/documents/RenewModal";
import { DocumentFormModal } from "@/components/documents/DocumentFormModal";
import { formatDate, formatDocumentType, getDaysRemaining } from "@/lib/utils";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, EXPIRED, EXPIRING, VALID

  // Modals
  const [renewingDoc, setRenewingDoc] = useState<any | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [selectedVehicleForDoc, setSelectedVehicleForDoc] = useState("");

  const loadData = async () => {
    try {
      const [docRes, vehRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/vehicles"),
      ]);

      if (docRes.ok) {
        const d = await docRes.json();
        setDocuments(d);
      }
      if (vehRes.ok) {
        const v = await vehRes.json();
        setVehicles(v);
        if (v.length > 0) setSelectedVehicleForDoc(v[0].id);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter pipeline
  const filtered = documents.filter((doc) => {
    // Vehicle filter
    if (selectedVehicle !== "ALL" && doc.vehicleId !== selectedVehicle) {
      return false;
    }

    // Type filter
    if (selectedType !== "ALL" && doc.type !== selectedType) {
      return false;
    }

    // Status filter
    const days = getDaysRemaining(doc.expiryDate);
    if (statusFilter === "EXPIRED" && days >= 0) return false;
    if (statusFilter === "EXPIRING" && (days < 0 || days > 30)) return false;
    if (statusFilter === "VALID" && days <= 30) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchDocNum = doc.documentNumber?.toLowerCase().includes(q);
      const matchCustom = doc.customTypeName?.toLowerCase().includes(q);
      const matchVehicle =
        doc.vehicle?.nickname.toLowerCase().includes(q) ||
        doc.vehicle?.registrationNumber.toLowerCase().includes(q);
      const matchNotes = doc.notes?.toLowerCase().includes(q);
      const matchType = doc.type.toLowerCase().includes(q);
      return matchDocNum || matchCustom || matchVehicle || matchNotes || matchType;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Compliance Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, filter, track and renew insurance, pollution certificates, and permits
          </p>
        </div>

        {vehicles.length > 0 && (
          <button
            onClick={() => setShowAddDocModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Document
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search documents or vehicles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Vehicle Dropdown */}
          <div>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="ALL">All Vehicles ({vehicles.length})</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname} ({v.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Dropdown */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="ALL">All Document Types</option>
              <option value="INSURANCE">Insurance</option>
              <option value="PUC">Pollution Certificate (PUC)</option>
              <option value="RC">Registration Certificate (RC)</option>
              <option value="FITNESS">Fitness Certificate</option>
              <option value="ROAD_TAX">Road Tax</option>
              <option value="PERMIT">Permit</option>
              <option value="DRIVING_LICENCE">Driving Licence</option>
              <option value="CUSTOM">Custom Documents</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {[
            { label: "All", value: "ALL" },
            { label: "🔴 Expired", value: "EXPIRED" },
            { label: "🟡 Expiring Soon", value: "EXPIRING" },
            { label: "🟢 Valid", value: "VALID" },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                statusFilter === pill.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No matching documents found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or clear the filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 font-semibold">
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-4">Document Type</th>
                  <th className="py-3.5 px-4">Policy / Number</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filtered.map((doc) => {
                  const typeLabel = formatDocumentType(doc.type, doc.customTypeName);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/vehicles/${doc.vehicle.id}`}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition flex items-center gap-2"
                        >
                          <Car className="w-4 h-4 text-blue-500" />
                          <span>{doc.vehicle.nickname}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {doc.vehicle.registrationNumber}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        {typeLabel}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {doc.documentNumber || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(doc.issueDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(doc.expiryDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <DocumentBadge expiryDate={doc.expiryDate} />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                              title="View Document"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setRenewingDoc(doc)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Renew Modal */}
      {renewingDoc && (
        <RenewModal
          document={renewingDoc}
          isOpen={!!renewingDoc}
          onClose={() => setRenewingDoc(null)}
          onSuccess={loadData}
        />
      )}

      {/* Add Document Modal */}
      {showAddDocModal && vehicles.length > 0 && (
        <DocumentFormModal
          vehicleId={selectedVehicleForDoc || vehicles[0].id}
          isOpen={showAddDocModal}
          onClose={() => setShowAddDocModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
