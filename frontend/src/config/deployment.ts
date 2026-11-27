export const isPagesDemo = import.meta.env.MODE === 'pages'

export function workspaceStorageKey(key: string): string {
  return isPagesDemo ? `verigrader:demo:v3:${key}` : key
}
