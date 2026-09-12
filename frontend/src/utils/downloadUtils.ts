function download(content: BlobPart, filename: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadJSON(data: unknown, filename = 'data.json'): void {
  download(JSON.stringify(data, null, 2), filename, 'application/json')
}
