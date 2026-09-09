import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs'

const savesDir = (): string => join(app.getPath('userData'), 'saves')
const slotPath = (n: number): string => join(savesDir(), `slot_${n}.json`)

function ensureSavesDir(): void {
  if (!existsSync(savesDir())) mkdirSync(savesDir(), { recursive: true })
}

ipcMain.handle('save:read', (_e, slot: number) => {
  ensureSavesDir()
  const p = slotPath(slot)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf-8')) } catch { return null }
})

ipcMain.handle('save:write', (_e, slot: number, data: unknown) => {
  ensureSavesDir()
  writeFileSync(slotPath(slot), JSON.stringify(data, null, 2), 'utf-8')
})

ipcMain.handle('save:delete', (_e, slot: number) => {
  const p = slotPath(slot)
  if (existsSync(p)) unlinkSync(p)
})

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Project Neon Fleet',
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setMenuBarVisibility(false)

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
