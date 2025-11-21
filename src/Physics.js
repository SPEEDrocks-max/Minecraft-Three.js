import * as THREE from 'three';
import { Player } from './Player';
import { Blocks } from './Blocks';
import { traverseVisibleGenerator } from 'three/examples/jsm/utils/SceneUtils.js';

const collisionMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 , opacity : 0.2 , transparent: true});
    const collisionGeometry = new THREE.BoxGeometry(1, 1, 1);

export class Physics {

     gravity = 32;

  // Physic simulation rate
  simulationRate = 250;
  stepSize = 1 / this.simulationRate;
  // Accumulator to keep track of leftover dt
  accumulator = 0;
  showCollisionHelpers = false;  // Toggle to show/hide collision wireframes

    constructor(scene){
 this.helpers = new THREE.Group();
 
 scene.add(this.helpers);

    }
    /**
     * @param {Player} player
     * @param {number} dt
     * @param {World} world
     */

    update (dt , player , world){
 this.accumulator += dt;
    while (this.accumulator >= this.stepSize) {
      player.velocity.y -= this.gravity * this.stepSize;
      player.applyInput(this.stepSize);
       player.updateBoundsHelper();
      this.detectCollisions(player, world);
      this.accumulator -= this.stepSize;
     
    }
    }

    detectCollisions(player , world){
      player.onGround = false;
        const candidates = this.broadPhase(player , world);
        const collisions = this.narrrowPhase(candidates , player)

        if(collisions.length > 0 ){
            this.resolveCollisions(collisions ,player);
        }
    }

    broadPhase(player , world){
        this.helpers.clear();
        const candidates = [];

        const minX = Math.floor(player.position.x - player.radius)
        const maxX = Math.ceil(player.position.x + player.radius)
        const minY = Math.floor(player.position.y - player.height)
        const maxY = Math.ceil(player.position.y)
        const minZ = Math.floor(player.position.z - player.radius)
        const maxZ = Math.ceil (player.position.z + player.radius)

        for (let x = minX ; x <= maxX ; x++){
              for(let y = minY ; y <= maxY; y++){
                for (let z = minZ ; z <= maxZ ; z++){
                    const blockID = world.getBlock(x , y ,z)?.id;
                    if(blockID && blockID != Blocks.empty.id){
                        const blockPos = {x , y , z};
                        candidates.push(blockPos);
                        
                        // Only add collision helpers if enabled
                        if (this.showCollisionHelpers) {
                            this.addCollisionHelper(blockPos);
                        }
                    }
                }
              }
        }
        return candidates;
        
    }

    /**
   * Narrows down the blocks found in the broad-phase to the set
   * of blocks the player is actually colliding with
   * @param {{ id: number, instanceId: number }[]} candidates 
   * @returns 
   */

    narrrowPhase(candidates , player){
        const collisions = [];

        for(const block of candidates){
            // Blocks are centered at integer position (e.g., block at x=5 spans from 4.5 to 5.5)
            const blockCenter = {
                x: block.x,
                y: block.y,
                z: block.z
            };
            
            const closestPoint = {
                x: Math.max(blockCenter.x - 0.5, Math.min(player.position.x, blockCenter.x + 0.5)),
                y: Math.max(blockCenter.y - 0.5, Math.min(player.position.y - (player.height/2), blockCenter.y + 0.5)),
                z: Math.max(blockCenter.z - 0.5, Math.min(player.position.z, blockCenter.z + 0.5))
            };

            const dx = player.position.x - closestPoint.x;
            const dy = (player.position.y - (player.height/2)) - closestPoint.y;
            const dz = player.position.z - closestPoint.z;

            if(this.pointinPlayerBoundingCylinder(closestPoint , player)){
                const overlapY = (player.height/2) - Math.abs(dy);
                const overlapXZ = player.radius - Math.sqrt(dx*dx + dz*dz);

                let normal, overlap;
                if(overlapY < overlapXZ){
                    normal = new THREE.Vector3(0, dy < 0 ? -1 : 1, 0);
                    overlap = overlapY;
                    player.onGround = true;
                } else {
                    normal = new THREE.Vector3(dx, 0, dz).normalize();
                    overlap = overlapXZ;
                }
                
                collisions.push({
                    block,
                    contactPoint: new THREE.Vector3(closestPoint.x, closestPoint.y, closestPoint.z),
                    normal,
                    overlap
                });
            }
        }
        return collisions;
    }

    resolveCollisions(collisions , player){ 
          collisions.sort((a , b ) => b.overlap - a.overlap); 
              

    for (const collision of collisions) {
     
      if (!this.pointinPlayerBoundingCylinder(collision.contactPoint, player)) 
        continue;

      // Adjust position of player so the block and player are no longer overlapping
   let deltaPosition = collision.normal.clone();
      deltaPosition.multiplyScalar(collision.overlap);
      player.position.add(deltaPosition);
      // Get the magnitude of the player's velocity along the collision normal
      let magnitude = player.worldVelocity.dot(collision.normal);
    let velocityAdjustment = collision.normal.clone();
      velocityAdjustment.multiplyScalar(magnitude);

      player.applyWorldDeltaVelocity(velocityAdjustment.negate());

      // Apply the velocity to the player
  
    
  }



        }

           /**
      * @param {{ x: number, y: number, z: number }} p 
   * @param {Player} player 
   * @returns {boolean}
   */  

    pointinPlayerBoundingCylinder(p , player){
            const dx = p.x - player.position.x
            const dy = p.y - (player.position.y - (player.height/2))
            const dz = p.z - player.position.z

            const r_sq = dx*dx + dz*dz;

                return (Math.abs(dy) < player.height / 2) && (r_sq < player.radius * player.radius);
    }
    /**
     * 
     * @param {THREE.Object3D} Blocks 
     */
    addCollisionHelper(Blocks){
        const blockmesh = new THREE.Mesh(collisionGeometry , collisionMaterial);
        blockmesh.position.set(Blocks.x , Blocks.y ,Blocks.z);
        this.helpers.add(blockmesh);
    }
    }

 
