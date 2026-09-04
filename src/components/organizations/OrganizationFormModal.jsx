"use client";

import {
  useEffect,
  useState,
} from "react";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  industry: "",
  plan: "FREE",
  status: "ACTIVE",

  address: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
  },

  admin: {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  },
};

export default function OrganizationFormModal({
  open,
  organization = null,
  loading = false,
  onClose,
  onSubmit,
}) {
  const isEdit =
    Boolean(organization);

  const [form, setForm] =
    useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (organization) {
      setForm({
        ...EMPTY_FORM,

        name:
          organization?.name || "",

        email:
          organization?.email || "",

        phone:
          organization?.phone || "",

        industry:
          organization?.industry ||
          "",

        plan:
          organization?.plan ||
          "FREE",

        status:
          organization?.status ||
          "ACTIVE",

        address: {
          ...EMPTY_FORM.address,
          ...(organization?.address ||
            {}),
        },
      });
    } else {
      setForm(
        EMPTY_FORM
      );
    }
  }, [
    open,
    organization,
  ]);

  if (!open) {
    return null;
  }

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateAddress = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));
  };

  const updateAdmin = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      admin: {
        ...current.admin,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (isEdit) {
      await onSubmit({
        name: form.name,
        email: form.email,
        phone: form.phone,
        industry: form.industry,
        plan: form.plan,
        status: form.status,
        address: form.address,
      });

      return;
    }

    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit
                ? "Edit Organization"
                : "Create Organization"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEdit
                ? "Update organization information."
                : "Create an organization and its first ORG_ADMIN."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* BODY */}

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="space-y-6 p-6">
            {/* ORGANIZATION */}

            <section>
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                Organization Information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Organization Name
                  </label>

                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Organization Email
                  </label>

                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone
                  </label>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Industry
                  </label>

                  <input
                    value={
                      form.industry
                    }
                    onChange={(event) =>
                      updateField(
                        "industry",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Plan
                  </label>

                  <select
                    value={form.plan}
                    onChange={(event) =>
                      updateField(
                        "plan",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  >
                    <option value="FREE">
                      Free
                    </option>

                    <option value="STARTER">
                      Starter
                    </option>

                    <option value="PROFESSIONAL">
                      Professional
                    </option>

                    <option value="ENTERPRISE">
                      Enterprise
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    value={
                      form.status
                    }
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>

                    <option value="SUSPENDED">
                      Suspended
                    </option>
                  </select>
                </div>
              </div>
            </section>

            {/* ADDRESS */}

            <section>
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                Address
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Address Line 1
                  </label>

                  <input
                    value={
                      form.address
                        .addressLine1
                    }
                    onChange={(event) =>
                      updateAddress(
                        "addressLine1",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Address Line 2
                  </label>

                  <input
                    value={
                      form.address
                        .addressLine2
                    }
                    onChange={(event) =>
                      updateAddress(
                        "addressLine2",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                <input
                  placeholder="City"
                  value={
                    form.address.city
                  }
                  onChange={(event) =>
                    updateAddress(
                      "city",
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />

                <input
                  placeholder="State"
                  value={
                    form.address.state
                  }
                  onChange={(event) =>
                    updateAddress(
                      "state",
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />

                <input
                  placeholder="Country"
                  value={
                    form.address.country
                  }
                  onChange={(event) =>
                    updateAddress(
                      "country",
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />

                <input
                  placeholder="Postal Code"
                  value={
                    form.address
                      .postalCode
                  }
                  onChange={(event) =>
                    updateAddress(
                      "postalCode",
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>
            </section>

            {/* FIRST ADMIN */}

            {!isEdit && (
              <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  First Organization Admin
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    placeholder="First Name"
                    value={
                      form.admin
                        .firstName
                    }
                    onChange={(event) =>
                      updateAdmin(
                        "firstName",
                        event.target.value
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  />

                  <input
                    placeholder="Last Name"
                    value={
                      form.admin
                        .lastName
                    }
                    onChange={(event) =>
                      updateAdmin(
                        "lastName",
                        event.target.value
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  />

                  <input
                    required
                    type="email"
                    placeholder="Admin Email"
                    value={
                      form.admin.email
                    }
                    onChange={(event) =>
                      updateAdmin(
                        "email",
                        event.target.value
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  />

                  <input
                    required
                    minLength={8}
                    type="password"
                    placeholder="Password (minimum 8 characters)"
                    value={
                      form.admin
                        .password
                    }
                    onChange={(event) =>
                      updateAdmin(
                        "password",
                        event.target.value
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>
              </section>
            )}
          </div>

          {/* FOOTER */}

          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : isEdit
                ? "Update Organization"
                : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}