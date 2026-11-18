"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Car,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { DocumentBadge } from "@/components/documents/DocumentBadge";
import { RenewModal } from "@/components/documents/RenewModal";
import { DocumentFormModal } from "@/components/documents/DocumentFormModal";
import { formatDate, formatDocumentType, getDaysRemaining } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedRenewDoc, setSelectedRenewDoc] = useState<any | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [selectedVehicleForDoc, setSelectedVehicleForDoc] = useState<string>("");

  const loadData = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/documents"),
      ]);

      if (vRes.ok) {
        const vData = await vRes.json();
        setVehicles(vData);
        if (vData.length > 0) {
          setSelectedVehicleForDoc(vData[0].id);
        }
      }

      if (dRes.ok) {
        const dData = await dRes.json();
        setDocuments(dData);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics
  const totalVehicles = vehicles.length;
  const expiredDocs = documents.filter((d) => getDaysRemaining(d.expiryDate) < 0);
  const expiringSoonDocs = documents.filter((d) => {
    const days = getDaysRemaining(d.expiryDate);
    return days >= 0 && days <= 30;
  });
  const validDocs = documents.filter((d) => getDaysRemaining(d.expiryDate) > 30);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {session?.user?.name || "Driver"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of your fleet compliance and upcoming document renewals
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {vehicles.length > 0 && (
            <button
              onClick={() => setShowAddDocModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-blue-500" />
              Add Document
            </button>
          )}
          <Link
            href="/vehicles/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Link>
        </div>
      </div>

      {/* Urgent Alert Banner (if expired or expiring within 3 days) */}
      {(expiredDocs.length > 0 || expiringSoonDocs.some((d) => getDaysRemaining(d.expiryDate) <= 3)) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-500/20 flex items-start sm:items-center gap-3">
          <div className="p-2 bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-400">
              Immediate Action Required
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              You have {expiredDocs.length} expired and {expiringSoonDocs.length} expiring documents. Renew them to avoid fines or legal issues.
            </p>
          </div>
          {expiredDocs.length > 0 && (
            <button
              onClick={() => setSelectedRenewDoc(expiredDocs[0])}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition whitespace-nowrap shadow-sm"
            >
              Renew Most Urgent
            </button>
          )}
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vehicles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Vehicles</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalVehicles}
          </p>
          <Link
            href="/vehicles"
            className="mt-3 inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Manage fleet <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Expired Documents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Expired</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400">
            {expiredDocs.length}
          </p>
          <span className="mt-3 block text-[11px] text-slate-400">
            Past expiration date
          </span>
        </div>

        {/* Expiring in 30 Days */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Due in 30 Days</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {expiringSoonDocs.length}
          </p>
          <span className="mt-3 block text-[11px] text-slate-400">
            Require renewal soon
          </span>
        </div>

        {/* Valid / Up to date */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Valid & Active</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {validDocs.length}
          </p>
          <span className="mt-3 block text-[11px] text-slate-400">
            All good & compliant
          </span>
        </div>
      </div>

      {/* Upcoming Expiries Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Document Expiries
            </h3>
            <p className="text-xs text-slate-500">
              Sorted chronologically by expiry date with colour-coded compliance status
            </p>
          </div>
          <Link
            href="/documents"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all ({documents.length}) <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No documents recorded yet
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add your insurance, pollution certificate, registration certificate, or custom document to begin tracking expiries.
            </p>
            {vehicles.length > 0 ? (
              <button
                onClick={() => setShowAddDocModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Document
              </button>
            ) : (
              <Link
                href="/vehicles/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Your First Vehicle
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 font-semibold">
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-4">Document Type</th>
                  <th className="py-3.5 px-4">Document #</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {documents.slice(0, 8).map((doc) => {
                  const docLabel = formatDocumentType(doc.type, doc.customTypeName);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/vehicles/${doc.vehicle.id}`}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition flex items-center gap-2"
                        >
                          {doc.vehicle.nickname}
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                            {doc.vehicle.registrationNumber}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {docLabel}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {doc.documentNumber || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
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
                              title="View Document File"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedRenewDoc(doc)}
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

      {/* Vehicles Preview Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Your Vehicles ({vehicles.length})
          </h3>
          <Link
            href="/vehicles"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            All vehicles <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No vehicles registered yet
            </p>
            <Link
              href="/vehicles/new"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Register First Vehicle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.map((v) => {
              const expiredCount = v.documents?.filter(
                (d: any) => getDaysRemaining(d.expiryDate) < 0
              ).length;
              const soonCount = v.documents?.filter((d: any) => {
                const days = getDaysRemaining(d.expiryDate);
                return days >= 0 && days <= 30;
              }).length;

              return (
                <Link
                  key={v.id}
                  href={`/vehicles/${v.id}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-500/30 transition-all flex flex-col"
                >
                  {/* Photo or placeholder */}
                  <div className="h-36 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                    {v.photoUrl ? (
                      <img
                        src={v.photoUrl}
                        alt={v.nickname}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Car className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    )}
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                      {v.registrationNumber}
                    </span>
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                      {v.type}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition truncate">
                        {v.nickname}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {v.make} {v.model} ({v.year}) • {v.fuelType}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {v.documents?.length || 0} documents
                      </span>
                      <div className="flex items-center gap-1.5">
                        {expiredCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
                            {expiredCount} expired
                          </span>
                        )}
                        {soonCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            {soonCount} soon
                          </span>
                        )}
                        {expiredCount === 0 && soonCount === 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            All valid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Renew Modal */}
      {selectedRenewDoc && (
        <RenewModal
          document={selectedRenewDoc}
          isOpen={!!selectedRenewDoc}
          onClose={() => setSelectedRenewDoc(null)}
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
