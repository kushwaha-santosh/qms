import "dotenv/config";

import { connectDB } from "../lib/db/mongoose.js";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";

const PRODUCT_PERMISSIONS = [
  {
    key: "PRODUCT_VIEW",
    name: "View Products",
    description: "Allows the user to view product master data.",
    module: "PRODUCT",
    action: "VIEW",
  },
  {
    key: "PRODUCT_CREATE",
    name: "Create Products",
    description: "Allows the user to create product master data.",
    module: "PRODUCT",
    action: "CREATE",
  },
  {
    key: "PRODUCT_UPDATE",
    name: "Update Products",
    description: "Allows the user to update product master data.",
    module: "PRODUCT",
    action: "UPDATE",
  },
  {
    key: "PRODUCT_DELETE",
    name: "Delete Products",
    description: "Allows the user to delete product master data.",
    module: "PRODUCT",
    action: "DELETE",
  },
  {
    key: "PRODUCT_STATUS_UPDATE",
    name: "Update Product Status",
    description:
      "Allows the user to activate or deactivate product master data.",
    module: "PRODUCT",
    action: "STATUS_UPDATE",
  },
];

const run = async () => {
  await connectDB();

  const permissionIds = [];

  for (const item of PRODUCT_PERMISSIONS) {
    const permission = await Permission.findOneAndUpdate(
      {
        key: item.key,
      },
      {
        $set: {
          ...item,
          isActive: true,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    permissionIds.push(permission._id);

    console.log(`Permission ready: ${item.key}`);
  }

  /*
   * ========================================================
   * SUPER ADMIN
   * ========================================================
   */

  const superAdminRole = await Role.findOne({
    name: "SUPER_ADMIN",
    scope: "SYSTEM",
    organizationId: null,
  });

  if (superAdminRole) {
    await Role.updateOne(
      {
        _id: superAdminRole._id,
      },
      {
        $addToSet: {
          permissions: {
            $each: permissionIds,
          },
        },
      },
    );

    console.log("PRODUCT permissions attached to SUPER_ADMIN.");
  }

  /*
   * ========================================================
   * ORG ADMIN
   * ========================================================
   */

  const result = await Role.updateMany(
    {
      name: "ORG_ADMIN",
      scope: "ORGANIZATION",
    },
    {
      $addToSet: {
        permissions: {
          $each: permissionIds,
        },
      },
    },
  );

  console.log(
    `PRODUCT permissions attached to ${result.modifiedCount} ORG_ADMIN role(s).`,
  );

  console.log("Product permission seed completed.");
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Product permission seed failed:", error);

    process.exit(1);
  });
