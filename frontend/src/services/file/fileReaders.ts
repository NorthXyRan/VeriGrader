import { Message } from '@/components/Message'
import { ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'

export { validateDataRelationships, validateJsonData, validateUploadFile } from './fileValidation'

interface WritableFileHandle {
  write: (content: string) => Promise<void>
  close: () => Promise<void>
}

interface FileHandle {
  createWritable: () => Promise<WritableFileHandle>
}

interface DirectoryHandle {
  getFileHandle: (name: string, options: { create: true }) => Promise<FileHandle>
}

type PickerWindow = Window & {
  showDirectoryPicker?: (options: { mode: 'readwrite' }) => Promise<DirectoryHandle>
}

function getDirectoryPicker(): PickerWindow['showDirectoryPicker'] {
  const pickerWindow: PickerWindow = window
  return pickerWindow.showDirectoryPicker
}

export async function readFileContent(file: File): Promise<string> {
  const fileName = file.name.toLowerCase()
  if (fileName.endsWith('.txt') || fileName.endsWith('.json')) return file.text()
  if (fileName.endsWith('.docx')) {
    const { default: mammoth } = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value
  }
  throw new Error('Unsupported file format')
}

async function chooseSaveDirectory(): Promise<DirectoryHandle> {
  const picker = getDirectoryPicker()
  if (!picker) throw new Error('This browser does not support directory selection')

  try {
    return await picker({ mode: 'readwrite' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Directory selection was cancelled')
    }
    throw new Error(error instanceof Error ? error.message : 'Directory selection failed')
  }
}

export async function askToSaveJsonResult(
  result: unknown,
  originalFileName: string,
  type: 'paper' | 'answer',
): Promise<void> {
  if (isJsonFile(originalFileName) || !getDirectoryPicker()) return

  try {
    await ElMessageBox.confirm(
      `The ${type === 'paper' ? 'paper' : 'reference answer'} was parsed successfully. Save the JSON result?`,
      'Save parsed result',
      {
        confirmButtonText: 'Save',
        cancelButtonText: 'Skip',
        type: 'info',
      },
    )
    await saveJsonResult(result, originalFileName)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      Message.warning(error instanceof Error ? error.message : 'Could not save the parsed result')
    }
  }
}

async function saveJsonResult(result: unknown, originalFileName: string): Promise<void> {
  const directory = await chooseSaveDirectory()
  const fileName = `${originalFileName.replace(/\.[^/.]+$/, '')}.json`
  const file = await directory.getFileHandle(fileName, { create: true })
  const writable = await file.createWritable()
  await writable.write(JSON.stringify(result, null, 2))
  await writable.close()
  Message.success(`Parsed result saved as ${fileName}`)
}

export function isJsonFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.json')
}
