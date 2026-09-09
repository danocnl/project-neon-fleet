import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PhysicsScene } from './scenes/PhysicsScene'
import { SelectionScene } from './scenes/SelectionScene'
import { DraftScene } from './scenes/DraftScene'
import { BenchmarkScene } from './scenes/BenchmarkScene'
import { ArmoryScene } from './scenes/ArmoryScene'
import { DataLoader } from './systems/DataLoader'

DataLoader.init()

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
  scene: [BootScene, SelectionScene, PhysicsScene, DraftScene, BenchmarkScene, ArmoryScene]
}

new Phaser.Game(config)
