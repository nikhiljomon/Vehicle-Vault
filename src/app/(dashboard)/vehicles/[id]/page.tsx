"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  Calendar,
  Fuel,
  User,
  Hash,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  ExternalLink,
  History,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { DocumentBadge } from "@/components/documents/DocumentBadge";
import { RenewModal } from "@/components/documents/RenewModal";
import { DocumentFormModal } from "@/components/documents/DocumentFormModal";
import { formatDate, formatDocumentType } from "@/lib/utils";

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [renewingDoc, setRenewingDoc] = useState<any | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState(false);

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`/api/vehicles/${id}`);
      if (res.ok) {
        const data = await res.json();
        setVehicle(data);
      } else {
        router.push("/vehicles");
      }
    } catch (err) {
      console.error("Failed to load vehicle details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchVehicle();
  }, [id]);

  const handleDeleteVehicle = async () => {
    if (!confirm("Are you sure you want to delete this vehicle and all associated documents? This cannot be undone.")) {
      return;
    }
    setDeletingVehicle(true);
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/vehicles");
      }
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
    } finally {
      setDeletingVehicle(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        fetchVehicle();
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (!vehicle) return null;

  // Aggregate all history items from all documents
  const allHistory: any[] = [];
  vehicle.documents?.forEach((doc: any) => {
    doc.history?.forEach((h: any) => {
      allHistory.push({
        ...h,
        documentType: formatDocumentType(doc.type, doc.customTypeName),
      });
    });
  });
  allHistory.sort((a, b) => new Date(b.renewedAt).getTime() - new Date(a.renewedAt).getTime());

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all vehicles
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/vehicles/${vehicle.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Edit className="w-3.5 h-3.5 text-blue-500" />
            Edit Vehicle
          </Link>
          <button
            onClick={handleDeleteVehicle}
            disabled={deletingVehicle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Vehicle Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Photo */}
          <div className="h-60 md:h-full min-h-[220px] bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
            {vehicle.photoUrl ? (
              <img
                src={vehicle.photoUrl}
                alt={vehicle.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <Car className="w-20 h-20 text-slate-300 dark:text-slate-600" />
            )}
            <span className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white font-mono text-sm uppercase font-bold tracking-wider shadow">
              {vehicle.registrationNumber}
            </span>
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 md:col-span-2 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 uppercase">
                  {vehicle.type}
                </span>
                <span className="text-xs text-slate-400">
                  Registered in {vehicle.year}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {vehicle.nickname}
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {vehicle.make} {vehicle.model}
              </p>
            </div>

            {/* Spec metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Fuel Type</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <Fuel className="w-3.5 h-3.5 text-blue-500" />
                  {vehicle.fuelType}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Owner</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 truncate">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  {vehicle.ownerName || "Not specified"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Manufacturing Year</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {vehicle.year}
                </span>
              </div>

              {vehicle.chassisNumber && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Chassis / VIN</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    {vehicle.chassisNumber}
                  </span>
                </div>
              )}

              {vehicle.engineNumber && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Engine Number</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    {vehicle.engineNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Compliance Documents ({vehicle.documents?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Insurance, PUC emission certificate, RC, fitness, tax receipts and permits
            </p>
          </div>
          <button
            onClick={() => {
              setEditingDoc(null);
              setShowAddDocModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Document
          </button>
        </div>

        {/* Documents List */}
        {vehicle.documents?.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No documents linked to this vehicle yet
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add your insurance policy, PUC or registration document to track expiration dates.
            </p>
            <button
              onClick={() => setShowAddDocModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Add First Document
            </button>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800/60">
            {vehicle.documents.map((doc: any) => {
              const docName = formatDocumentType(doc.type, doc.customTypeName);
              const meta = doc.metadata ? (typeof doc.metadata === "string" ? JSON.parse(doc.metadata) : doc.metadata) : {};

              return (
                <div
                  key={doc.id}
                  className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-3 rounded-2xl transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {docName}
                      </span>
                      {doc.documentNumber && (
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {doc.documentNumber}
                        </span>
                      )}
                      <DocumentBadge expiryDate={doc.expiryDate} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span>Expires: <strong className="text-slate-700 dark:text-slate-300">{formatDate(doc.expiryDate)}</strong></span>
                      {doc.issueDate && (
                        <span>Issued: {formatDate(doc.issueDate)}</span>
                      )}
                      {meta.provider && (
                        <span>Provider: <strong className="text-slate-700 dark:text-slate-300">{meta.provider}</strong></span>
                      )}
                      {meta.premium && (
                        <span>Premium: ₹{meta.premium}</span>
                      )}
                    </div>

                    {doc.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        "{doc.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                        View File
                      </a>
                    )}

                    <button
                      onClick={() => setRenewingDoc({ ...doc, vehicle })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Renew
                    </button>

                    <button
                      onClick={() => {
                        setEditingDoc(doc);
                        setShowAddDocModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Edit Document"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Renewal History Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Renewal History Timeline
            </h2>
            <p className="text-xs text-slate-500">
              Audit trail of previous renewals, archived policies, and certificate cycles
            </p>
          </div>
        </div>

        {allHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No past renewals yet. When you use the "Renew" action on any document, previous records will automatically appear here.
          </div>
        ) : (
          <div className="mt-6 relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {allHistory.map((item, index) => (
              <div key={item.id || index} className="relative">
                {/* Timeline circle node */}
                <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 shadow-sm" />

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {item.documentType} Renewed
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Renewed on {formatDate(item.renewedAt)}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <span>
                      Previous Expiry: <strong>{formatDate(item.expiryDate)}</strong>
                    </span>
                    {item.documentNumber && (
                      <span>
                        Previous Number: <strong className="font-mono">{item.documentNumber}</strong>
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="mt-2 text-xs text-slate-500 italic">
                      "{item.notes}"
                    </p>
                  )}

                  {item.fileUrl && (
                    <div className="mt-3">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Archived File ({item.fileName || "View Document"})
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Document Modal */}
      {showAddDocModal && (
        <DocumentFormModal
          vehicleId={vehicle.id}
          isOpen={showAddDocModal}
          existingDoc={editingDoc}
          onClose={() => {
            setShowAddDocModal(false);
            setEditingDoc(null);
          }}
          onSuccess={fetchVehicle}
        />
      )}

      {/* Renew Modal */}
      {renewingDoc && (
        <RenewModal
          document={renewingDoc}
          isOpen={!!renewingDoc}
          onClose={() => setRenewingDoc(null)}
          onSuccess={fetchVehicle}
        />
      )}
    </div>
  );
}
