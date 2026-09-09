import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('versions', {
  node:     () => process.versions.node,
  electron: () => process.versions.electron,
})

contextBridge.exposeInMainWorld('saveAPI', {
  read:   (slot: number)               => ipcRenderer.invoke('save:read',   slot),
  write:  (slot: number, data: unknown) => ipcRenderer.invoke('save:write',  slot, data),
  delete: (slot: number)               => ipcRenderer.invoke('save:delete', slot),
})
