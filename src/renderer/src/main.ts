import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PhysicsScene } from './scenes/PhysicsScene'
import { SelectionScene } from './scenes/SelectionScene'
import { DataLoader } from './systems/DataLoader'

DataLoader.init()

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#000000',
  scene: [BootScene, SelectionScene, PhysicsScene]
}

new Phaser.Game(config)
