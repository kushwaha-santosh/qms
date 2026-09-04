import "dotenv/config";

import { connectDB } from "../lib/db/mongoose.js";

import PageMetadata from "../models/PageMetadata.js";

import { PAGE_METADATA } from "../config/pageMetadata.js";

// ==========================================================
// SEED PAGE METADATA
// ==========================================================

const seedPageMetadata = async () => {
  try {
    await connectDB();

    console.log("Connected to MongoDB.");

    let created = 0;
    let updated = 0;

    for (const metadata of PAGE_METADATA) {
      const existing = await PageMetadata.findOne({
        key: metadata.key,
      });

      if (existing) {
        await PageMetadata.findByIdAndUpdate(
          existing._id,
          {
            $set: {
              path: metadata.path,
              title: metadata.title,
              description: metadata.description || "",
              keywords: metadata.keywords || "",
            },
          },
          {
            new: true,
            runValidators: true,
          },
        );

        updated++;

        console.log(`Updated: ${metadata.key}`);
      } else {
        await PageMetadata.create({
          ...metadata,
          isActive: true,
        });

        created++;

        console.log(`Created: ${metadata.key}`);
      }
    }

    console.log("");
    console.log("========================================");
    console.log("Page metadata seed completed.");
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("Page metadata seed failed:", error);

    process.exit(1);
  }
};

seedPageMetadata();
