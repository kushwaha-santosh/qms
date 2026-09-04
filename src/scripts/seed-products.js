import "dotenv/config";

import { connectDB } from "../lib/db/mongoose.js";

import Product from "../models/Product.js";
import Organization from "../models/Organization.js";

const SYSTEM_PRODUCTS = [
  {
    code: "PROD-DEMO-001",
    name: "Demo Product",
    category: "GENERAL",
    description: "Initial product master record for system verification.",
  },
];

const run = async () => {
  await connectDB();

  /*
   * ==========================================================
   * ORGANIZATIONS
   * ==========================================================
   *
   * Product data is organization-specific.
   *
   * Therefore this seed does not blindly create products
   * against an arbitrary organization.
   */

  const organizations = await Organization.find({
    status: "ACTIVE",
  })
    .select("_id name organizationName")
    .lean();

  if (!organizations.length) {
    console.log("No active organizations found.");

    console.log("Product seed completed without inserting data.");

    return;
  }

  /*
   * ==========================================================
   * SEED PRODUCTS
   * ==========================================================
   *
   * Creates the bootstrap product for each active
   * organization.
   */

  for (const organization of organizations) {
    for (const item of SYSTEM_PRODUCTS) {
      const existing = await Product.findOne({
        organizationId: organization._id,
        code: item.code,
      });

      if (existing) {
        console.log(
          `Product already exists: ${item.code} - ${
            organization.name ||
            organization.organizationName ||
            organization._id
          }`,
        );

        continue;
      }

      await Product.create({
        organizationId: organization._id,
        code: item.code,
        name: item.name,
        category: item.category,
        description: item.description,
        isActive: true,
      });

      console.log(
        `Product created: ${item.code} - ${
          organization.name || organization.organizationName || organization._id
        }`,
      );
    }
  }

  console.log("Product seed completed.");
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Product seed failed:", error);

    process.exit(1);
  });
