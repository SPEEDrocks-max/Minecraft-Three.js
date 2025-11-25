import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { Blocks } from './Blocks'
import { WorldChunk } from './WorldChunk';
import { World } from './World';

export function createUI(world , player) {
    const gui = new GUI()
    
    const playerFolder = gui.addFolder('Player');
    playerFolder.add(player , 'maxSpeed' , 1 , 20)


    gui.add(world.ChunkSize, 'width', 8, 128, 1).name('World Width').onChange( () => {
        world.clear()
        world.generate()
    })

    gui.add(world.ChunkSize, 'height', 8, 64, 1).name('World Height').onChange( () => {
        world.clear()
        world.generate()
    }) 
   gui.add(world, 'drawdistance', 0, 10, 1).name('Draw Distance').onChange( () => {
        world.clear()
        world.generate()
   } )
   const TerrainFolder = gui.addFolder('Terrain Parameters')
   TerrainFolder.add(world.params.terrain, 'scale', 1, 100, 1).name('Noise Scale').onChange( () => {
        world.clear()
        world.generate()
   })       
    TerrainFolder.add(world.params.terrain, 'magnitude', 1, 10, 0.1).name('Height Magnitude').onChange( () => {
        world.clear()
        world.generate()
   }
    )   
    TerrainFolder.add(world.params.terrain, 'offset', -1, 1, 0.01).name('Height Offset').onChange( () => {
        world.clear()
        world.generate()
   } )

   
    TerrainFolder.open()

const resourcesfolder = gui.addFolder('Resource Parameters')
resourcesfolder.add(Blocks.stone, 'scarcity', 0 ,1 ).name('Stone Scarcity').onChange( () => {
    world.clear()
    world.generate()})

    const scaleFolder = resourcesfolder.addFolder('Stone Scale')
    scaleFolder.add(Blocks.stone.scale, 'x', 1, 100, 1).name('Scale X').onChange( () => {
        world.clear()
        world.generate()})

        scaleFolder.add(Blocks.stone.scale, 'y', 1, 100, 1).name('Scale Y').onChange( () => {   
            world.clear()
            world.generate()}
            )

        scaleFolder.add(Blocks.stone.scale, 'z', 1, 100, 1).name('Scale Z').onChange( () => {
            world.clear()
            world.generate()})


    resourcesfolder.open()

    const IronFolder = gui.addFolder('Iron Ore Parameters')
    IronFolder.add(Blocks.IronOre, 'scarcity', 0 ,1 ).name('Iron Scarcity').onChange( () => {
        world.clear()
        world.generate()})

    const IronScaleFolder = IronFolder.addFolder('Iron Scale')
    IronScaleFolder.add(Blocks.IronOre.scale, 'x', 1, 100, 1).name('Scale X').onChange( () => {
        world.clear()
        world.generate()})


        IronScaleFolder.add(Blocks.IronOre.scale, 'y', 1, 100, 1).name('Scale Y').onChange( () => {
            world.clear()
            world.generate()}
            )
        IronScaleFolder.add(Blocks.IronOre.scale, 'z', 1, 100, 1).name('Scale Z').onChange( () => {
            world.clear()
            world.generate()}
            )
    IronFolder.open()

    const CoalFolder = gui.addFolder('Coal Ore Parameters')
    CoalFolder.add(Blocks.coalOre, 'scarcity', 0 ,1 ).name('Coal Scarcity').onChange( () => {
        world.clear()
        world.generate()})

    const CoalScaleFolder = CoalFolder.addFolder('Coal Scale')
        
    CoalScaleFolder.add(Blocks.coalOre.scale, 'x', 1, 100, 1).name('Scale X').onChange( () => {
        world.clear()
        world.generate()}
        )
        CoalScaleFolder.add(Blocks.coalOre.scale, 'y', 1, 100, 1).name('Scale Y').onChange( () => {
            world.clear()
            world.generate()}
            )
        CoalScaleFolder.add(Blocks.coalOre.scale, 'z', 1, 100, 1).name('Scale Z').onChange( () => {
            world.clear()
            world.generate()}
            )
    CoalFolder.open()

  const treefolder = gui.addFolder('Tree Parameters')
  treefolder.add(world.params.trees, 'frequency', 0.01 ,0.5 ).name('Tree Frequency').onChange( () => {
      world.clear()
      world.generate()})

      const cloudfolder = gui.addFolder('Cloud')
      cloudfolder.add( world.params.clouds , 'density' , 0.0 , 1.0 ).name('Cloud Density').onChange( () => {
      world.clear()
      world.generate()})



    
    return gui
    
    

}