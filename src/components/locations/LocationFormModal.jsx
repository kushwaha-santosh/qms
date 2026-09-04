"use client";

import { useEffect, useState } from "react";

const LOCATION_TYPES = [
  {
    value: "COUNTRY",
    label: "Country",
  },
  {
    value: "STATE",
    label: "State / UT",
  },
  {
    value: "DISTRICT",
    label: "District",
  },
  {
    value: "CITY",
    label: "City",
  },
  {
    value: "PINCODE",
    label: "Pincode",
  },
];

const INITIAL_FORM = {
  type: "COUNTRY",
  name: "",
  code: "",
  parentId: "",
  pincode: "",
  isActive: true,
};

export default function LocationFormModal({
  open,
  item = null,
  type = "COUNTRY",
  parentOptions = [],
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(INITIAL_FORM);

  const [error, setError] = useState("");

  const isEditing = Boolean(item);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      type: item?.type || type || "COUNTRY",

      name: item?.name || "",

      code: item?.code || "",

      parentId: item?.parentId?._id || item?.parentId || "",

      pincode: item?.pincode || "",

      isActive: item?.isActive !== false,
    });

    setError("");
  }, [open, item, type]);

  if (!open) {
    return null;
  }

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const getParentLabel = () => {
    switch (form.type) {
      case "STATE":
        return "Country";

      case "DISTRICT":
        return "State / UT";

      case "CITY":
        return "District";

      case "PINCODE":
        return "City";

      default:
        return "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Location name is required.");
      return;
    }

    if (form.type !== "COUNTRY" && !form.parentId) {
      setError(`${getParentLabel()} is required.`);
      return;
    }

    if (form.type === "PINCODE") {
      if (!/^\d{6}$/.test(form.pincode.trim())) {
        setError("Pincode must contain exactly 6 digits.");
        return;
      }
    }

    try {
      await onSubmit({
        type: form.type,

        name: form.name.trim(),

        code: form.code.trim().toUpperCase(),

        parentId: form.parentId || null,

        pincode: form.type === "PINCODE" ? form.pincode.trim() : null,

        isActive: Boolean(form.isActive),
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save location.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditing ? "Edit Location" : "Add Location"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Country → State / UT → District → City → Pincode
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* TYPE */}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Location Type
            </span>

            <select
              value={form.type}
              disabled={isEditing || loading}
              onChange={(event) => setField("type", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50"
            >
              {LOCATION_TYPES.map((locationType) => (
                <option key={locationType.value} value={locationType.value}>
                  {locationType.label}
                </option>
              ))}
            </select>
          </label>

          {/* PARENT */}

          {form.type !== "COUNTRY" && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                {getParentLabel()}
              </span>

              <select
                value={form.parentId}
                disabled={isEditing || loading}
                onChange={(event) => setField("parentId", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50"
              >
                <option value="">Select {getParentLabel()}</option>

                {parentOptions.map((parent) => (
                  <option key={parent._id} value={parent._id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* NAME + CODE */}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </span>

              <input
                required
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50"
                placeholder={
                  form.type === "COUNTRY"
                    ? "India"
                    : form.type === "STATE"
                      ? "Uttar Pradesh"
                      : form.type === "DISTRICT"
                        ? "Ghazipur"
                        : form.type === "CITY"
                          ? "Ghazipur"
                          : "233001"
                }
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Code
              </span>

              <input
                value={form.code}
                onChange={(event) => setField("code", event.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase disabled:bg-slate-50"
                placeholder="UP"
              />
            </label>
          </div>

          {/* PINCODE */}

          {form.type === "PINCODE" && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Pincode
              </span>

              <input
                required
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(event) =>
                  setField("pincode", event.target.value.replace(/\D/g, ""))
                }
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50"
                placeholder="233001"
              />
            </label>
          )}

          {/* ACTIVE */}

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={loading}
              onChange={(event) => setField("isActive", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />

            <span>
              <span className="block text-sm font-medium text-slate-700">
                Active
              </span>

              <span className="block text-xs text-slate-400">
                Inactive locations will not normally appear in operational
                dropdowns.
              </span>
            </span>
          </label>

          {/* FOOTER */}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
