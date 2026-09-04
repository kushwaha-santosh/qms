/**
 * ============================================================
 * QMS - INDIA LOCATION MASTER SEED
 * ============================================================
 *
 * File:
 *   scripts/seed-india-locations.js
 *
 * Purpose:
 *   Seed India location master data using the hierarchy:
 *
 *     Country
 *        └── State
 *              └── District
 *                    └── City
 *                          └── Pincode
 *
 * IMPORTANT:
 *   - This script is for database/bootstrap administration.
 *   - RBAC is enforced by the Location API/service layer.
 *   - Audit logging is handled by application CRUD operations.
 *   - This script does NOT create users, roles or permissions.
 *   - This script is idempotent and can safely be executed again.
 *
 * ============================================================
 */
import "dotenv/config";

import mongoose from "mongoose";

import { connectDB } from "../lib/db/mongoose.js";

import Location from "../models/Location.js";

/*
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const COUNTRY_CODE = "IN";

const COUNTRY_NAME = "India";

/*
 * System seed marker.
 *
 * Keep this value stable.
 * It allows the seed to identify records created by this script.
 */
const SEED_SOURCE = "INDIA_LOCATION_SEED";

/*
 * Default values used for system master records.
 */
const DEFAULT_VALUES = {
  isSystem: true,
  isActive: true,
};

/*
 * ============================================================
 * INDIA LOCATION DATA
 * ============================================================
 *
 * IMPORTANT:
 *
 * The production database should preferably be populated from
 * an authoritative India location dataset rather than manually
 * maintaining thousands of records inside this source file.
 *
 * The structure below is intentionally hierarchical:
 *
 * State
 *   District
 *      City
 *         Pincode[]
 *
 * Add/replace the DATA object with your approved complete
 * India location dataset.
 *
 * ============================================================
 */

const INDIA_LOCATIONS = {
  "Uttar Pradesh": {
    code: "UP",

    districts: {
      Ghazipur: {
        code: "GZP",

        cities: {
          Ghazipur: {
            code: "GHAZIPUR",

            pincodes: ["233001", "233002", "233003", "233227"],
          },

          Zamania: {
            code: "ZAMANIA",

            pincodes: ["232329"],
          },

          Mohammadabad: {
            code: "MOHAMMADABAD",

            pincodes: ["233227"],
          },
        },
      },

      Mirzapur: {
        code: "MZP",

        cities: {
          Mirzapur: {
            code: "MIRZAPUR",

            pincodes: ["231001", "231002", "231003"],
          },

          Vindhyachal: {
            code: "VINDHYACHAL",

            pincodes: ["231307"],
          },
        },
      },

      Varanasi: {
        code: "VNS",

        cities: {
          Varanasi: {
            code: "VARANASI",

            pincodes: [
              "221001",
              "221002",
              "221003",
              "221004",
              "221005",
              "221006",
              "221007",
              "221008",
              "221010",
              "221011",
            ],
          },
        },
      },

      Lucknow: {
        code: "LKO",

        cities: {
          Lucknow: {
            code: "LUCKNOW",

            pincodes: [
              "226001",
              "226002",
              "226003",
              "226004",
              "226005",
              "226006",
              "226007",
              "226008",
              "226009",
              "226010",
            ],
          },
        },
      },
    },
  },
};

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

const normalizeName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_-]/g, "");

const normalizePincode = (value) =>
  String(value || "")
    .trim()
    .replace(/\D/g, "");

const assertRequired = (value, label) => {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
};

/*
 * ============================================================
 * VALIDATION
 * ============================================================
 */

const validateDataset = () => {
  assertRequired(COUNTRY_CODE, "Country code");
  assertRequired(COUNTRY_NAME, "Country name");

  if (
    !INDIA_LOCATIONS ||
    typeof INDIA_LOCATIONS !== "object" ||
    Array.isArray(INDIA_LOCATIONS)
  ) {
    throw new Error("INDIA_LOCATIONS must be an object.");
  }

  for (const [stateName, state] of Object.entries(INDIA_LOCATIONS)) {
    assertRequired(stateName, "State name");
    assertRequired(state?.code, `State code for ${stateName}`);

    if (
      !state?.districts ||
      typeof state.districts !== "object" ||
      Array.isArray(state.districts)
    ) {
      throw new Error(`District data is missing for state "${stateName}".`);
    }

    for (const [districtName, district] of Object.entries(state.districts)) {
      assertRequired(districtName, `District name in state ${stateName}`);

      assertRequired(district?.code, `District code for ${districtName}`);

      if (
        !district?.cities ||
        typeof district.cities !== "object" ||
        Array.isArray(district.cities)
      ) {
        throw new Error(`City data is missing for district "${districtName}".`);
      }

      for (const [cityName, city] of Object.entries(district.cities)) {
        assertRequired(cityName, `City name in district ${districtName}`);

        assertRequired(city?.code, `City code for ${cityName}`);

        if (!Array.isArray(city?.pincodes)) {
          throw new Error(`Pincode list is missing for city "${cityName}".`);
        }

        for (const rawPincode of city.pincodes) {
          const pincode = normalizePincode(rawPincode);

          if (!/^\d{6}$/.test(pincode)) {
            throw new Error(
              `Invalid pincode "${rawPincode}" for city "${cityName}".`,
            );
          }
        }
      }
    }
  }
};

/*
 * ============================================================
 * FIND / CREATE LOCATION
 * ============================================================
 *
 * This function intentionally supports multiple possible
 * Location model field layouts.
 *
 * Preferred production schema:
 *
 * {
 *   type,
 *   name,
 *   code,
 *   countryId,
 *   stateId,
 *   districtId,
 *   cityId,
 *   pincode,
 *   isSystem,
 *   isActive,
 *   metadata
 * }
 *
 * ============================================================
 */

const upsertLocation = async ({
  type,
  name,
  code,
  parentId = null,
  pincode = null,
}) => {
  const normalizedName = normalizeName(name);
  const normalizedCode = normalizeCode(code);

  const filter = {
    type,
    code: normalizedCode,
  };

  /*
   * Parent is part of the identity for every level except
   * country.
   */
  if (type === "COUNTRY") {
    filter.parentId = null;
  } else {
    filter.parentId = parentId;
  }

  if (type === "PINCODE") {
    filter.pincode = pincode;
  }

  const update = {
    $set: {
      name: normalizedName,
      code: normalizedCode,

      type,

      parentId,

      isSystem: DEFAULT_VALUES.isSystem,
      isActive: DEFAULT_VALUES.isActive,

      "metadata.seedSource": SEED_SOURCE,
      "metadata.countryCode": COUNTRY_CODE,
    },

    $setOnInsert: {
      createdAt: new Date(),
    },
  };

  if (type === "PINCODE") {
    update.$set.pincode = pincode;
  }

  const result = await Location.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  });

  return result;
};

/*
 * ============================================================
 * SEED COUNTRY
 * ============================================================
 */

const seedCountry = async () => {
  console.log("🌍 Seeding country...");

  const country = await upsertLocation({
    type: "COUNTRY",
    name: COUNTRY_NAME,
    code: COUNTRY_CODE,
    parentId: null,
  });

  console.log(`   ✓ ${country.name}`);

  return country;
};

/*
 * ============================================================
 * SEED STATES
 * ============================================================
 */

const seedStates = async (country) => {
  let count = 0;

  for (const [stateName, stateData] of Object.entries(INDIA_LOCATIONS)) {
    const state = await upsertLocation({
      type: "STATE",
      name: stateName,
      code: stateData.code,
      parentId: country._id,
    });

    count += 1;

    console.log(`   ✓ State: ${state.name}`);
  }

  return count;
};

/*
 * ============================================================
 * SEED DISTRICTS
 * ============================================================
 */

const seedDistricts = async (country) => {
  let count = 0;

  for (const [stateName, stateData] of Object.entries(INDIA_LOCATIONS)) {
    const state = await Location.findOne({
      type: "STATE",
      code: normalizeCode(stateData.code),
      parentId: country._id,
    });

    if (!state) {
      throw new Error(`State "${stateName}" was not found after seeding.`);
    }

    for (const [districtName, districtData] of Object.entries(
      stateData.districts,
    )) {
      const district = await upsertLocation({
        type: "DISTRICT",
        name: districtName,
        code: districtData.code,
        parentId: state._id,
      });

      count += 1;

      console.log(`      ✓ District: ${stateName} → ${district.name}`);
    }
  }

  return count;
};

/*
 * ============================================================
 * SEED CITIES
 * ============================================================
 */

const seedCities = async (country) => {
  let count = 0;

  for (const [stateName, stateData] of Object.entries(INDIA_LOCATIONS)) {
    const state = await Location.findOne({
      type: "STATE",
      code: normalizeCode(stateData.code),
      parentId: country._id,
    });

    if (!state) {
      throw new Error(`State "${stateName}" was not found.`);
    }

    for (const [districtName, districtData] of Object.entries(
      stateData.districts,
    )) {
      const district = await Location.findOne({
        type: "DISTRICT",
        code: normalizeCode(districtData.code),
        parentId: state._id,
      });

      if (!district) {
        throw new Error(`District "${districtName}" was not found.`);
      }

      for (const [cityName, cityData] of Object.entries(districtData.cities)) {
        const city = await upsertLocation({
          type: "CITY",
          name: cityName,
          code: cityData.code,
          parentId: district._id,
        });

        count += 1;

        console.log(`         ✓ City: ${districtName} → ${city.name}`);
      }
    }
  }

  return count;
};

/*
 * ============================================================
 * SEED PINCODES
 * ============================================================
 */

const seedPincodes = async (country) => {
  let count = 0;

  for (const [stateName, stateData] of Object.entries(INDIA_LOCATIONS)) {
    const state = await Location.findOne({
      type: "STATE",
      code: normalizeCode(stateData.code),
      parentId: country._id,
    });

    if (!state) {
      throw new Error(`State "${stateName}" was not found.`);
    }

    for (const [districtName, districtData] of Object.entries(
      stateData.districts,
    )) {
      const district = await Location.findOne({
        type: "DISTRICT",
        code: normalizeCode(districtData.code),
        parentId: state._id,
      });

      if (!district) {
        throw new Error(`District "${districtName}" was not found.`);
      }

      for (const [cityName, cityData] of Object.entries(districtData.cities)) {
        const city = await Location.findOne({
          type: "CITY",
          code: normalizeCode(cityData.code),
          parentId: district._id,
        });

        if (!city) {
          throw new Error(`City "${cityName}" was not found.`);
        }

        for (const rawPincode of cityData.pincodes) {
          const pincode = normalizePincode(rawPincode);

          await upsertLocation({
            type: "PINCODE",
            name: pincode,
            code: pincode,
            parentId: city._id,
            pincode,
          });

          count += 1;
        }

        console.log(
          `            ✓ Pincodes: ${cityName} (${cityData.pincodes.length})`,
        );
      }
    }
  }

  return count;
};

/*
 * ============================================================
 * CREATE INDEXES
 * ============================================================
 *
 * These indexes are safe to request from the application.
 *
 * If your Location schema already defines these indexes,
 * Mongoose will handle them appropriately.
 * ============================================================
 */

const ensureIndexes = async () => {
  try {
    await Location.collection.createIndex(
      {
        type: 1,
        parentId: 1,
        code: 1,
      },
      {
        unique: true,
        name: "location_type_parent_code_unique",
      },
    );
  } catch (error) {
    /*
     * If an existing database has incompatible duplicate
     * records, do not silently ignore the problem.
     */
    if (error?.code === 11000) {
      console.warn(
        "⚠ Existing duplicate location records detected. Index creation skipped.",
      );
      return;
    }

    throw error;
  }

  try {
    await Location.collection.createIndex(
      {
        type: 1,
        parentId: 1,
        name: 1,
      },
      {
        name: "location_type_parent_name",
      },
    );
  } catch (error) {
    console.warn("⚠ Unable to create location name index:", error.message);
  }

  try {
    await Location.collection.createIndex(
      {
        type: 1,
        pincode: 1,
      },
      {
        name: "location_type_pincode",
      },
    );
  } catch (error) {
    console.warn("⚠ Unable to create pincode index:", error.message);
  }
};

/*
 * ============================================================
 * STATISTICS
 * ============================================================
 */

const getStatistics = async () => {
  const result = await Location.aggregate([
    {
      $group: {
        _id: "$type",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  return result;
};

/*
 * ============================================================
 * MAIN
 * ============================================================
 */

const seedIndiaLocations = async () => {
  console.log("");
  console.log("============================================================");
  console.log(" QMS - INDIA LOCATION MASTER SEED");
  console.log("============================================================");
  console.log("");
  console.log("Hierarchy: Country → State → District → City → Pincode");
  console.log("");

  /*
   * Validate before touching database.
   */
  validateDataset();

  /*
   * Connect database.
   */
  await connectDB();

  console.log("✓ Database connected.");
  console.log("");

  /*
   * Ensure indexes.
   */
  await ensureIndexes();

  console.log("✓ Location indexes verified.");
  console.log("");

  /*
   * Country.
   */
  const country = await seedCountry();

  console.log("");

  /*
   * States.
   */
  const stateCount = await seedStates(country);

  console.log("");

  /*
   * Districts.
   */
  const districtCount = await seedDistricts(country);

  console.log("");

  /*
   * Cities.
   */
  const cityCount = await seedCities(country);

  console.log("");

  /*
   * Pincodes.
   */
  const pincodeCount = await seedPincodes(country);

  console.log("");
  console.log("============================================================");
  console.log(" SEED COMPLETED");
  console.log("============================================================");
  console.log("");

  console.log(`Country   : 1`);
  console.log(`States    : ${stateCount}`);
  console.log(`Districts : ${districtCount}`);
  console.log(`Cities    : ${cityCount}`);
  console.log(`Pincodes  : ${pincodeCount}`);

  console.log("");

  /*
   * Database statistics.
   */
  const statistics = await getStatistics();

  console.log("Database totals:");

  for (const item of statistics) {
    console.log(`  ${item._id}: ${item.count}`);
  }

  console.log("");

  console.log("✓ India location master seed finished successfully.");
};

/*
 * ============================================================
 * PROCESS HANDLING
 * ============================================================
 */

const shutdown = async (exitCode = 0) => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error("Error while closing database connection:", error);

    exitCode = 1;
  }

  process.exit(exitCode);
};

seedIndiaLocations()
  .then(async () => {
    await shutdown(0);
  })
  .catch(async (error) => {
    console.error("");
    console.error(
      "============================================================",
    );
    console.error(" INDIA LOCATION SEED FAILED");
    console.error(
      "============================================================",
    );
    console.error("");

    console.error(error);

    console.error("");

    await shutdown(1);
  });
