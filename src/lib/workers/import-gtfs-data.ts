import { importToRepository } from "$lib/gtfs/parser"
import GTFSRepository from "$lib/repository/gtfs"

export interface ImportGTFSDataRequest {
  gtfsBlob: Blob
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
  const { gtfsBlob } = event.data
  await importToRepository(repository, gtfsBlob, (msg) => sendResponse({ type: "progress", message: msg }))

  sendResponse({
    type: "complete"
  })
})