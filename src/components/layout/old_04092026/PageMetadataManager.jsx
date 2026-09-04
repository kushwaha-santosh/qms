"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { getEffectivePageMetadata } from "@/lib/api/pageMetadata.api";

// ==========================================================
// DEFAULT QMS METADATA
// ==========================================================

const DEFAULT_METADATA = {
  title: "QMS Admin Dashboard",

  description:
    "QMS Admin Dashboard for managing quality processes, non-conformances, CAPA, audits, documents, training and other quality management activities.",

  keywords:
    "QMS, Quality Management System, Quality Management, NCR, CAPA, Audits, Documents, Training, Quality Dashboard",
};

// ==========================================================
// PAGE METADATA MANAGER
// ==========================================================

export default function PageMetadataManager() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async () => {
      if (!pathname) {
        return;
      }

      // ======================================================
      // ALWAYS APPLY DEFAULT METADATA FIRST
      // ======================================================

      document.title = DEFAULT_METADATA.title;

      // ------------------------------------------------------
      // DESCRIPTION
      // ------------------------------------------------------

      let descriptionElement = document.querySelector(
        'meta[name="description"]',
      );

      if (!descriptionElement) {
        descriptionElement = document.createElement("meta");

        descriptionElement.setAttribute("name", "description");

        document.head.appendChild(descriptionElement);
      }

      descriptionElement.setAttribute("content", DEFAULT_METADATA.description);

      // ------------------------------------------------------
      // KEYWORDS
      // ------------------------------------------------------

      let keywordsElement = document.querySelector('meta[name="keywords"]');

      if (!keywordsElement) {
        keywordsElement = document.createElement("meta");

        keywordsElement.setAttribute("name", "keywords");

        document.head.appendChild(keywordsElement);
      }

      keywordsElement.setAttribute("content", DEFAULT_METADATA.keywords);

      // ======================================================
      // LOAD BACKEND METADATA
      // ======================================================

      try {
        const response = await getEffectivePageMetadata(pathname);

        if (cancelled) {
          return;
        }

        const metadata = response?.data?.pageMetadata;

        // ====================================================
        // NO BACKEND METADATA
        // ====================================================
        // Keep the default metadata already applied above.

        if (!metadata) {
          return;
        }

        // ======================================================
        // TITLE
        // ======================================================

        if (typeof metadata.title === "string" && metadata.title.trim()) {
          document.title = metadata.title.trim();
        }

        // ======================================================
        // DESCRIPTION
        // ======================================================

        if (
          typeof metadata.description === "string" &&
          metadata.description.trim()
        ) {
          descriptionElement.setAttribute(
            "content",
            metadata.description.trim(),
          );
        }

        // ======================================================
        // KEYWORDS
        // ======================================================

        if (typeof metadata.keywords === "string" && metadata.keywords.trim()) {
          keywordsElement.setAttribute("content", metadata.keywords.trim());
        }
      } catch (error) {
        // ======================================================
        // API ERROR
        // ======================================================
        // Defaults are already applied, so the application
        // still has valid metadata.

        console.error(`Unable to load page metadata for "${pathname}":`, error);
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
