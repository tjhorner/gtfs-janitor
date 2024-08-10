import { importToRepository } from "$lib/gtfs/parser"
import type { ImportProfile } from "$lib/pipeline/profile"
import GTFSRepository from "$lib/repository/gtfs"

export interface ImportGTFSDataRequest {
  gtfsBlob: Blob
  overrides: ImportProfile["gtfsOverrides"]
}

export type ImportGTFSDataResponse = {
  type: "progress",
  message: string
} | {
  type: "complete"
}

const repository = new GTFSRepository()

const sendResponse = (response: ImportGTFSDataResponse) => postMessage(response)

addEventListener("message", async (event: MessageEvent<ImportGTFSDataRequest>) => {
  const { gtfsBlob, overrides } = event.data
  await importToRepository(repository, overrides, gtfsBlob, (msg) => sendResponse({ type: "progress", message: msg }))

  sendResponse({
    type: "complete"
  })
})