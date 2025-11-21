import * as THREE from 'three';

import { createNoise2D, createNoise3D } from 'simplex-noise';
import { Blocks , resource } from './Blocks';
import { World } from './World';
const geometry = new THREE.BoxGeometry();
 
export class WorldChunk extends THREE.Group {

  asyncLoading = true;

    /**
 *  @type {{
 * id: number,
 * instanceID: number,}
 * [][][]}
 */

    data = [];
    


    constructor(size , params) {
     
        super();
         this.loaded = false;
        this.size =  size;
        this.params = params;
    }

  generate() {
     const start = performance.now();
    this.InitialiseTerrain();
    this.generateResources()
   this.generateTerrain();
    this.generateMeshes();

    this.loaded = true;
  }
   InitialiseTerrain() {
        this.data = [];
        for (let x = 0; x < this.size.width; x++) {   
          const slice  = []                     

            for(let y = 0; y < this.size.height; y++) {
          const row = []  
                for (let z = 0; z < this.size.width; z++) {
                      row.push({
                    id: Blocks.empty.id,
                    instanceId: null,
                });
                }
                slice.push(row);
            }
            this.data.push(slice);
        }

    }

    generateResources() {
        const simple = createNoise3D();
        resource.forEach(Resource => {
        for(let x = 0 ; x <this.size.width ; x++ ){
          for(let y = 0 ; y <this.size.height ; y++ ){
            for(let z = 0 ; z <this.size.width ; z++ ){
              const value = simple( x/Resource.scale.x, y/Resource.scale.y , z/Resource.scale.z);
              if(value>Resource.scarcity){
                this.setBlockID(x,y,z, Resource.id);
              }
            }
          }
        }
    })
  }

    generateTerrain() {
      

        const simplex = createNoise2D();
        console.log('Starting terrain generation...');

        // Fixed seed for reproducibility
        
        for(let x = 0; x < this.size.width; x++) {      
            for(let z = 0; z < this.size.width; z++) {
                const value = simplex(
                    (x + this.position.x) / this.params.terrain.scale,
                    (z + this.position.z) / this.params.terrain.scale
                );
                
                const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value;
                let height = Math.floor(this.size.height * scaledNoise);
                height = Math.max(0, Math.min(height, this.size.height - 1));

                // Only fill up to the height value
                for(let y = 0; y < this.size.height; y++) {
                    if(y == height){
                 this.setBlockID(x, y, z, Blocks.grass.id);
                } else if (y < height && this.getBlock(x, y, z).id === Blocks.empty.id){
                    this.setBlockID(x, y, z, Blocks.dirt.id);
                } else if (y > height && this.getBlock(x, y, z).id !== Blocks.empty.id){
                    this.setBlockID(x, y, z, Blocks.empty.id);
                }
            }
                if (x === 0 && z === 0) {
                    console.log(`Debug: Height at (0,0): ${height}, from noise=${value}, scaled=${scaledNoise}`);
                }
            }
        }
        console.log('Terrain generation complete.');
    }
    generateMeshes() {

      this.clear();



    const maxCount = this.size.width * this.size.width * this.size.height;

    // Creating a lookup table where the key is the block id
    const meshes = {};
    Object.values(Blocks)
      .filter(blockType => blockType.id !== Blocks.empty.id)
      .forEach(blockType => {
        const mesh = new THREE.InstancedMesh(geometry, blockType.material, maxCount);
        mesh.name = blockType.id;
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes[blockType.id] = mesh;
      });

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;

          if (blockId === Blocks.empty.id) continue;

          const mesh = meshes[blockId];
          const instanceId = mesh.count;

          if (!this.isBlockObsecured(x, y, z)) {
            matrix.setPosition(x , y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
            mesh.instanceMatrix.needsUpdate = true;
          }
        }
      }
    }

    // Log instance counts per block type
    Object.entries(meshes).forEach(([blockId, mesh]) => {
        console.log(`Block type ${Blocks[blockId]?.name || blockId}: ${mesh.count} instances`);
    });
    
    this.add(...Object.values(meshes));
    }

    /**
   * Gets the block data at (x, y, z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {{id: number, instanceId: number}}
   */

    getBlock(x, y, z) {
        if(this.inBounds(x,y,z)){
  return this.data[x][y][z]
        }
else return null;
    }
/**
 * @param {number} x 
 * @param {number} y  
 *  @param {number} z
 * @param {number} blockID
 */

addBlock(x, y, z, blockID){
  if(this.getBlock(x,y,z).id === Blocks.empty.id){
     this.setBlockID(x, y, z, blockID);
     this.addBlockInstance(x , y , z);
  } 
}
    /**
     * @param {number} x 
     * @param {number} y  
     *  @param {number} z
     */

    removeBlock(x, y, z){
      const block = this.getBlock(x,y,z);
      if(block && block.id != Blocks.empty.id){ 
        this.deleteBlockInstance(x , y ,z );
         this.setBlockID(x, y, z, Blocks.empty.id);
      }
    }


    /**
     * @param {number} x  
     * @param {number} y
     * @param {number} z
     */

    deleteBlockInstance(x, y, z){
      const block = this.getBlock(x,y,z);
      if(block.instanceId == null) return;

      const mesh = this.children.find((instanceMesh) => 
        instanceMesh.name == block.id);
     
      if(!mesh) return;
      
      const instanceId = block.instanceId;
      const lastMatrix = new THREE.Matrix4();
      const lastIndex = mesh.count - 1;
      
      // If we're not removing the last instance, swap with last
      if(instanceId !== lastIndex){
        mesh.getMatrixAt(lastIndex, lastMatrix);
        const v = new THREE.Vector3();
        v.setFromMatrixPosition(lastMatrix);
        
        // Round to get integer block coordinates
        const lastBlockX = Math.round(v.x);
        const lastBlockY = Math.round(v.y);
        const lastBlockZ = Math.round(v.z);
        
        // Update the last block's instance ID to the removed block's position
        this.setBlockInstanceId(lastBlockX, lastBlockY, lastBlockZ, instanceId);
        
        // Move the last instance to the removed position
        mesh.setMatrixAt(instanceId, lastMatrix);
      }

      mesh.count--;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();

      this.setBlockInstanceId(x, y, z, null);
      this.setBlockID(x, y, z, Blocks.empty.id);
    }
 /**
   * Sets the block id for the block at (x, y, z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @param {number} id
   */

  setBlockID(x, y, z, id){
   if(this.inBounds(x,y,z)){
     this.data[x][y][z].id = id;
     return true;
   }
   return false;
}

 /**
   * Sets the block instance id for the block at (x, y, z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @param {number} instanceId
   */
  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  /**
 * @param {number} x
 * @param {number} y  
 * @param {number} z
 * 
 */

addBlockInstance( x, y , z){
   const block = this.getBlock(x,y,z)
      if(block && block.id !== Blocks.empty.id && block.instanceId == null){

      const mesh = this.children.find((instanceMesh) => 
      instanceMesh.name == block.id )
      const instanceId = mesh.count++;

      this.setBlockInstanceId(x , y , z , instanceId);
       const matrix = new THREE.Matrix4();
       matrix.setPosition(x , y , z)
       mesh.setMatrixAt( instanceId , matrix);
        mesh.instanceMatrix.needsUpdate = true;
      }
}

  /**
   * Checks if the (x, y, z) coordinates are within bounds
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {boolean}
   */

    inBounds(x,y,z){
         if(x >= 0 && x < this.size.width &&
               y >= 0 && y < this.size.height &&
               z >= 0 && z < this.size.width) return true;
               else return false;  
    }
    isBlockObsecured(x,y,z) {
  const up = this.getBlock(x,y+1,z)?.id??Blocks.empty.id;
  const down = this.getBlock(x,y-1,z)?.id??Blocks.empty.id;
  const left = this.getBlock(x-1,y,z)?.id??Blocks.empty.id;
  const right = this.getBlock(x+1,y,z)?.id??Blocks.empty.id;
  const front = this.getBlock(x,y,z+1)?.id??Blocks.empty.id;
  const back = this.getBlock(x,y,z-1)?.id??Blocks.empty.id;

  if(up === Blocks.empty.id ||
     down === Blocks.empty.id ||
     left === Blocks.empty.id ||
     right === Blocks.empty.id ||
     front === Blocks.empty.id ||
     back === Blocks.empty.id) {
       return false;
     } else return true;
}

disposeInstances(){
this.traverse((obj) => {
  if(obj.dispose) obj.dispose();
})
this.clear();

}
}

