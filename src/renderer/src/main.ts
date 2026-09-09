import Phaser from 'phaser'
import { SaveSlotScene } from './scenes/SaveSlotScene'
import { BootScene } from './scenes/BootScene'
import { LobbyScene } from './scenes/LobbyScene'
import { PhysicsScene } from './scenes/PhysicsScene'
import { SelectionScene } from './scenes/SelectionScene'
import { DraftScene } from './scenes/DraftScene'
import { BenchmarkScene } from './scenes/BenchmarkScene'
import { ArmoryScene } from './scenes/ArmoryScene'
import { DataLoader } from './systems/DataLoader'
import { SaveManager } from './systems/SaveManager'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game',
    width: 1280,
    height: 720,
  },
  scene: [SaveSlotScene, BootScene, LobbyScene, SelectionScene, PhysicsScene, DraftScene, BenchmarkScene, ArmoryScene],
}

async function bootstrap(): Promise<void> {
  DataLoader.init()
  await SaveManager.init()   // load all slot data into cache before Phaser starts
  new Phaser.Game(config)
}

bootstrap()
