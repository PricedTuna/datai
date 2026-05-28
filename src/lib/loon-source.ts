import { loon as loonNpm, getSpec as getSpecNpm } from "loon-core";
import npmPkg from "loon-core/package.json";
// Local build (../LOON/dist). No bundled types — treat as the same shape.
// @ts-expect-error - local build has no type declarations wired up here
import { loon as loonLocal, getSpec as getSpecLocal } from "@loon-local";
// @ts-expect-error - JSON import from outside src (aliased in vite.config.ts)
import localPkg from "@loon-local-pkg";

export type LoonSource = "npm" | "local";

type LoonApi = {
  loon: typeof loonNpm;
  getSpec: typeof getSpecNpm;
};

const sources: Record<LoonSource, LoonApi> = {
  npm: { loon: loonNpm, getSpec: getSpecNpm },
  local: { loon: loonLocal as typeof loonNpm, getSpec: getSpecLocal as typeof getSpecNpm },
};

export function getLoon(source: LoonSource): LoonApi {
  return sources[source];
}

export const LOON_VERSIONS: Record<LoonSource, string> = {
  npm: (npmPkg as { version: string }).version,
  local: (localPkg as { version: string }).version,
};

export function getLoonVersion(source: LoonSource): string {
  return LOON_VERSIONS[source];
}
