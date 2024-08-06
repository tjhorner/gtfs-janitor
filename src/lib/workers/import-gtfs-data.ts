import { importToRepository } from "$lib/gtfs/parser"
import GTFSRepository from "$lib/repository/gtfs"

export interface ImportGTFSDataRequest {
  gtfsBlob: Blob
}

const repository = new GTFSRepository()

addEventListener("message", async (event: MessageEvent<ImportGTFSDataRequest>) => {
  const { gtfsBlob } = event.data
  await importToRepository(repository, gtfsBlob)
  postMessage(null)
})