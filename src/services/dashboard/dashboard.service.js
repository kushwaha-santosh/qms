import CAPA from "@/models/CAPA";
import NCR from "@/models/NCR";
import Audit from "@/models/Audit";
import Document from "@/models/Document";
import AuditLog from "@/models/AuditLog";

// ==========================================================
// HELPERS
// ==========================================================

const isValidDate = (value) => {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
};

// ==========================================================
// START OF DAY
// ==========================================================

const startOfDay = (date) => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
};

// ==========================================================
// END OF DAY
// ==========================================================

const endOfDay = (date) => {
  const result = new Date(date);

  result.setHours(23, 59, 59, 999);

  return result;
};

// ==========================================================
// DEFAULT RANGE
// ==========================================================

const getDefaultDateRange = () => {
  const today = new Date();

  const endDate = endOfDay(today);

  const startDate = new Date(today);

  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - 5);

  return {
    startDate: startOfDay(startDate),
    endDate,
  };
};

// ==========================================================
// NORMALIZE DATE RANGE
// ==========================================================

const getDateRange = ({ startDate, endDate }) => {
  const defaults = getDefaultDateRange();

  let resolvedStart = defaults.startDate;

  let resolvedEnd = defaults.endDate;

  if (startDate && isValidDate(startDate)) {
    resolvedStart = startOfDay(new Date(startDate));
  }

  if (endDate && isValidDate(endDate)) {
    resolvedEnd = endOfDay(new Date(endDate));
  }

  if (resolvedStart > resolvedEnd) {
    const error = new Error("Start date cannot be later than end date.");

    error.statusCode = 400;

    throw error;
  }

  return {
    startDate: resolvedStart,
    endDate: resolvedEnd,
  };
};

// ==========================================================
// BUILD MONTHS
// ==========================================================

const buildMonths = (startDate, endDate) => {
  const months = [];

  const cursor = new Date(startDate);

  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= endDate) {
    months.push({
      year: cursor.getFullYear(),

      month: cursor.getMonth() + 1,

      label: cursor.toLocaleString("en-US", {
        month: "short",
      }),
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
};

// ==========================================================
// MONTH KEY
// ==========================================================

const monthKey = (year, month) => `${year}-${month}`;

// ==========================================================
// SAFE NUMBER
// ==========================================================

const numberValue = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

// ==========================================================
// STATUS NORMALIZER
// ==========================================================

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

// ==========================================================
// DISPLAY LABEL
// ==========================================================
//
// Converts database values:
//
// DOCUMENTATION -> Documentation
// IN_PROGRESS   -> In Progress
// UNDER_REVIEW  -> Under Review
//
// Database values remain unchanged.
// Only dashboard display values are formatted.
// ==========================================================

const formatDisplayLabel = (value) => {
  const text = String(value || "")
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

  if (!text) {
    return "";
  }

  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

// ==========================================================
// CREATED IN RANGE
// ==========================================================

const createdInRange = (startDate, endDate) => ({
  createdAt: {
    $gte: startDate,

    $lte: endDate,
  },
});

// ==========================================================
// ORGANIZATION ID NORMALIZER
// ==========================================================
//
// Supports:
//
// organizationId
//
// organizationId._id
//
// ObjectId
//
// string ObjectId
// ==========================================================

const resolveOrganizationId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value._id) {
    return value._id;
  }

  return value;
};

// ==========================================================
// COMPLIANCE SCORE
// ==========================================================

const calculateComplianceScore = ({ openCapa, openNcr, overdueActions }) => {
  let score = 100;

  score -= Math.min(numberValue(openCapa) * 0.5, 15);

  score -= Math.min(numberValue(openNcr) * 0.75, 15);

  score -= Math.min(numberValue(overdueActions) * 1, 20);

  return Math.max(Math.round(score), 0);
};

// ==========================================================
// AUDIT READINESS
// ==========================================================

const calculateAuditReadiness = ({
  overdueActions,
  openCapa,
  openNcr,
  controlledDocuments,
}) => {
  let score = 100;

  score -= Math.min(numberValue(overdueActions) * 1, 25);

  score -= Math.min(numberValue(openCapa) * 0.25, 15);

  score -= Math.min(numberValue(openNcr) * 0.5, 15);

  if (numberValue(controlledDocuments) === 0) {
    score -= 20;
  }

  score = Math.max(Math.round(score), 0);

  return {
    score,

    status:
      score >= 90 ? "READY" : score >= 75 ? "PARTIALLY_READY" : "NOT_READY",
  };
};

// ==========================================================
// DASHBOARD SUMMARY
// ==========================================================

export const getDashboardSummary = async ({
  organizationId = null,
  role = "",
  startDate = null,
  endDate = null,
} = {}) => {
  const normalizedRole = String(role || "")
    .trim()
    .toUpperCase();

  const isSuperAdmin = normalizedRole === "SUPER_ADMIN";

  // ========================================================
  // ORGANIZATION FILTER
  // ========================================================
  //
  // SUPER_ADMIN:
  //   Global dashboard.
  //   organizationId is intentionally not applied.
  //
  // ORGANIZATION USER:
  //   Always restricted to authenticated organization.
  //
  // ========================================================

  const resolvedOrganizationId = resolveOrganizationId(organizationId);

  const tenantFilter = isSuperAdmin
    ? {}
    : {
        organizationId: resolvedOrganizationId,
      };

  if (!isSuperAdmin && !resolvedOrganizationId) {
    const error = new Error("Organization information is required.");

    error.statusCode = 400;

    throw error;
  }

  // ========================================================
  // DATE RANGE
  // ========================================================

  const range = getDateRange({
    startDate,
    endDate,
  });

  const analyticsStartDate = range.startDate;

  const analyticsEndDate = range.endDate;

  const now = new Date();

  const endOfToday = endOfDay(now);

  // ========================================================
  // END OF WEEK
  // ========================================================

  const startOfWeek = startOfDay(now);

  const endOfWeek = new Date(now);

  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  endOfWeek.setHours(23, 59, 59, 999);

  // ========================================================
  // SELECTED RANGE / CURRENT WEEK INTERSECTION
  // ========================================================

  const selectedWeekStart = new Date(
    Math.max(analyticsStartDate.getTime(), startOfWeek.getTime()),
  );

  const selectedWeekEnd = new Date(
    Math.min(analyticsEndDate.getTime(), endOfWeek.getTime()),
  );

  const hasCurrentWeekInSelectedRange = selectedWeekStart <= selectedWeekEnd;

  // ========================================================
  // KPI COUNTS
  // ========================================================

  const [openCapa, openNcr, auditsDue, auditsDueThisWeek, controlledDocuments] =
    await Promise.all([
      // ------------------------------------------------------
      // OPEN CAPA
      // ------------------------------------------------------

      CAPA.countDocuments({
        ...tenantFilter,

        ...createdInRange(analyticsStartDate, analyticsEndDate),

        status: {
          $nin: ["CLOSED", "CANCELLED"],
        },
      }),

      // ------------------------------------------------------
      // OPEN NCR
      // ------------------------------------------------------

      NCR.countDocuments({
        ...tenantFilter,

        ...createdInRange(analyticsStartDate, analyticsEndDate),

        status: {
          $nin: ["CLOSED", "CANCELLED"],
        },
      }),

      // ------------------------------------------------------
      // AUDITS DUE
      // ------------------------------------------------------

      Audit.countDocuments({
        ...tenantFilter,

        plannedDate: {
          $gte: analyticsStartDate,

          $lte: analyticsEndDate,
        },

        status: {
          $nin: ["COMPLETED", "CANCELLED"],
        },
      }),

      // ------------------------------------------------------
      // AUDITS DUE THIS WEEK
      // ------------------------------------------------------

      hasCurrentWeekInSelectedRange
        ? Audit.countDocuments({
            ...tenantFilter,

            plannedDate: {
              $gte: selectedWeekStart,

              $lte: selectedWeekEnd,
            },

            status: {
              $nin: ["COMPLETED", "CANCELLED"],
            },
          })
        : Promise.resolve(0),

      // ------------------------------------------------------
      // CONTROLLED DOCUMENTS
      // ------------------------------------------------------
      //
      // Controlled documents are approved documents belonging
      // to the organization.
      //
      // We intentionally do not require createdAt to be inside
      // the dashboard analytics range.
      //
      // A document approved earlier is still a controlled
      // document today.
      //
      // ------------------------------------------------------

      Document.countDocuments({
        ...tenantFilter,

        status: "APPROVED",
      }),
    ]);

  // ========================================================
  // OVERDUE COUNTS
  // ========================================================

  const [overdueCapa, overdueNcr, overdueDocuments] = await Promise.all([
    // ------------------------------------------------------
    // OVERDUE CAPA
    // ------------------------------------------------------

    CAPA.countDocuments({
      ...tenantFilter,

      ...createdInRange(analyticsStartDate, analyticsEndDate),

      dueDate: {
        $lt: now,
      },

      status: {
        $nin: ["CLOSED", "CANCELLED"],
      },
    }),

    // ------------------------------------------------------
    // OVERDUE NCR
    // ------------------------------------------------------

    NCR.countDocuments({
      ...tenantFilter,

      ...createdInRange(analyticsStartDate, analyticsEndDate),

      dueDate: {
        $lt: now,
      },

      status: {
        $nin: ["CLOSED", "CANCELLED"],
      },
    }),

    // ------------------------------------------------------
    // OVERDUE DOCUMENTS
    // ------------------------------------------------------

    Document.countDocuments({
      ...tenantFilter,

      reviewDate: {
        $lt: now,
      },

      status: {
        $nin: ["OBSOLETE"],
      },
    }),
  ]);

  const overdueActions = overdueCapa + overdueNcr + overdueDocuments;

  // ========================================================
  // MONTHS
  // ========================================================

  const months = buildMonths(analyticsStartDate, analyticsEndDate);

  // ========================================================
  // MONTHLY NCR / CAPA TREND
  // ========================================================

  const [capaCreatedTrend, capaClosedTrend, ncrCreatedTrend, ncrClosedTrend] =
    await Promise.all([
      // ------------------------------------------------------
      // CAPA CREATED
      // ------------------------------------------------------

      CAPA.aggregate([
        {
          $match: {
            ...tenantFilter,

            createdAt: {
              $gte: analyticsStartDate,

              $lte: analyticsEndDate,
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$createdAt",
              },

              month: {
                $month: "$createdAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,

            "_id.month": 1,
          },
        },
      ]),

      // ------------------------------------------------------
      // CAPA CLOSED
      // ------------------------------------------------------

      CAPA.aggregate([
        {
          $match: {
            ...tenantFilter,

            status: "CLOSED",

            updatedAt: {
              $gte: analyticsStartDate,

              $lte: analyticsEndDate,
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$updatedAt",
              },

              month: {
                $month: "$updatedAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,

            "_id.month": 1,
          },
        },
      ]),

      // ------------------------------------------------------
      // NCR CREATED
      // ------------------------------------------------------

      NCR.aggregate([
        {
          $match: {
            ...tenantFilter,

            createdAt: {
              $gte: analyticsStartDate,

              $lte: analyticsEndDate,
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$createdAt",
              },

              month: {
                $month: "$createdAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,

            "_id.month": 1,
          },
        },
      ]),

      // ------------------------------------------------------
      // NCR CLOSED
      // ------------------------------------------------------

      NCR.aggregate([
        {
          $match: {
            ...tenantFilter,

            status: "CLOSED",

            updatedAt: {
              $gte: analyticsStartDate,

              $lte: analyticsEndDate,
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$updatedAt",
              },

              month: {
                $month: "$updatedAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,

            "_id.month": 1,
          },
        },
      ]),
    ]);

  // ========================================================
  // BUILD TREND MAPS
  // ========================================================

  const capaCreatedMap = new Map();

  const capaClosedMap = new Map();

  const ncrCreatedMap = new Map();

  const ncrClosedMap = new Map();

  capaCreatedTrend.forEach((item) => {
    capaCreatedMap.set(
      monthKey(item._id.year, item._id.month),
      numberValue(item.count),
    );
  });

  capaClosedTrend.forEach((item) => {
    capaClosedMap.set(
      monthKey(item._id.year, item._id.month),
      numberValue(item.count),
    );
  });

  ncrCreatedTrend.forEach((item) => {
    ncrCreatedMap.set(
      monthKey(item._id.year, item._id.month),
      numberValue(item.count),
    );
  });

  ncrClosedTrend.forEach((item) => {
    ncrClosedMap.set(
      monthKey(item._id.year, item._id.month),
      numberValue(item.count),
    );
  });

  // ========================================================
  // COMBINED TREND DATA
  // ========================================================

  const trendData = months.map((month) => {
    const key = monthKey(month.year, month.month);

    return {
      month: month.label,

      ncrOpened: ncrCreatedMap.get(key) || 0,

      ncrClosed: ncrClosedMap.get(key) || 0,

      capaOpened: capaCreatedMap.get(key) || 0,

      capaClosed: capaClosedMap.get(key) || 0,
    };
  });

  // ========================================================
  // RANGE ANALYTICS
  // ========================================================

  const [
    rangeNcrTotal,
    rangeNcrClosed,
    rangeCapaTotal,
    rangeCapaClosed,
    rangeAudits,
    rangeCompletedAudits,
    rangeDocuments,
    rangeApprovedDocuments,
  ] = await Promise.all([
    // NCR total

    NCR.countDocuments({
      ...tenantFilter,

      createdAt: {
        $gte: analyticsStartDate,

        $lte: analyticsEndDate,
      },
    }),

    // NCR closed

    NCR.countDocuments({
      ...tenantFilter,

      status: "CLOSED",

      updatedAt: {
        $gte: analyticsStartDate,

        $lte: analyticsEndDate,
      },
    }),

    // CAPA total

    CAPA.countDocuments({
      ...tenantFilter,

      createdAt: {
        $gte: analyticsStartDate,

        $lte: analyticsEndDate,
      },
    }),

    // CAPA closed

    CAPA.countDocuments({
      ...tenantFilter,

      status: "CLOSED",

      updatedAt: {
        $gte: analyticsStartDate,

        $lte: analyticsEndDate,
      },
    }),

    // Audits total

    Audit.countDocuments({
      ...tenantFilter,

      plannedDate: {
        $gte: analyticsStartDate,

        $lte: analyticsEndDate,
      },
    }),

    // Audits completed

    Audit.countDocuments({
      ...tenantFilter,

      plannedDate: {
        $gte: analyticsStartDate,

        $lte: analyticsEndDate,
      },

      status: "COMPLETED",
    }),

    // Documents total

    Document.countDocuments({
      ...tenantFilter,

      createdAt: {
        $gte: analyticsStartDate,

        $lte: analyticsEndDate,
      },
    }),

    // Documents approved

    Document.countDocuments({
      ...tenantFilter,

      createdAt: {
        $gte: analyticsStartDate,

        $lte: analyticsEndDate,
      },

      status: "APPROVED",
    }),
  ]);

  // ========================================================
  // CLOSURE / COMPLETION RATES
  // ========================================================

  const ncrClosureRate =
    rangeNcrTotal > 0 ? Math.round((rangeNcrClosed / rangeNcrTotal) * 100) : 0;

  const capaClosureRate =
    rangeCapaTotal > 0
      ? Math.round((rangeCapaClosed / rangeCapaTotal) * 100)
      : 0;

  const auditCompletionRate =
    rangeAudits > 0
      ? Math.round((rangeCompletedAudits / rangeAudits) * 100)
      : 0;

  const documentApprovalRate =
    rangeDocuments > 0
      ? Math.round((rangeApprovedDocuments / rangeDocuments) * 100)
      : 0;

  // ========================================================
  // NCR CATEGORY
  // ========================================================
  //
  // Distribution of currently open NCRs.
  //
  // IMPORTANT:
  // - Organization scoped.
  // - Selected date range scoped.
  // - CLOSED and CANCELLED excluded.
  // ========================================================

  const ncrCategoryTrend = await NCR.aggregate([
    {
      $match: {
        ...tenantFilter,

        createdAt: {
          $gte: analyticsStartDate,

          $lte: analyticsEndDate,
        },

        status: {
          $nin: ["CLOSED", "CANCELLED"],
        },
      },
    },

    {
      $group: {
        _id: {
          $ifNull: ["$category", "Uncategorized"],
        },

        value: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        value: -1,
      },
    },

    {
      $limit: 6,
    },
  ]);

  const ncrCategoryData = ncrCategoryTrend.map((item) => ({
    name: formatDisplayLabel(item._id) || "Uncategorized",

    value: numberValue(item.value),
  }));

  // ========================================================
  // CAPA STATUS
  // ========================================================
  //
  // Distribution of CAPA records.
  //
  // Organization scoped.
  // Selected date range scoped.
  //
  // Status is formatted only for presentation.
  // ========================================================

  const capaStatusTrend = await CAPA.aggregate([
    {
      $match: {
        ...tenantFilter,

        createdAt: {
          $gte: analyticsStartDate,

          $lte: analyticsEndDate,
        },
      },
    },

    {
      $group: {
        _id: {
          $ifNull: ["$status", "UNKNOWN"],
        },

        value: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        value: -1,
      },
    },
  ]);

  const capaStatusData = capaStatusTrend.map((item) => ({
    name: formatDisplayLabel(normalizeStatus(item._id)) || "Unknown",

    value: numberValue(item.value),
  }));

  // ========================================================
  // COMPLIANCE
  // ========================================================

  const complianceScore = calculateComplianceScore({
    openCapa,

    openNcr,

    overdueActions,
  });

  // ========================================================
  // AUDIT READINESS
  // ========================================================

  const auditReadiness = calculateAuditReadiness({
    overdueActions,

    openCapa,

    openNcr,

    controlledDocuments,
  });

  // ========================================================
  // UPCOMING AUDITS
  // ========================================================

  const upcomingAudits = hasCurrentWeekInSelectedRange
    ? await Audit.find({
        ...tenantFilter,

        plannedDate: {
          $gte: selectedWeekStart,

          $lte: selectedWeekEnd,
        },

        status: {
          $nin: ["COMPLETED", "CANCELLED"],
        },
      })
        .sort({
          plannedDate: 1,
        })
        .limit(10)
        .populate("leadAuditor", "firstName lastName email")
        .lean()
    : [];

  // ========================================================
  // RECENT ACTIVITY
  // ========================================================

  const recentActivityRows = await AuditLog.find({
    ...tenantFilter,

    createdAt: {
      $gte: analyticsStartDate,

      $lte: analyticsEndDate,
    },
  })
    .sort({
      createdAt: -1,
    })
    .limit(15)
    .populate("userId", "firstName lastName email role")
    .lean();

  const recentActivities = recentActivityRows.map((item) => {
    const module = String(item.module || "").toUpperCase();

    const userName =
      item.userName ||
      [item.userId?.firstName, item.userId?.lastName]
        .filter(Boolean)
        .join(" ") ||
      item.userEmail ||
      "System";

    const action = String(item.action || "UPDATED")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const moduleLabel =
      module === "NCR"
        ? "NCR"
        : module === "CAPA"
          ? "CAPA"
          : module === "DOCUMENT" || module === "DOCUMENTS"
            ? "Document"
            : module === "AUDIT" || module === "AUDITS"
              ? "Audit"
              : module || "QMS";

    return {
      _id: item._id,

      module,

      title: `${moduleLabel} ${action}`,

      description:
        item.description ||
        `${userName} performed ${action.toLowerCase()} on ${moduleLabel}.`,

      time: item.createdAt,

      createdAt: item.createdAt,

      userName,

      action,
    };
  });

  // ========================================================
  // ACTION ITEMS
  // ========================================================

  const actionItems = [];

  // ========================================================
  // OVERDUE NCR
  // ========================================================

  if (overdueNcr > 0) {
    actionItems.push({
      _id: "overdue-ncr",

      type: "NCR",

      module: "NCR",

      title: `${overdueNcr} overdue NCR${overdueNcr === 1 ? "" : "s"}`,

      description: "Non-conformances have passed their due date.",

      priority: "High",

      count: overdueNcr,

      href: "/ncr",
    });
  }

  // ========================================================
  // OVERDUE CAPA
  // ========================================================

  if (overdueCapa > 0) {
    actionItems.push({
      _id: "overdue-capa",

      type: "CAPA",

      module: "CAPA",

      title: `${overdueCapa} overdue CAPA${overdueCapa === 1 ? "" : "s"}`,

      description: "Corrective or preventive actions require attention.",

      priority: "High",

      count: overdueCapa,

      href: "/capa",
    });
  }

  // ========================================================
  // DOCUMENT ACTION ITEMS
  // ========================================================
  //
  // IMPORTANT:
  //
  // Documents are actual dashboard records.
  //
  // We do NOT require createdAt AND reviewDate to both be
  // inside the selected analytics range.
  //
  // A document can be old but still require attention today.
  //
  // The selected date range is used for the review deadline
  // when possible, but current document action items are not
  // artificially removed simply because the document was
  // created before the selected range.
  //
  // ========================================================

  const documentReviewItems = await Document.find({
    ...tenantFilter,

    status: {
      $nin: ["OBSOLETE"],
    },

    $or: [
      // Documents with a review date up to the end of
      // the selected dashboard period.

      {
        reviewDate: {
          $lte: analyticsEndDate,
        },
      },

      // Documents without a review date should still be
      // available for dashboard attention.

      {
        reviewDate: null,
      },

      {
        reviewDate: {
          $exists: false,
        },
      },
    ],
  })
    .sort({
      reviewDate: 1,

      createdAt: -1,
    })
    .limit(10)
    .lean();

  // ========================================================
  // DOCUMENT REVIEW ACTIONS
  // ========================================================

  for (const document of documentReviewItems) {
    const documentId = document?._id;

    if (!documentId) {
      continue;
    }

    const reviewDate = document.reviewDate
      ? new Date(document.reviewDate)
      : null;

    const hasValidReviewDate =
      reviewDate && !Number.isNaN(reviewDate.getTime());

    const isOverdue = hasValidReviewDate && reviewDate < now;

    const documentName =
      document.title ||
      document.name ||
      document.documentName ||
      document.fileName ||
      "Document";

    // ------------------------------------------------------
    // ACTUAL DOCUMENT RECORD
    // ------------------------------------------------------

    actionItems.push({
      // IMPORTANT:
      // Actual document ID.
      _id: String(documentId),

      // Explicit record ID for frontend routing.
      recordId: String(documentId),

      type: "DOCUMENT",

      module: "DOCUMENTS",

      title: documentName,

      description: isOverdue
        ? `${documentName} requires review.`
        : hasValidReviewDate
          ? `${documentName} is due for review.`
          : `${documentName} requires attention.`,

      priority: isOverdue ? "High" : "Medium",

      status: document.status || null,

      reviewDate: document.reviewDate || null,

      createdAt: document.createdAt || null,

      // Direct document route.
      href: `/documents/${documentId}`,

      count: 1,
    });
  }

  // ========================================================
  // AUDIT ACTIONS
  // ========================================================

  if (auditsDueThisWeek > 0 && hasCurrentWeekInSelectedRange) {
    actionItems.push({
      _id: "audits-due",

      type: "AUDIT",

      module: "AUDITS",

      title: `${auditsDueThisWeek} audit${
        auditsDueThisWeek === 1 ? "" : "s"
      } due this week`,

      description: "Upcoming audits require preparation.",

      priority: "Medium",

      count: auditsDueThisWeek,

      href: "/audits",
    });
  }

  // ========================================================
  // ACTION ITEM SORT
  // ========================================================

  const priorityRank = {
    High: 1,

    Medium: 2,

    Low: 3,
  };

  actionItems.sort(
    (a, b) =>
      (priorityRank[a.priority] || 99) - (priorityRank[b.priority] || 99),
  );

  const limitedActionItems = actionItems.slice(0, 10);

  // ========================================================
  // PERFORMANCE DATA
  // ========================================================

  const performanceData = trendData.map((item) => {
    const total = numberValue(item.ncrOpened);

    const closed = numberValue(item.ncrClosed);

    const compliance =
      total > 0 ? Math.min(Math.round((closed / total) * 100), 100) : 0;

    return {
      month: item.month,

      compliance,
    };
  });

  // ========================================================
  // KPI DATA
  // ========================================================

  const stats = [
    {
      title: "Open NCR",

      value: openNcr,

      change: `${ncrClosureRate}% closure`,

      trend: ncrClosureRate >= 75 ? "up" : "warning",

      description: "Current open non-conformances",
    },

    {
      title: "Open CAPA",

      value: openCapa,

      change: `${capaClosureRate}% closure`,

      trend: capaClosureRate >= 75 ? "up" : "warning",

      description: "Current corrective actions",
    },

    {
      title: "Audits Due",

      value: auditsDue,

      change: `${auditsDueThisWeek} this week`,

      trend: auditsDue === 0 ? "up" : "warning",

      description: "Upcoming audits requiring attention",
    },

    {
      title: "Controlled Documents",

      value: controlledDocuments,

      change: `${documentApprovalRate}% approved`,

      trend: documentApprovalRate >= 90 ? "up" : "warning",

      description: "Currently approved documents",
    },
  ];

  // ========================================================
  // ANALYTICS
  // ========================================================

  const analytics = {
    range: {
      startDate: analyticsStartDate,

      endDate: analyticsEndDate,
    },

    ncr: {
      total: rangeNcrTotal,

      closed: rangeNcrClosed,

      closureRate: ncrClosureRate,
    },

    capa: {
      total: rangeCapaTotal,

      closed: rangeCapaClosed,

      closureRate: capaClosureRate,
    },

    audits: {
      total: rangeAudits,

      completed: rangeCompletedAudits,

      completionRate: auditCompletionRate,
    },

    documents: {
      total: rangeDocuments,

      approved: rangeApprovedDocuments,

      approvalRate: documentApprovalRate,
    },

    overdue: {
      total: overdueActions,

      capa: overdueCapa,

      ncr: overdueNcr,

      documents: overdueDocuments,
    },
  };

  // ========================================================
  // RETURN
  // ========================================================

  return {
    // ======================================================
    // KPI
    // ======================================================

    kpis: {
      openCapa,

      openNcr,

      auditsDue,

      auditsDueThisWeek,

      controlledDocuments,
    },

    // ======================================================
    // SIDEBAR
    // ======================================================

    sidebarCounts: {
      capa: openCapa,

      ncr: openNcr,

      audits: auditsDueThisWeek,
    },

    // ======================================================
    // TREND
    // ======================================================

    trend: trendData,

    trendData,

    // ======================================================
    // ACTIVITY
    // ======================================================

    recentActivities,

    // ======================================================
    // UPCOMING AUDITS
    // ======================================================

    upcomingAudits,

    // ======================================================
    // COMPLIANCE
    // ======================================================

    compliance: {
      score: complianceScore,

      target: 90,
    },

    // ======================================================
    // OVERDUE
    // ======================================================

    overdue: {
      count: overdueActions,

      capa: overdueCapa,

      ncr: overdueNcr,

      documents: overdueDocuments,
    },

    // ======================================================
    // AUDIT READINESS
    // ======================================================

    auditReadiness,

    // ======================================================
    // UI DATA
    // ======================================================

    stats,

    performanceData,

    ncrCategoryData,

    capaStatusData,

    actionItems: limitedActionItems,

    // ======================================================
    // ANALYTICS
    // ======================================================

    analytics,

    // ======================================================
    // DATE RANGE
    // ======================================================

    dateRange: {
      startDate: analyticsStartDate,

      endDate: analyticsEndDate,
    },
  };
};
