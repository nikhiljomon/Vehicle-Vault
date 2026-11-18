"use client";

import { useState } from "react";
import { X, FileText, Upload, Plus, Check } from "lucide-react";
import { DocumentType } from "@/types";

interface DocumentFormModalProps {
  vehicleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingDoc?: any;
}

const DOCUMENT_TYPES: { label: string; value: DocumentType }[] = [
  { label: "Insurance", value: "INSURANCE" },
  { label: "Pollution Certificate (PUC)", value: "PUC" },
  { label: "Registration Certificate (RC)", value: "RC" },
  { label: "Fitness Certificate", value: "FITNESS" },
  { label: "Road Tax Receipt", value: "ROAD_TAX" },
  { label: "Vehicle Permit", value: "PERMIT" },
  { label: "Driving Licence", value: "DRIVING_LICENCE" },
  { label: "Custom Document Type", value: "CUSTOM" },
];

export function DocumentFormModal({
  vehicleId,
  isOpen,
  onClose,
  onSuccess,
  existingDoc,
}: DocumentFormModalProps) {
  const isEdit = !!existingDoc;

  const [type, setType] = useState<DocumentType>(existingDoc?.type || "INSURANCE");
  const [customTypeName, setCustomTypeName] = useState(existingDoc?.customTypeName || "");
  const [documentNumber, setDocumentNumber] = useState(existingDoc?.documentNumber || "");
  const [issueDate, setIssueDate] = useState(
    existingDoc?.issueDate ? new Date(existingDoc.issueDate).toISOString().split("T")[0] : ""
  );
  const [expiryDate, setExpiryDate] = useState(
    existingDoc?.expiryDate ? new Date(existingDoc.expiryDate).toISOString().split("T")[0] : ""
  );
  const [notes, setNotes] = useState(existingDoc?.notes || "");

  // Metadata for Insurance
  const existingMeta = existingDoc?.metadata
    ? typeof existingDoc.metadata === "string"
      ? JSON.parse(existingDoc.metadata)
      : existingDoc.metadata
    : {};
  const [provider, setProvider] = useState(existingMeta.provider || "");
  const [premium, setPremium] = useState(existingMeta.premium || "");

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!expiryDate) {
      setError("Expiry date is required");
      return;
    }

    if (issueDate && new Date(expiryDate) < new Date(issueDate)) {
      setError("Expiry date cannot be earlier than issue date");
      return;
    }

    if (type === "CUSTOM" && !customTypeName.trim()) {
      setError("Please provide a name for your custom document");
      return;
    }

    setLoading(true);

    try {
      let fileUrl = existingDoc?.fileUrl;
      let fileName = existingDoc?.fileName;
      let fileSize = existingDoc?.fileSize;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const upErr = await uploadRes.json();
          throw new Error(upErr.error || "File upload failed");
        }

        const upData = await uploadRes.json();
        fileUrl = upData.url;
        fileName = upData.fileName;
        fileSize = upData.fileSize;
      }

      const metadata: Record<string, any> = {};
      if (type === "INSURANCE") {
        if (provider) metadata.provider = provider;
        if (premium) metadata.premium = premium;
      }

      const payload = {
        vehicleId,
        type,
        customTypeName: type === "CUSTOM" ? customTypeName : null,
        documentNumber: documentNumber || null,
        issueDate: issueDate || null,
        expiryDate,
        notes: notes || null,
        fileUrl,
        fileName,
        fileSize,
        metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
      };

      const url = isEdit ? `/api/documents/${existingDoc.id}` : "/api/documents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save document");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              {isEdit ? "Edit Document" : "Add Vehicle Document"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
              {error}
            </div>
          )}

          {/* Document Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          {type === "CUSTOM" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Document Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Fastag Warranty, State Border Permit"
                value={customTypeName}
                onChange={(e) => setCustomTypeName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Policy / Certificate / Document Number
            </label>
            <input
              type="text"
              placeholder="e.g. POL-8921029 / DL-0120230009"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Insurance specific fields */}
          {type === "INSURANCE" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  placeholder="e.g. ICICI Lombard, HDFC ERGO"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Annual Premium (₹ / $)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15200"
                  value={premium}
                  onChange={(e) => setPremium(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Issue Date (Optional)
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Includes roadside assistance and key replacement"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Upload Document File (PDF, PNG, JPG - max 5 MB)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <Upload className="w-4 h-4 text-blue-500" />
                Select File
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file ? (
                <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate max-w-xs">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  {file.name}
                </span>
              ) : existingDoc?.fileName ? (
                <span className="text-xs text-slate-500 truncate max-w-xs">
                  Current: {existingDoc.fileName}
                </span>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? (
                "Saving..."
              ) : isEdit ? (
                <>
                  <Check className="w-4 h-4" /> Save Changes
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
