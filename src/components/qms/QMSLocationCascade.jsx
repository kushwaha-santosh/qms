"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocations, getLocation } from "@/lib/api/location.api.js";

const LEVELS = [
  { type: "COUNTRY", label: "Country" },
  { type: "STATE", label: "State" },
  { type: "DISTRICT", label: "District" },
  { type: "CITY", label: "City" },
  { type: "PINCODE", label: "Pincode" },
];

const listFromResponse = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(response?.locations)) return response.locations;
  if (Array.isArray(data?.locations)) return data.locations;
  return [];
};

const idOf = (item) => String(item?._id || item?.id || item?.locationId || "");
const labelOf = (item) =>
  item?.name || item?.locationName || item?.displayName || item?.code || item?.pincode || "Unnamed";

export default function QMSLocationCascade({
  name = "location",
  label = "Location",
  value = "",
  onChange,
  organizationId = "",
  required = false,
  disabled = false,
  className = "",
}) {
  const [selected, setSelected] = useState({
    COUNTRY: "",
    STATE: "",
    DISTRICT: "",
    CITY: "",
    PINCODE: "",
  });
  const [options, setOptions] = useState({
    COUNTRY: [],
    STATE: [],
    DISTRICT: [],
    CITY: [],
    PINCODE: [],
  });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState("");

  const currentLevel = useMemo(() => {
    for (let i = LEVELS.length - 1; i >= 0; i -= 1) {
      if (selected[LEVELS[i].type]) return i;
    }
    return -1;
  }, [selected]);

  const loadLevel = async (type, parentId = "") => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    setError("");
    try {
      const response = await getLocations({
        type,
        parentId,
        isActive: true,
        page: 1,
        limit: 100,
      });
      const list = listFromResponse(response);
      setOptions((prev) => ({ ...prev, [type]: list }));
    } catch (err) {
      setOptions((prev) => ({ ...prev, [type]: [] }));
      setError(err?.response?.data?.message || err?.message || `Unable to load ${type.toLowerCase()} options.`);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  useEffect(() => {
    if (!disabled) loadLevel("COUNTRY");
  }, [organizationId, disabled]);

  useEffect(() => {
    if (!value) {
      setSelected({ COUNTRY: "", STATE: "", DISTRICT: "", CITY: "", PINCODE: "" });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const chain = [];
        let currentId = String(value);
        for (let i = 0; i < LEVELS.length && currentId; i += 1) {
          const response = await getLocation(currentId);
          const item = response?.data || response?.location || response;
          if (!item) break;
          chain.push(item);
          currentId = String(item?.parentId?._id || item?.parentId || "");
        }

        if (cancelled) return;
        const next = { COUNTRY: "", STATE: "", DISTRICT: "", CITY: "", PINCODE: "" };
        chain.forEach((item) => {
          const type = String(item?.type || "").toUpperCase();
          if (next[type] !== undefined) next[type] = idOf(item);
        });
        setSelected(next);

        const country = next.COUNTRY;
        if (country) await loadLevel("STATE", country);
        const state = next.STATE;
        if (state) await loadLevel("DISTRICT", state);
        const district = next.DISTRICT;
        if (district) await loadLevel("CITY", district);
        const city = next.CITY;
        if (city) await loadLevel("PINCODE", city);
      } catch {
        if (!cancelled) {
          setSelected((prev) => ({ ...prev, CITY: String(value) }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [value, organizationId]);

  const selectLevel = async (type, id) => {
    const index = LEVELS.findIndex((item) => item.type === type);
    const next = { ...selected };
    LEVELS.forEach((item, itemIndex) => {
      if (itemIndex >= index) next[item.type] = itemIndex === index ? id : "";
    });
    setSelected(next);
    setError("");

    onChange?.({
      target: { name, value: id || "" },
    });

    if (!id || index >= LEVELS.length - 1) return;

    const child = LEVELS[index + 1].type;
    await loadLevel(child, id);
  };

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {LEVELS.map(({ type, label: levelLabel }, index) => {
          const parentType = LEVELS[index - 1]?.type;
          const parentSelected = parentType ? selected[parentType] : "";
          const isDisabled = disabled || (index > 0 && !parentSelected);
          const items = options[type] || [];

          return (
            <div key={type} className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-slate-600">{levelLabel}</label>
              <select
              value={selected[type] || ""}
              onChange={(event) => selectLevel(type, event.target.value)}
              disabled={isDisabled || loading[type]}
              className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
            >
              <option value="">
                {loading[type] ? `Loading ${levelLabel}...` : `Select ${levelLabel}`}
              </option>
                {items.map((item) => {
                  const id = idOf(item);
                  if (!id) return null;
                  return (
                    <option key={id} value={id}>
                      {labelOf(item)}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })}
      </div>

      {currentLevel >= 0 && currentLevel < LEVELS.length - 1 && (
        <p className="mt-1 text-xs text-slate-500">
          Select the next level to narrow the location.
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
