import GTFSRepository from "$lib/repository/gtfs"
import { readable } from "svelte/store"

export const gtfsRepository = readable(new GTFSRepository())
