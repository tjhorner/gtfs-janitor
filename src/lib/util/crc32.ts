import memoize from "memoize"

// CRC implementation from: https://stackoverflow.com/a/18639999

let crcTableCache: number[] = [ ]

const makeCRCTable = () => {
  let crcTable = [ ]
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    crcTable[n] = c
  }
  return crcTable
}

export const crc32 = memoize((str: string) => {
  if (!crcTableCache.length) {
    crcTableCache = makeCRCTable()
  }

  let crc = 0 ^ (-1)
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTableCache[(crc ^ str.charCodeAt(i)) & 0xFF]
  }

  return (crc ^ (-1)) >>> 0
})
