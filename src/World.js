import * as THREE from 'three';
import { WorldChunk } from './WorldChunk';

export class World extends THREE.Group {

  drawdistance = 1;
  asyncLoading = false;
  
  ChunkSize = {
    width : 64 , 
    height : 32
  }

  params = {
    seed : 0 ,
    terrain : {
        scale : 30,
        magnitude : 0.5 , 
offset : 0.2
    } ,
    threshold : 0.5
}


constructor(seed = 0){
super();
this.seed = seed;
}

generate(){
  this.disposeChunks();
 for(let x = -1 ; x <= 1; x ++ ){
  for( let z = -1 ; z <= 1 ; z ++){
    const chunk = new WorldChunk(this.ChunkSize , this.params);
    chunk.position.x = x * this.ChunkSize.width;
    chunk.position.y = 0;
    chunk.position.z = z * this.ChunkSize.width;
    chunk.userData = { x: x, z: z }
    chunk.generate();
    this.add(chunk);
  }

 }
}

/**
 * @param {Player} player
 */

update(player){
  const visiblechunks = this.getVisibleChunks(player);
  const chunksToAdd = this.getChunkstoadd(visiblechunks);
  
  // Only generate one chunk per frame to reduce lag
  if (chunksToAdd.length > 0) {
    const chunk = chunksToAdd[0];
    this.generateChunk(chunk.x, chunk.z);
  }
  
  this.removeUnusedChunks(visiblechunks);
}

/**
 *  @param {Player} player
 * @returns {{x : number , z : number}}
 * 
 */
getVisibleChunks(player){
 const visiblechunks = []

 const coords = this.worldToChunkBlock(
  player.position.x ,
  player.position.y ,
  player.position.z
 )

 const chunkX = coords.chunk.x;
 const chunkZ = coords.chunk.z;

 for(let x = chunkX - this.drawdistance ; x <= chunkX + this.drawdistance ; x ++ ){
  for(let z = chunkZ - this.drawdistance ; z <= chunkZ + this.drawdistance ; z ++ ){
     visiblechunks.push({x , z});
    
  }}
  return visiblechunks;
}


/**
 * @param {{x : number , z : number}[]} 
 * @returns { {x: number , z : number}[]}
 */

getChunkstoadd(visiblechunks){
   return visiblechunks.filter((chunk) => {
      const chunkExists = this.children 
      .map((obj) => obj.userData)
      .find(({x , z}) => x === chunk.x && z === chunk.z);
         return !chunkExists;

   })
}

/**
 * @param {{x : number , z : number} , []}
 */

removeUnusedChunks(visiblechunks){

const chunkToRemove = this.children .filter((chunk) => {
  const {x , z} = chunk.userData;
      const chunkExists = visiblechunks
      .find((visiblechunk) => visiblechunk.x === x && visiblechunk.z === z);
         return !chunkExists;

   })
for(const chunk of chunkToRemove){
  chunk.disposeInstances();
  this.remove(chunk);
}
}

/**
 * @param {number} x
 * @param {number} z
 */

generateChunk(x , z){
    const chunk = new WorldChunk(this.ChunkSize , this.params);
    chunk.position.x = x * this.ChunkSize.width;
    chunk.position.y = 0;
    chunk.position.z = z * this.ChunkSize.width;
    chunk.userData = { x: x, z: z }
    
    if(this.asyncLoading){
        requestIdleCallback(chunk.generate.bind(chunk), {timeout: 1000});
    } else {
        chunk.generate();
    }
    
    this.add(chunk);
}
/**
 *  @param {number} x 
 *  @param {number} y  
 *  @param {number} z
 * @returns {
 * chunk : { x : number , z : number}
 * block : { x: number , y : number , z : number}
 * }
 */

worldToChunkBlock(x , y , z){ 
  // Ensure we're working with integers
  x = Math.floor(x);
  y = Math.floor(y);
  z = Math.floor(z);

  const chunkCoords = {
    x : Math.floor(x / this.ChunkSize.width),
    z : Math.floor(z / this.ChunkSize.width)
  }

  const blockCoords = {
    x : x - this.ChunkSize.width * chunkCoords.x,
    y : y,
    z : z - this.ChunkSize.width * chunkCoords.z
  }
  
  return {
    chunk : chunkCoords,
    block : blockCoords
  }
}


/**
 * @param {number} chunkX 
 
 * @param {number} chunkZ  
 * @returns { WorldChunk | null}
 * 
 * */

getChunk(chunkX , chunkZ){
  return this.children.find((chunk) => {
    return chunk.userData.x == chunkX && chunk.userData.z == chunkZ
  })
}

/**
 * @param {number} x 
 * @param {number} y  
 * @param {number} z  
 * @returns {{id:number , instanceID : number} | null}
 * 
 * */

getBlock(x , y , z){
  const coords = this.worldToChunkBlock(x,y,z);
  this.chunk = this.getChunk(coords.chunk.x , coords.chunk.z);

  if(this.chunk && this.chunk.loaded){
     return this.chunk.getBlock(coords.block.x , coords.block.y , coords.block.z);
  }
  else return null;
}

disposeChunks(){
this.traverse((chunk) => {
  if(chunk.disposeInstances){
 chunk.disposeInstances();
  }
})
this.clear();
}
/**
 * @param {number} x
 * @param {number} y  
 * @param {number} z
 * @param {number} blockID
 */

addBlock(x , y , z, blockID){
const coords = this.worldToChunkBlock(x, y, z);
  const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
  
  if(chunk){
    chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, blockID);
  }
}
/**
 * @param {number} x
 * @param {number} y  
 * @param {number} z
 */

removeBlock(x , y , z){
  // Ensure coordinates are integers
  x = Math.floor(x);
  y = Math.floor(y);
  z = Math.floor(z);
  
  const coords = this.worldToChunkBlock(x, y, z);
  const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
  
  if(chunk && chunk.loaded){
    // Ensure block coordinates are within chunk bounds
    if(coords.block.x >= 0 && coords.block.x < this.ChunkSize.width &&
       coords.block.y >= 0 && coords.block.y < this.ChunkSize.height &&
       coords.block.z >= 0 && coords.block.z < this.ChunkSize.width){
      
      chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z);
      
      // Reveal neighboring blocks
      this.revealBlock(x-1, y, z);
      this.revealBlock(x+1, y, z);
      this.revealBlock(x, y-1, z);  
      this.revealBlock(x, y+1, z);
      this.revealBlock(x, y, z-1);
      this.revealBlock(x, y, z+1);
    }
  }
}


/**
 * @param {number} x
 * @param {number} y  
 * @param {number} z
 */

revealBlock(x , y , z){
   const coords = this.worldToChunkBlock(x,y,z)
  const chunk = this.getChunk(coords.chunk.x ,  coords.chunk.z);
  if(chunk){
    chunk.addBlockInstance(coords.block.x , coords.block.y , coords.block.z); 
  }
}
}
