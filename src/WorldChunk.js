import * as THREE from 'three';

import { createNoise2D, createNoise3D } from 'simplex-noise';
import { Blocks , resource } from './Blocks';
import { World } from './World';
const geometry = new THREE.BoxGeometry();
import { DataStore } from './DataStore';
 
export class WorldChunk extends THREE.Group {

  asyncLoading = true;
 rnd = Math.random();
    /**
 *  @type {{
 * id: number,
 * instanceID: number,}
 * [][][]}
 */

    data = [];
    


    constructor(size , params , dataStore) {
     
        super();
         this.loaded = false;
        this.size =  size;
        this.params = params;
        this.dataStore = dataStore;
    }

  generate() {
     const start = performance.now();
    this.InitialiseTerrain();
    this.generateResources();
   
   this.generateTerrain();
   this.generateTrees(this.rnd)
    this.generateClouds(this.rnd)
   this.loadPlayerChanges();
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
                let height = Math.floor( scaledNoise);
                height = Math.max(0, Math.min(height, this.size.height - 1));

                // Only fill up to the height value
                for(let y = 0; y < this.size.height; y++) {
                    if(y == height){
                        // If terrain surface is underwater, use sand, otherwise use grass
                        if(height <= this.params.terrain.waterOffset) {
                            this.setBlockID(x, y, z, Blocks.Sand.id);
                        } else {
                            this.setBlockID(x, y, z, Blocks.grass.id);
                        }
                    } else if (y < height && this.getBlock(x, y, z).id === Blocks.empty.id){
                        // Fill below surface with sand if underwater, otherwise dirt
                        if(y <= this.params.terrain.waterOffset) {
                            this.setBlockID(x, y, z, Blocks.Sand.id);
                        } else {
                            this.setBlockID(x, y, z, Blocks.dirt.id);
                        }
                    } else if (y > height ){
                        // Clear blocks above terrain, but preserve clouds
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

generateTrees(rnd){
const generateTreeTrunk = (x , z , treeRnd) => {
const maxHeight = this.params.trees.trunk.maxHeight;
const minHeight = this.params.trees.trunk.minHeight;


const heightVariation = Math.pow(treeRnd, 1);
const h =  Math.round(minHeight + (maxHeight - minHeight) * heightVariation);

console.log(`Tree at (${x},${z}): treeRnd=${treeRnd.toFixed(3)}, heightVariation=${heightVariation.toFixed(3)}, height=${h}`);

for(let y = 0 ; y < this.size.height ; y ++ ){
  const block = this.getBlock(x , y , z);
  if(block.id === Blocks.grass.id){
    for(let treeY = y + 1 ; treeY <= y + h ; treeY ++ ){
      this.setBlockID(x , treeY , z , Blocks.Tree.id);
    }
    generateTreeCanopy(x , y + h , z , treeRnd);
    break;
  }
}
}

const generateTreeCanopy = (centerX , centerY ,  centerZ , treeRnd) => {
const minR = this.params.trees.canopy.minRadius;
const maxR = this.params.trees.canopy.maxRadius;
const radiusVariation = Math.pow(treeRnd, 3);
const r =  Math.round(minR + (maxR - minR) * radiusVariation);

const simplex = createNoise3D();

for(let x = -r ; x <= r ; x ++ ){
  for(let y = -r ; y <= r ; y ++ ){
    for(let z = -r ; z <= r ; z ++ ){
      const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
      if( distanceFromCenter > r )continue;

        const block = this.getBlock( centerX + x , centerY + y , centerZ + z);
        if(!block || block.id !== Blocks.empty.id){ continue}
        
        // Use 3D noise for organic shape
        const noiseValue = simplex(
          (centerX + x) * 0.3,
          (centerY + y) * 0.3,
          (centerZ + z) * 0.3
        );
        
        // Leaves more likely near center, less at edges
        const falloff = 1 - (distanceFromCenter / r);
        const threshold = this.params.trees.canopy.density - (noiseValue * 0.3);
        
        if(falloff > threshold){
          this.setBlockID( centerX + x , centerY + y , centerZ + z , Blocks.Leaves.id);
        }
      
    }
  }
}
}

const simplex = createNoise2D();

for(let x = 0; x < this.size.width; x++) {
    for(let z = 0; z < this.size.width; z++) {
        // Use world coordinates with larger scale for more variation
        const value = simplex(
          (x + this.position.x) * 0.5,
          (z + this.position.z) * 0.5
        );
        
        // Normalize noise from [-1, 1] to [0, 1]
        const normalizedValue = (value + 1) * 0.5;
        
        if(normalizedValue < this.params.trees.frequency){
          // Use different noise scale for height variation
          const heightNoise = simplex(
            (x + this.position.x) * 3.7,
            (z + this.position.z) * 3.7
          );
          const treeRnd = (heightNoise + 1) * 0.5;
          generateTreeTrunk(x , z , treeRnd);
        }
    }
  }
}

generateClouds(){
 const simplex = createNoise2D();
 const cloudHeight = this.params.clouds.height;
 let cloudCount = 0;
 
 for(let x = 0; x < this.size.width; x++) {
      for(let z = 0; z < this.size.width; z++) {
        const value = simplex(
          (x + this.position.x) / this.params.clouds.scale,
          (z + this.position.z) / this.params.clouds.scale
        );
        
        // Normalize noise from [-1, 1] to [0, 1]
        const normalizedValue = (value + 1) * 0.5;
        
        // Place clouds where normalized noise is BELOW density threshold (so low density = fewer clouds)
        if(normalizedValue < this.params.clouds.density){
          const y = cloudHeight;
          if(y < this.size.height){
            this.setBlockID(x, y, z, Blocks.cloud.id);
            cloudCount++;
          }
        }
      }
    }
    
    console.log(`Generated ${cloudCount} cloud blocks at height ${cloudHeight}`);
}
      loadPlayerChanges(){
        for(let x = 0 ; x < this.size.width ; x++){
          for(let y = 0 ; y < this.size.height ; y++){
            for(let z = 0 ; z < this.size.width ; z++){
              if(this.dataStore.contains(this.position.x , this.position.z , x , y , z)){
                const blockID = this.dataStore.get(this.position.x , this.position.z , x , y , z);
                this.setBlockID(x, y, z, blockID);
              }
            }
          }
        }
      }

      generateWater(){
        const material = new THREE.MeshLambertMaterial({
          color : 0x9090e0 , 
          transparent : true ,
          opacity : 0.4 ,
          side : THREE.DoubleSide,
          depthWrite : false
        })

        const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(this.size.width, this.size.width) , material);
        waterMesh.rotation.x = - Math.PI / 2 ;
        waterMesh.position.set(
          this.size.width / 2 ,
          this.params.terrain.waterOffset ,
          this.size.width / 2
        )
        this.add(waterMesh);

      }
    generateMeshes() {

      this.clear();

this.generateWater();

    // First pass: count how many instances we actually need per block type
    const blockCounts = {};
    
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;
          if (blockId === Blocks.empty.id) continue;
          
          const shouldRender = !this.isBlockObsecured(x, y, z) || blockId === Blocks.cloud.id;
          if (shouldRender) {
            blockCounts[blockId] = (blockCounts[blockId] || 0) + 1;
          }
        }
      }
    }

    // Second pass: create meshes ONLY for block types that exist, with buffer for additions
    const meshes = {};
    Object.entries(blockCounts).forEach(([blockId, count]) => {
      const blockType = Object.values(Blocks).find(b => b.id === parseInt(blockId));
      if (blockType) {
        // Add 100% buffer for player additions/modifications
        const meshSize = count*1.5 ;
        const mesh = new THREE.InstancedMesh(geometry, blockType.material, meshSize);
        mesh.name = blockType.id;
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes[blockType.id] = mesh;
      }
    });

    // Third pass: actually place the instances
    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;

          if (blockId === Blocks.empty.id) continue;

          const mesh = meshes[blockId];
          if (!mesh) continue;
          
          const instanceId = mesh.count;

          const shouldRender = !this.isBlockObsecured(x, y, z) || blockId === Blocks.cloud.id;

          if (shouldRender) {
            matrix.setPosition(x , y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
            mesh.instanceMatrix.needsUpdate = true;
          }
          else{
            this.setBlockInstanceId(x, y, z, null);
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
     this.dataStore.set(this.position.x , this.position.z , x , y , z , blockID);
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

