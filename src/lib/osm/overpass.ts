export interface OverpassResponse {
  version: number
  generator: string
  elements: OverpassElement[]
}

export interface BaseElement {
  type: ElementType
  id: number
  changeset: number
  tags: { [key: string]: string | undefined }
  version: number
}

export interface Node extends BaseElement {
  type: "node"
  lat: number
  lon: number
}

export interface Way extends BaseElement {
  type: "way"
  nodes: number[]
}

export interface Relation extends BaseElement {
  type: "relation"
  members: RelationMember[]
}

export type OverpassElement = Node | Way | Relation

export interface RelationMember {
  type: ElementType
  ref: number
  role: string
}

export type ElementType = "node" | "way" | "relation"

export const isNode = (element: OverpassElement) => element.type === "node"
export const isWay = (element: OverpassElement) => element.type === "way"
export const isRelation = (element: OverpassElement) => element.type === "relation"

export async function queryOverpass(query: string) {
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `data=${encodeURIComponent(query.trim())}`
  })

  if (!response.ok) {
    throw new Error(`Failed to query Overpass API: ${response.statusText}`)
  }

  return response.json() as Promise<OverpassResponse>
}
