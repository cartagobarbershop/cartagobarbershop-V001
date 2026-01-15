import { dataSchema, DATA_VERSION } from "../core/schemas";
import type { Data } from "../core/types";

export const validateData = (input: unknown): Data | null => {
  try {
    const parsed = dataSchema.parse(input);
    if (parsed.version !== DATA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
};
