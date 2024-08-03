export interface ImportConfig {
  name: string
  candidateNodeFilter: string
  disusedStopFilter?: string
  stopTags: { [key: string]: string }
}

export async function fetchImportConfig(url: string): Promise<ImportConfig> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch import config: ${response.statusText}`)
  }

  const config = await response.text()

  let parsedConfig
  try {
    parsedConfig = JSON.parse(config)
  } catch (e) {
    console.log("Failed to parse JSON config, trying YAML")
  }

  if (!parsedConfig) {
    const { parse } = await import("yaml")
    parsedConfig = parse(config)
  }

  return validateImportConfig(parsedConfig)
}

export function validateImportConfig(config: any): ImportConfig {
  if (!config.name || typeof config.name !== 'string') {
    throw new Error("name must be a string")
  }

  if (!config.candidateNodeFilter || typeof config.candidateNodeFilter !== 'string') {
    throw new Error("candidateNodeFilter must be a string")
  }

  if (config.disusedStopFilter && typeof config.disusedStopFilter !== 'string') {
    throw new Error("disusedStopFilter must be a string")
  }

  if (!config.stopTags || typeof config.stopTags !== 'object') {
    throw new Error("stopTags must be an object")
  }

  return config
}
