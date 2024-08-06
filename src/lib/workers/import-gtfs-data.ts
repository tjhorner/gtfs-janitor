import { importToRepository } from "$lib/gtfs/parser"
import GTFSRepository from "$lib/repository/gtfs"

export interface ImportGTFSDataRequest {
  gtfsBlob: Blob
}

addEventListener("message", async (event: MessageEvent<ImportGTFSDataRequest>) => {
  const { gtfsBlob } = event.data
  const repository = new GTFSRepository()
  await importToRepository(repository, gtfsBlob, () => {
    postMessage(null)
  })
  console.log("we did it reddit")
})