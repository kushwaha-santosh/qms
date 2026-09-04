"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  FileWarning,
  GraduationCap,
  HelpCircle,
  LifeBuoy,
  LockKeyhole,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

const QUICK_LINKS = [
  {
    title: "Getting Started",
    description: "Learn the basics of navigating and using QMS AI.",
    icon: BookOpen,
    href: "#getting-started",
  },
  {
    title: "Documents",
    description: "Understand document control, approval and review workflows.",
    icon: FileText,
    href: "#documents",
  },
  {
    title: "NCR",
    description:
      "Learn how to create, investigate and manage non-conformances.",
    icon: FileWarning,
    href: "#ncr",
  },
  {
    title: "CAPA",
    description: "Understand corrective and preventive action management.",
    icon: CheckCircle2,
    href: "#capa",
  },
  {
    title: "Audits",
    description: "Create audits, record findings and track audit activities.",
    icon: ClipboardCheck,
    href: "#audits",
  },
  {
    title: "Users & Roles",
    description: "Understand roles, permissions and access control.",
    icon: Users,
    href: "#roles",
  },
];

const MODULES = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: Settings,
    description:
      "The Dashboard provides an overview of your organization's quality performance.",
    points: [
      "Monitor open NCR and CAPA records.",
      "Review audit readiness and compliance indicators.",
      "Monitor NCR and CAPA trends.",
      "Review recent quality activities.",
      "Use dashboard date ranges to analyze performance.",
    ],
  },
  {
    id: "ncr",
    title: "Non-Conformance (NCR)",
    icon: FileWarning,
    description:
      "NCR is used to record and manage deviations, defects and other quality non-conformances.",
    points: [
      "Create a new non-conformance.",
      "Record the source, category and description of the issue.",
      "Assign responsibility for investigation and resolution.",
      "Track NCR status and due dates.",
      "Link NCR records with CAPA activities when required.",
    ],
  },
  {
    id: "capa",
    title: "CAPA",
    icon: CheckCircle2,
    description:
      "CAPA manages corrective and preventive actions used to eliminate the causes of quality problems.",
    points: [
      "Create corrective or preventive actions.",
      "Identify root causes.",
      "Define action plans and responsibilities.",
      "Track target dates and completion.",
      "Monitor CAPA status through closure.",
    ],
  },
  {
    id: "audits",
    title: "Audits",
    icon: ClipboardCheck,
    description:
      "The Audits module helps manage internal and external quality audits.",
    points: [
      "Create and schedule audits.",
      "Define audit scope and criteria.",
      "Assign auditors.",
      "Record audit findings.",
      "Track audit status and due dates.",
    ],
  },
  {
    id: "documents",
    title: "Documents",
    icon: FileText,
    description:
      "The Documents module provides controlled document management for the QMS.",
    points: [
      "Upload controlled documents.",
      "Manage document metadata and revisions.",
      "Submit documents for approval.",
      "Track document status.",
      "Manage review dates.",
      "Retain document history for audit purposes.",
    ],
  },
  {
    id: "training",
    title: "Training",
    icon: GraduationCap,
    description:
      "Training helps organizations manage employee training and competency activities.",
    points: [
      "Create training records.",
      "Assign training to employees.",
      "Track completion.",
      "Monitor overdue training.",
      "Maintain training history.",
    ],
  },
];

const FAQS = [
  {
    question: "How do I create a new NCR?",
    answer:
      "Open Non-Conformance from the sidebar and select the option to create a new NCR. Enter the required information, assign responsibility and save the record. The NCR can then be investigated and progressed through its configured workflow.",
  },
  {
    question: "How do I create a CAPA?",
    answer:
      "Open CAPA from the sidebar and create a new CAPA record. Enter the problem description, root cause, action plan, responsibility and target dates. Save the record and update its status as actions progress.",
  },
  {
    question: "Why can't I see a particular menu?",
    answer:
      "Menu visibility is controlled by your role and permissions. If a module is not visible, your account may not have the required permission. Contact your QMS administrator if you believe you should have access.",
  },
  {
    question: "Why can't I edit a record?",
    answer:
      "Editing access is controlled by your role and the permissions assigned to your account. Some records may also be restricted because of their current workflow status.",
  },
  {
    question: "How are documents controlled?",
    answer:
      "Documents can move through configured document-control statuses such as draft, review and approval. Approved documents are treated as controlled documents and their review information can be monitored from the QMS.",
  },
  {
    question: "Where can I see system activity?",
    answer:
      "Authorized users can access Audit Logs from Administration. Audit logs provide traceability for important system and quality-management activities.",
  },
  {
    question: "What should I do when an NCR requires corrective action?",
    answer:
      "Investigate the NCR and determine whether corrective or preventive action is required. When applicable, create or associate a CAPA and track the resulting actions through completion and effectiveness review.",
  },
  {
    question: "Who can change users and permissions?",
    answer:
      "User, role and permission management is restricted to users with the appropriate administration permissions. Organization administrators and other authorized roles may have different levels of access.",
  },
];

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ModuleCard({ module }) {
  const Icon = module.icon;

  return (
    <div
      id={module.id}
      className="
        scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5
        shadow-sm transition-shadow hover:shadow-md
        dark:border-slate-800 dark:bg-slate-900
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
            bg-slate-100 text-slate-700
            dark:bg-slate-800 dark:text-slate-200
          "
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {module.title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {module.description}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {module.points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300"
          >
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredModules = useMemo(() => {
    if (!normalizedSearch) {
      return MODULES;
    }

    return MODULES.filter((module) => {
      const searchableText = [
        module.title,
        module.description,
        ...module.points,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [normalizedSearch]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedSearch) {
      return FAQS;
    }

    return FAQS.filter((faq) => {
      const searchableText = `${faq.question} ${faq.answer}`.toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [normalizedSearch]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <section
        className="
          relative overflow-hidden rounded-2xl
          border border-slate-200 bg-white
          px-5 py-7 shadow-sm sm:px-7
          dark:border-slate-800 dark:bg-slate-900
        "
      >
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            <LifeBuoy className="h-4 w-4" />
            QMS AI Help Center
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            How can we help?
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Find guidance for managing quality processes, documents, audits,
            NCRs, CAPAs, training and administration.
          </p>

          <div className="relative mt-5 max-w-2xl">
            <Search
              className="
                absolute left-3 top-1/2 h-4 w-4
                -translate-y-1/2 text-slate-400
              "
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search help topics..."
              className="
                h-11 w-full rounded-xl border
                border-slate-200 bg-slate-50
                pl-10 pr-4 text-sm text-slate-900
                outline-none transition
                placeholder:text-slate-400
                focus:border-slate-400 focus:bg-white
                dark:border-slate-700 dark:bg-slate-800
                dark:text-white dark:placeholder:text-slate-500
                dark:focus:border-slate-500 dark:focus:bg-slate-800
              "
            />
          </div>
        </div>

        <div
          className="
            pointer-events-none absolute -right-16 -top-20
            h-56 w-56 rounded-full
            bg-slate-100 blur-3xl
            dark:bg-blue-950/30
          "
        />
      </section>

      {/* Quick Links */}
      {!normalizedSearch && (
        <section>
          <SectionTitle
            icon={BookOpen}
            title="Quick Help"
            description="Jump directly to a common QMS topic."
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.title}
                  href={item.href}
                  className="
                    group rounded-xl border border-slate-200
                    bg-white p-4 shadow-sm transition-all
                    hover:-translate-y-0.5 hover:border-slate-300
                    hover:shadow-md
                    dark:border-slate-800 dark:bg-slate-900
                    dark:hover:border-slate-700
                  "
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="
                        flex h-9 w-9 shrink-0 items-center justify-center
                        rounded-lg bg-slate-100 text-slate-700
                        dark:bg-slate-800 dark:text-slate-200
                      "
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>

                        <ArrowRight
                          className="
                            h-4 w-4 shrink-0 text-slate-400
                            transition-transform
                            group-hover:translate-x-0.5
                          "
                        />
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Getting Started */}
      {!normalizedSearch && (
        <section
          id="getting-started"
          className="
            scroll-mt-24 rounded-xl border border-slate-200
            bg-white p-5 shadow-sm
            dark:border-slate-800 dark:bg-slate-900
          "
        >
          <SectionTitle
            icon={BookOpen}
            title="Getting Started"
            description="A simple workflow for using QMS AI."
          />

          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                number: "01",
                title: "Navigate",
                text: "Use the sidebar to access the QMS modules available to your role.",
              },
              {
                number: "02",
                title: "Create",
                text: "Create quality records such as NCRs, CAPAs, audits and controlled documents.",
              },
              {
                number: "03",
                title: "Track",
                text: "Monitor status, ownership, due dates and activities throughout the workflow.",
              },
              {
                number: "04",
                title: "Close",
                text: "Complete required actions, approvals and reviews before closing a record.",
              },
            ].map((step) => (
              <div key={step.number} className="relative">
                <div className="text-xs font-bold text-slate-300 dark:text-slate-600">
                  {step.number}
                </div>

                <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modules */}
      <section>
        <SectionTitle
          icon={Settings}
          title="QMS Modules"
          description={
            normalizedSearch
              ? `Showing ${filteredModules.length} matching module${
                  filteredModules.length === 1 ? "" : "s"
                }.`
              : "Learn what each major QMS module is used for."
          }
        />

        {filteredModules.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        ) : (
          <div
            className="
              rounded-xl border border-dashed border-slate-300
              bg-white px-5 py-10 text-center
              dark:border-slate-700 dark:bg-slate-900
            "
          >
            <Search className="mx-auto h-7 w-7 text-slate-400" />

            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              No matching help topics found
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Try a different search term.
            </p>
          </div>
        )}
      </section>

      {/* Roles & Permissions */}
      {!normalizedSearch && (
        <section
          id="roles"
          className="
            scroll-mt-24 rounded-xl border border-slate-200
            bg-white p-5 shadow-sm
            dark:border-slate-800 dark:bg-slate-900
          "
        >
          <SectionTitle
            icon={ShieldCheck}
            title="Roles & Permissions"
            description="Access to QMS features is controlled by role-based permissions."
          />

          <div className="grid gap-3 md:grid-cols-2">
            <div
              className="
                rounded-lg bg-slate-50 p-4
                dark:bg-slate-800/60
              "
            >
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-slate-500 dark:text-slate-400" />

                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Why do I see different menus?
                </h3>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                QMS AI uses role-based access control. Your available menus and
                actions depend on the permissions assigned to your account.
              </p>
            </div>

            <div
              className="
                rounded-lg bg-slate-50 p-4
                dark:bg-slate-800/60
              "
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />

                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Need additional access?
                </h3>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Contact your QMS administrator or organization administrator and
                request the required permission.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <span>Role</span>
              <span>Typical Responsibility</span>
            </div>

            {[
              ["Super Admin", "System-wide administration"],
              ["Org Admin", "Organization administration"],
              ["Quality Manager", "Quality process management"],
              ["Quality Engineer", "Quality activities and records"],
              ["Auditor", "Audit activities"],
              ["Employee", "Assigned quality activities"],
              ["Viewer", "Read-only access"],
            ].map(([role, responsibility]) => (
              <div
                key={role}
                className="
                  grid grid-cols-2 border-b border-slate-100
                  px-4 py-2.5 text-xs last:border-b-0
                  dark:border-slate-800
                "
              >
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {role}
                </span>

                <span className="text-slate-500 dark:text-slate-400">
                  {responsibility}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section
        id="faq"
        className="
          scroll-mt-24 rounded-xl border border-slate-200
          bg-white p-5 shadow-sm
          dark:border-slate-800 dark:bg-slate-900
        "
      >
        <SectionTitle
          icon={HelpCircle}
          title="Frequently Asked Questions"
          description="Answers to common QMS questions."
        />

        {filteredFaqs.length > 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="
                      flex w-full items-center justify-between
                      gap-4 py-3.5 text-left
                    "
                  >
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {faq.question}
                    </span>

                    <ChevronDown
                      className={`
                        h-4 w-4 shrink-0 text-slate-400
                        transition-transform duration-200
                        ${isOpen ? "rotate-180" : ""}
                      `}
                    />
                  </button>

                  {isOpen && (
                    <div className="pb-4 pr-8 text-xs leading-6 text-slate-500 dark:text-slate-400">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              No matching FAQ found
            </p>
          </div>
        )}
      </section>

      {/* Support */}
      {!normalizedSearch && (
        <section
          className="
            rounded-xl border border-slate-200
            bg-slate-50 p-5
            dark:border-slate-800 dark:bg-slate-900/60
          "
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="
                  flex h-9 w-9 shrink-0 items-center justify-center
                  rounded-lg bg-white text-slate-700 shadow-sm
                  dark:bg-slate-800 dark:text-slate-200
                "
              >
                <LifeBuoy className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Still need help?
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Contact your QMS administrator for access, workflow or
                  configuration-related questions.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="
                inline-flex h-9 shrink-0 items-center justify-center
                rounded-lg bg-slate-900 px-4 text-xs font-semibold
                text-white transition hover:bg-slate-800
                dark:bg-blue-600 dark:hover:bg-blue-500
              "
            >
              Back to Dashboard
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
