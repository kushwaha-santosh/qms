// ==========================================================
// SEO / PAGE METADATA HELPERS
// ==========================================================
//
// Page metadata is managed in MongoDB.
//
// IMPORTANT:
// This file does NOT import:
//   @/config/pageMetadata.js
//
// Database metadata is loaded through:
//   pageMetadata.service.js
//
// ==========================================================

export const SITE_NAME = "QMS AI";

export const DEFAULT_DESCRIPTION =
  "Quality Management System for managing quality, compliance, audits, NCR, CAPA, documents and organizational activities.";

export const DEFAULT_KEYWORDS =
  "QMS, Quality Management System, quality management, compliance";

// ==========================================================
// DEFAULT NEXT.JS METADATA
// ==========================================================
//
// Used only when:
// - database metadata does not exist
// - database cannot be reached
// - page metadata is missing
//
// ==========================================================

export const getDefaultPageMetadata = () => {
  return {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    robots: {
      index: true,
      follow: true,
    },
  };
};

// ==========================================================
// CREATE DATABASE-DRIVEN NEXT.JS METADATA
// ==========================================================
//
// Use this from a Server Component:
//
// export async function generateMetadata() {
//   return createDynamicPageMetadata("/dashboard");
// }
//
// ==========================================================

export const createDynamicPageMetadata = async (path) => {
  try {
    const { connectDB } = await import("@/lib/db/mongoose.js");

    const { getEffectivePageMetadata } =
      await import("@/services/pageMetadata/pageMetadata.service.js");

    await connectDB();

    const page = await getEffectivePageMetadata(path);

    if (!page || page.isActive === false) {
      return getDefaultPageMetadata();
    }

    return {
      title: page.title || SITE_NAME,

      description: page.description || DEFAULT_DESCRIPTION,

      keywords: page.keywords || DEFAULT_KEYWORDS,

      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error(`Unable to load dynamic page metadata for "${path}":`, error);

    return getDefaultPageMetadata();
  }
};
