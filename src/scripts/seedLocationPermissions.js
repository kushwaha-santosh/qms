import "dotenv/config";

import { connectDB } from "../lib/db/mongoose.js";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";

const LOCATION_PERMISSIONS = [
  {
    key: "LOCATION_VIEW",
    name: "View Locations",
    description: "Allows the user to view location master data.",
    module: "LOCATION",
    action: "VIEW",
  },
  {
    key: "LOCATION_CREATE",
    name: "Create Locations",
    description: "Allows the user to create location master data.",
    module: "LOCATION",
    action: "CREATE",
  },
  {
    key: "LOCATION_UPDATE",
    name: "Update Locations",
    description: "Allows the user to update location master data.",
    module: "LOCATION",
    action: "UPDATE",
  },
  {
    key: "LOCATION_DELETE",
    name: "Delete Locations",
    description: "Allows the user to delete location master data.",
    module: "LOCATION",
    action: "DELETE",
  },
  {
    key: "LOCATION_STATUS_UPDATE",
    name: "Update Location Status",
    description:
      "Allows the user to activate or deactivate location master data.",
    module: "LOCATION",
    action: "STATUS_UPDATE",
  },
];

const run = async () => {
  await connectDB();

  const permissionIds = [];

  for (const item of LOCATION_PERMISSIONS) {
    const permission = await Permission.findOneAndUpdate(
      { key: item.key },
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

  const superAdminRole = await Role.findOne({
    name: "SUPER_ADMIN",
    scope: "SYSTEM",
    organizationId: null,
  });

  if (superAdminRole) {
    await Role.updateOne(
      { _id: superAdminRole._id },
      {
        $addToSet: {
          permissions: {
            $each: permissionIds,
          },
        },
      },
    );

    console.log("LOCATION permissions attached to SUPER_ADMIN.");
  }

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
    `LOCATION permissions attached to ${result.modifiedCount} ORG_ADMIN role(s).`,
  );

  console.log("Location permission seed completed.");
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Location permission seed failed:", error);
    process.exit(1);
  });
