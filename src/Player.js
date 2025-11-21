import * as THREE from 'three';

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Blocks } from './Blocks.js';

export class Player {
    radius = 0.5;
    height = 1.75;
    maxSpeed = 10;
    jumpSpeed = 10;
    onGround = false;
    #worldvelocity = new THREE.Vector3();
    input = new THREE.Vector3();
    velocity = new THREE.Vector3();
    Camera = new THREE.PerspectiveCamera(70 , window.innerWidth / window.innerHeight, 0.1, 200);
    controls = new PointerLockControls(this.Camera , document.body);
    raycaster = new THREE.Raycaster(new THREE.Vector3() , new THREE.Vector3() , 0 , 3);
    selectedCoords = Blocks.grass.id;
    CENTER_SCREEN = new THREE.Vector2();
    /**
     * 
     * @param {THREE.Scene} scene 
     */

    constructor(scene){
        this.Camera.position.set(32 ,16 , 32);
        scene.add(this.Camera)
        document.addEventListener('click' , () => {
            this.controls.lock();
        })
       document.addEventListener('keydown' , this.onkeydown.bind(this));
       document.addEventListener('keyup' , this.onkeyup.bind(this));
    
       this.boundsHelper = new THREE.Mesh(
        new THREE.CylinderGeometry(this.radius , this.radius , this .height , 16),
        new THREE.MeshBasicMaterial({ wireframe: true, visible: false })
       );
       this.boundsHelper.visible = false;
       scene.add(this.boundsHelper);
       
       const selectionMaterial = new THREE.MeshBasicMaterial({transparent: true , opacity: 0.5 , color : 0xffff00});
       const selectionGeometry = new THREE.BoxGeometry(1 , 1 , 1);

       this.selectionHelper = new THREE.Mesh(selectionGeometry , selectionMaterial);
       scene.add(this.selectionHelper);
    }

    update(world){
    this.updateRayCaster(world);
    }

    /**
     * 
     * @param {World} world 
     */

    updateRayCaster(world){
        this.raycaster.setFromCamera(this.CENTER_SCREEN, this.Camera);
        const intersections = this.raycaster.intersectObjects(world.children, true);

        if (intersections.length > 0) {
            const intersection = intersections[0];
            const chunk = intersection.object.parent;
            
            // Get the instance matrix to find the exact block position
            const blockMatrix = new THREE.Matrix4();
            intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);
            
            // Extract position from the matrix
            const blockPosition = new THREE.Vector3();
            blockPosition.setFromMatrixPosition(blockMatrix);
            
            // Add the chunk's position to get world coordinates
            blockPosition.add(chunk.position);
            
            // Round to integer block coordinates
            this.selectedCoords = new THREE.Vector3(
                Math.round(blockPosition.x),
                Math.round(blockPosition.y),
                Math.round(blockPosition.z)
            );
            
            this.selectionHelper.position.copy(this.selectedCoords);
            this.selectionHelper.visible = true;
        } else {
            this.selectedCoords = null;
            this.selectionHelper.visible = false;
        }
    }

    get worldVelocity(){
        this.#worldvelocity.copy(this.velocity);
        this.#worldvelocity.applyEuler(new THREE.Euler(0 , this.Camera.rotation.y , 0));
        return this.#worldvelocity;
    }

    /**
     * 
     * @param {THREE.Vector3} dv
     */

    applyWorldDeltaVelocity(dv){
        dv.applyEuler(new THREE.Euler(0 , -this.Camera.rotation.y , 0));
        this.velocity.add(dv);
    }
    applyInput(dt){
        if(this.controls.isLocked === true){
  this.velocity.x = this.input.x
  this.velocity.z = this.input.z
  this.controls.moveRight(this.velocity.x * dt );
    this.controls.moveForward(this.velocity.z * dt );
    this.position.y += this.velocity.y * dt ;
    document.getElementById("player-position").innerHTML = this.toString();
        }
    }

    updateBoundsHelper(){
         this.boundsHelper.position.copy(this.position);
         this.boundsHelper.position.y -= this.height / 2;
    }

/**
 * @type {THREE.Vector3}
 */

    get position (){
        return this.Camera.position;
    }

    /**
     * @param {KeyBoardEvent} event
     */
    onkeydown(event){
if(!this.controls.isLocked){
    this.controls.lock();
}

switch(event.code){
    case 'Digit0' :
    case 'Digit1' :
    case 'Digit2' :
    case 'Digit3' : 
    case 'Digit4' :
    case 'Digit5' :
               this.activeBlockID = Number(event.key)
               break;
    case 'KeyW' : 
    this.input.z = this.maxSpeed;
break;

 case 'KeyA' :
    this.input.x = this.maxSpeed * -1 ;
    break;

    case 'KeyS' :
    this.input.z = this.maxSpeed* -1;
    break;

    case 'KeyD' :       
    this.input.x = this.maxSpeed ;
    break;

    case 'KeyR' : 
    this.Camera.position.set(32 ,16 , 32);
    this.velocity.set(0,0,0);
    break;

    case 'Space' : 
    if(this.onGround){
    this.velocity.y = this.jumpSpeed;
    }
    break;
}

    }

    /**
     * @param {KeyBoardEvent} event
     */
    onkeyup(event){ 
    if(!this.controls.isLocked){
    this.controls.lock();
    }
    switch(event.code){
    case 'KeyW' : 
    this.input.z = 0;
    break;

    case 'KeyS' :
    this.input.z = 0;
    break;

    case 'KeyA' :
    this.input.x = 0;
    break;

    case 'KeyD' :       
    this.input.x = 0;
    break;
}
    console.log("Key up")
    }
    toString(){
        return `Player Position : ( ${this.position.x.toFixed(3)} , ${this.position.y.toFixed(3)} , ${this.position.z.toFixed(3)} )`
    }
}