import { DATA_VERSION } from "../core/schemas";
import type { Data } from "../core/types";
import { validateData } from "../utils/validation";

const STORAGE_KEY = "barber-shop-data";

export const initData = (fallback: () => Data): Data => fallback();

export const loadData = (fallback: () => Data): Data => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback();
    const json = JSON.parse(raw);
    const valid = validateData(json);
    return valid || fallback();
  } catch {
    return fallback();
  }
};

export const saveData = (snapshot: Data) => {
  const next = { ...snapshot, version: DATA_VERSION };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};
