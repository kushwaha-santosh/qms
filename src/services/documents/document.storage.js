import fs from "fs/promises";
import path from "path";

/*
 * ==========================================================
 * DOCUMENT STORAGE CONFIGURATION
 * ==========================================================
 *
 * .env.local
 *
 * QMS_DOCUMENTS_DIR=public/QMS/documents
 *
 * This can later be changed to an absolute path, for example:
 *
 * QMS_DOCUMENTS_DIR=D:\QMSData\documents
 *
 * Or a NAS path:
 *
 * QMS_DOCUMENTS_DIR=\\NAS-SERVER\QMS\documents
 *
 * The application automatically creates:
 *
 *   <root>/<year>/<month>/<documentNumber>/<documentNumber>.<ext>
 *
 * Example:
 *
 *   public/QMS/documents/
 *       2026/
 *           09/
 *               DOC-001/
 *                   DOC-001.pdf
 *
 * ==========================================================
 */

const DEFAULT_DOCUMENTS_DIR = path.join(
  process.cwd(),
  "public",
  "QMS",
  "documents",
);

const configuredDocumentsDir = String(
  process.env.QMS_DOCUMENTS_DIR || "",
).trim();

const DOCUMENTS_DIR = configuredDocumentsDir
  ? path.isAbsolute(configuredDocumentsDir)
    ? path.resolve(configuredDocumentsDir)
    : path.resolve(process.cwd(), configuredDocumentsDir)
  : DEFAULT_DOCUMENTS_DIR;

/*
 * ==========================================================
 * FILE VALIDATION
 * ==========================================================
 */

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "text/plain",

  "text/csv",

  "image/jpeg",

  "image/png",

  "image/webp",
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024;

/*
 * ==========================================================
 * PUBLIC STORAGE DIRECTORY
 * ==========================================================
 */

export const getDocumentsStorageDirectory = () => {
  return DOCUMENTS_DIR;
};

/*
 * ==========================================================
 * SANITIZE DOCUMENT NUMBER
 * ==========================================================
 *
 * Document number becomes both:
 *
 *   1. Folder name
 *   2. Physical file name
 *
 * Example:
 *
 *   DOC-001
 *
 * becomes:
 *
 *   DOC-001/
 *       DOC-001.pdf
 *
 * Windows-invalid characters are replaced.
 */

const sanitizeDocumentNumber = (documentNumber = "") => {
  const value = String(documentNumber || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\.+$/g, "");

  return value || "DOCUMENT";
};

/*
 * ==========================================================
 * SANITIZE ORIGINAL FILE NAME
 * ==========================================================
 *
 * We do NOT use the original filename as the physical filename.
 *
 * The physical filename is always:
 *
 *   DOCUMENT-NUMBER + extension
 *
 * Example:
 *
 *   uploaded file = quality-manual-final-version.pdf
 *
 *   documentNumber = DOC-001
 *
 *   physical file = DOC-001.pdf
 */

const sanitizeOriginalName = (name = "document") => {
  return path.basename(String(name)).replace(/[^a-zA-Z0-9._-]/g, "_");
};

/*
 * ==========================================================
 * GET FILE EXTENSION
 * ==========================================================
 *
 * The extension comes from the uploaded file.
 *
 * Example:
 *
 *   quality-manual.pdf -> .pdf
 *   manual.docx        -> .docx
 *   image.jpg          -> .jpg
 */

const getFileExtension = (fileName = "") => {
  const safeName = sanitizeOriginalName(fileName);

  const extension = path.extname(safeName).toLowerCase();

  return extension;
};

/*
 * ==========================================================
 * BUILD DOCUMENT STORAGE LOCATION
 * ==========================================================
 *
 * This is the important part of the new storage strategy.
 *
 * The folder is automatically based on the CURRENT date.
 *
 * Example on September 4, 2026:
 *
 *   year  = 2026
 *   month = 09
 *
 * Result:
 *
 *   public/QMS/documents/2026/09/DOC-001/
 *
 * Physical file:
 *
 *   public/QMS/documents/2026/09/DOC-001/DOC-001.pdf
 *
 * When the year/month changes, the path automatically changes.
 */

export const buildDocumentStorageLocation = ({
  documentNumber,
  fileName,
  date = new Date(),
} = {}) => {
  if (!documentNumber) {
    throw Object.assign(
      new Error("Document number is required for file storage."),
      {
        statusCode: 400,
      },
    );
  }

  const safeDocumentNumber = sanitizeDocumentNumber(documentNumber);

  const extension = getFileExtension(fileName);

  if (!extension) {
    throw Object.assign(
      new Error("Uploaded document file extension is missing."),
      {
        statusCode: 400,
      },
    );
  }

  const year = String(date.getFullYear());

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const documentDirectory = path.join(
    DOCUMENTS_DIR,
    year,
    month,
    safeDocumentNumber,
  );

  const physicalFileName = `${safeDocumentNumber}${extension}`;

  const fileAbsolutePath = path.join(documentDirectory, physicalFileName);

  /*
   * Relative storage key.
   *
   * This is useful because it does not expose the
   * server's absolute filesystem path.
   *
   * Example:
   *
   * 2026/09/DOC-001/DOC-001.pdf
   */

  const fileStorageKey = [
    year,
    month,
    safeDocumentNumber,
    physicalFileName,
  ].join("/");

  return {
    year,
    month,
    documentNumber: safeDocumentNumber,
    extension,
    fileName: physicalFileName,
    documentDirectory,
    fileAbsolutePath,
    fileStorageKey,
  };
};

/*
 * ==========================================================
 * SAVE UPLOADED DOCUMENT
 * ==========================================================
 *
 * IMPORTANT:
 *
 * This function now requires documentNumber.
 *
 * The caller should pass:
 *
 *   saveUploadedDocument(file, documentNumber)
 *
 * ==========================================================
 */

export async function saveUploadedDocument(file, documentNumber) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw Object.assign(new Error("A document file is required."), {
      statusCode: 400,
    });
  }

  if (!file.size || file.size > MAX_FILE_SIZE) {
    throw Object.assign(
      new Error(
        "Document file size must be greater than 0 and not exceed 20 MB.",
      ),
      {
        statusCode: 400,
      },
    );
  }

  const mimeType = String(
    file.type || "application/octet-stream",
  ).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw Object.assign(new Error("This document file type is not allowed."), {
      statusCode: 400,
    });
  }

  /*
   * Determine storage location from:
   *
   * CURRENT YEAR
   * CURRENT MONTH
   * DOCUMENT NUMBER
   * FILE EXTENSION
   */

  const location = buildDocumentStorageLocation({
    documentNumber,
    fileName: file.name,
    date: new Date(),
  });

  /*
   * Create:
   *
   * year/month/documentNumber
   *
   * automatically.
   */

  await fs.mkdir(location.documentDirectory, {
    recursive: true,
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  /*
   * "wx" prevents accidental overwriting.
   *
   * If DOC-001.pdf already exists in the current
   * year/month folder, we do NOT silently overwrite it.
   */

  try {
    await fs.writeFile(location.fileAbsolutePath, buffer, {
      flag: "wx",
    });
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw Object.assign(
        new Error(
          `A file already exists for document ${location.documentNumber} in ${location.year}/${location.month}.`,
        ),
        {
          statusCode: 409,
        },
      );
    }

    throw error;
  }

  return {
    fileName: location.fileName,

    fileStorageKey: location.fileStorageKey,

    fileAbsolutePath: location.fileAbsolutePath,

    fileSize: file.size,

    mimeType,

    year: location.year,

    month: location.month,

    documentDirectory: location.documentDirectory,
  };
}

/*
 * ==========================================================
 * DELETE STORED DOCUMENT
 * ==========================================================
 *
 * This remains protected so a malicious/incorrect path
 * cannot delete a file outside the configured QMS document
 * storage directory.
 * ==========================================================
 */

export async function deleteStoredDocument(fileAbsolutePath) {
  if (!fileAbsolutePath) {
    return;
  }

  const resolved = path.resolve(fileAbsolutePath);

  const root = path.resolve(DOCUMENTS_DIR);

  /*
   * Prevent directory traversal / deletion outside
   * the configured document storage directory.
   */

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    console.warn("Refusing to delete file outside document storage:", resolved);

    return;
  }

  try {
    await fs.unlink(resolved);
  } catch (error) {
    /*
     * If the file has already been deleted,
     * there is nothing more to do.
     */

    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  /*
   * Remove empty parent folders.
   *
   * Example:
   *
   *   DOC-001/
   *
   * If it becomes empty after deleting the file,
   * remove the folder.
   *
   * Then remove the month folder if empty.
   *
   * Then remove the year folder if empty.
   *
   * Errors are intentionally ignored because the file
   * deletion itself has already completed successfully.
   */

  try {
    let currentDirectory = path.dirname(resolved);

    while (
      currentDirectory !== root &&
      currentDirectory.startsWith(`${root}${path.sep}`)
    ) {
      try {
        await fs.rmdir(currentDirectory);

        currentDirectory = path.dirname(currentDirectory);
      } catch {
        /*
         * Directory is not empty or cannot be removed.
         * Stop cleanup.
         */
        break;
      }
    }
  } catch {
    // Folder cleanup is best-effort.
  }
}

/*
 * ==========================================================
 * READ STORED DOCUMENT
 * ==========================================================
 */

export async function readStoredDocument(fileAbsolutePath) {
  if (!fileAbsolutePath) {
    throw Object.assign(new Error("Document storage path is missing."), {
      statusCode: 404,
    });
  }

  const resolved = path.resolve(fileAbsolutePath);

  const root = path.resolve(DOCUMENTS_DIR);

  /*
   * Prevent reading files outside QMS document storage.
   */

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw Object.assign(new Error("Invalid document storage path."), {
      statusCode: 403,
    });
  }

  try {
    return await fs.readFile(resolved);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw Object.assign(new Error("Stored document file was not found."), {
        statusCode: 404,
      });
    }

    throw error;
  }
}
