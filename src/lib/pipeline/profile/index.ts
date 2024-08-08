import { type } from "arktype"

const importProfile = type({
  name: "string",
  candidateNodeFilter: "string",
  "disusedStopFilter?": "string",
  stopTags: { "[string]": "string" }
})

export type ImportProfile = typeof importProfile.tValidatedOut

export async function parseProfile(content: string): Promise<ImportProfile> {
  let parsedConfig
  try {
    parsedConfig = JSON.parse(content)
  } catch (e) {
    console.log("Failed to parse JSON config, trying YAML")
  }

  try {
    if (!parsedConfig) {
      const { parse } = await import("yaml")
      parsedConfig = parse(content)
    }
  } catch(e: any) {
    throw new Error(`Failed to parse profile as either YAML or JSON: ${e.message}`)
  }

  return validateImportProfile(parsedConfig)
}

export async function fetchImportProfile(url: string): Promise<ImportProfile> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch import profile: ${response.statusText}`)
  }

  const config = await response.text()
  return parseProfile(config)
}

export function validateImportProfile(config: any): ImportProfile {
  const profile = importProfile(config)
  if (profile instanceof type.errors) {
    throw new Error(`The provided profile was invalid. Errors:\n\n${profile.summary}`)
  }

  return profile
}
