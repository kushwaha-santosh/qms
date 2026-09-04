"use client";

import { useEffect, useState } from "react";
import QMSReferenceSelect from "@/components/qms/QMSReferenceSelect";
import { getUsers } from "@/lib/api/users.api";
import { getOrganizations } from "@/lib/api/organization.api";

const empty = {
  organizationId: "",
  trainingNumber: "",
  title: "",
  trainingType: "",
  department: "",
  trainer: "",
  participants: [],
  scheduledDate: "",
  completionDate: "",
  dueDate: "",
  status: "",
  statusComment: "",
  description: "",
  remarks: "",
};

const date = (value) => {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value).slice(0, 10);
  }

  return d.toISOString().slice(0, 10);
};

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
};

const normalizeList = (response, keys = []) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

export default function TrainingFormModal({
  open,
  training,
  user,
  saving = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(empty);
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const superAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";

  /*
   * Populate form whenever modal opens or training changes.
   */
  useEffect(() => {
    if (!open) return;

    if (training) {
      const organizationId = getId(training.organizationId);

      const trainer = getId(training.trainer);

      const participants = Array.isArray(training.participants)
        ? training.participants.map(getId).filter(Boolean)
        : [];

      setForm({
        ...empty,
        ...training,

        organizationId,

        trainingNumber: training.trainingNumber || "",
        title: training.title || "",
        trainingType: training.trainingType || "",
        department: training.department || "",

        trainer,

        participants,

        scheduledDate: date(training.scheduledDate),
        completionDate: date(training.completionDate),
        dueDate: date(training.dueDate),

        status: training.status || "",
        statusComment: training.statusComment || "",

        description: training.description || "",
        remarks: training.remarks || "",
      });
    } else {
      const organizationId = getId(user?.organizationId) || "";

      setForm({
        ...empty,
        organizationId,
      });
    }

    setError("");
  }, [open, training, user]);

  /*
   * Load organizations for SUPER_ADMIN.
   */
  useEffect(() => {
    if (!open || !superAdmin) {
      return;
    }

    getOrganizations({
      page: 1,
      limit: 100,
    })
      .then((response) => {
        const organizations = normalizeList(response, [
          "organizations",
          "records",
          "items",
        ]);

        setOrgs(organizations);
      })
      .catch((err) => {
        console.error("Failed to load organizations:", err);
        setOrgs([]);
      });
  }, [open, superAdmin]);

  /*
   * Load users for the selected/current organization.
   */
  useEffect(() => {
    if (!open) return;

    const organizationId =
      getId(form.organizationId) || getId(user?.organizationId);

    /*
     * SUPER_ADMIN must select an organization before
     * trainer/participant users can be loaded.
     */
    if (superAdmin && !organizationId) {
      setUsers([]);
      return;
    }

    setLoadingUsers(true);

    getUsers({
      page: 1,
      limit: 100,
      organizationId,
    })
      .then((response) => {
        const list = normalizeList(response, ["users", "records", "items"]);

        setUsers(list);
      })
      .catch((err) => {
        console.error("Failed to load training users:", err);
        setUsers([]);
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, [open, superAdmin, form.organizationId, user?.organizationId]);

  if (!open) {
    return null;
  }

  const change = (event) => {
    const { name, value, multiple, selectedOptions } = event.target;

    const nextValue = multiple
      ? Array.from(selectedOptions).map((option) => option.value)
      : value;

    setForm((previous) => ({
      ...previous,
      [name]: nextValue,
    }));

    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.trainingNumber || !form.title) {
      setError("Training number and title are required.");
      return;
    }

    if (superAdmin && !form.organizationId) {
      setError("Organization is required.");
      return;
    }

    try {
      await onSubmit({
        ...form,
        organizationId: form.organizationId || undefined,
        trainer: form.trainer || null,
        participants: Array.isArray(form.participants) ? form.participants : [],
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save training.",
      );
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];
  const safeOrgs = Array.isArray(orgs) ? orgs : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="mx-auto my-6 max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {training ? "Edit Training" : "New Training"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-2xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {/* ORGANIZATION */}
          {superAdmin && (
            <label className="text-sm">
              <span className="mb-1 block font-medium">Organization *</span>

              <select
                name="organizationId"
                value={form.organizationId}
                onChange={change}
                required
                disabled={Boolean(training)}
                className="w-full rounded-xl border px-3 py-2.5 disabled:bg-slate-100"
              >
                <option value="">Select organization</option>

                {safeOrgs.map((organization) => (
                  <option key={organization._id} value={organization._id}>
                    {organization.name}
                  </option>
                ))}
              </select>

              {training && (
                <span className="mt-1 block text-xs text-slate-500">
                  Organization cannot be changed while editing.
                </span>
              )}
            </label>
          )}

          {/* TRAINING NUMBER */}
          <label className="text-sm">
            <span className="mb-1 block font-medium">Training Number *</span>

            <input
              name="trainingNumber"
              value={form.trainingNumber}
              onChange={change}
              required
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          {/* TITLE */}
          <label className="text-sm">
            <span className="mb-1 block font-medium">Title *</span>

            <input
              name="title"
              value={form.title}
              onChange={change}
              required
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          {/* TRAINING TYPE */}
          <QMSReferenceSelect
            sourceType="TRAINING_TYPE"
            name="trainingType"
            label="Training Type"
            module="TRAINING"
            value={form.trainingType}
            onChange={change}
            organizationId={form.organizationId}
          />

          {/* DEPARTMENT */}
          <QMSReferenceSelect
            sourceType="DEPARTMENT"
            name="department"
            label="Department"
            module="TRAINING"
            value={form.department}
            onChange={change}
            organizationId={form.organizationId}
          />

          {/* TRAINER */}
          <label className="text-sm">
            <span className="mb-1 block font-medium">Trainer</span>

            <select
              name="trainer"
              value={form.trainer}
              onChange={change}
              disabled={loadingUsers}
              className="w-full rounded-xl border px-3 py-2.5 disabled:bg-slate-100"
            >
              <option value="">
                {loadingUsers ? "Loading users..." : "Select trainer"}
              </option>

              {safeUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName || ""} {u.lastName || ""}
                  {u.email ? ` (${u.email})` : ""}
                </option>
              ))}
            </select>
          </label>

          {/* PARTICIPANTS */}
          <label className="text-sm">
            <span className="mb-1 block font-medium">Participants</span>

            <select
              multiple
              name="participants"
              value={Array.isArray(form.participants) ? form.participants : []}
              onChange={change}
              disabled={loadingUsers}
              className="h-28 w-full rounded-xl border px-3 py-2.5 disabled:bg-slate-100"
            >
              {safeUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName || ""} {u.lastName || ""}
                  {u.email ? ` (${u.email})` : ""}
                </option>
              ))}
            </select>
          </label>

          {/* SCHEDULED DATE */}
          <label className="text-sm">
            <span className="mb-1 block font-medium">Scheduled Date</span>

            <input
              type="date"
              name="scheduledDate"
              value={form.scheduledDate}
              onChange={change}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          {/* DUE DATE */}
          <label className="text-sm">
            <span className="mb-1 block font-medium">Due Date</span>

            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={change}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          {/* COMPLETION DATE */}
          <label className="text-sm">
            <span className="mb-1 block font-medium">Completion Date</span>

            <input
              type="date"
              name="completionDate"
              value={form.completionDate}
              onChange={change}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          {/* STATUS */}
          {training && (
            <QMSReferenceSelect
              sourceType="QMS_STATUS"
              name="status"
              label="Status"
              module="TRAINING"
              value={form.status}
              onChange={change}
              organizationId={form.organizationId}
            />
          )}

          {/* DESCRIPTION */}
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Description</span>

            <textarea
              name="description"
              value={form.description}
              onChange={change}
              rows={3}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>

          {/* REMARKS */}
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Remarks</span>

            <textarea
              name="remarks"
              value={form.remarks}
              onChange={change}
              rows={2}
              className="w-full rounded-xl border px-3 py-2.5"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border px-4 py-2.5"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Training"}
          </button>
        </div>
      </form>
    </div>
  );
}
