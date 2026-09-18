function cleanBuildValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  return cleaned || undefined;
}

const buildNumber = cleanBuildValue(import.meta.env.VITE_BUILD_NUMBER);
const buildSha = cleanBuildValue(import.meta.env.VITE_BUILD_SHA)?.slice(0, 7);

export const BUILD_LABEL = buildNumber
  ? `Build ${buildNumber}${buildSha ? ` · ${buildSha}` : ''}`
  : `Build local · ${import.meta.env.DEV ? 'development' : 'production'}`;
