import './style.css'

// Hide overlay on first key press
document.addEventListener('keydown', () => {
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}, { once: true });

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { WorldChunk } from './WorldChunk.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
//...'
import { createUI } from './ui.js'
import { Player } from './Player.js'
import {Physics} from './Physics.js'
import { World } from './World.js'
import { Blocks } from './Blocks.js'
import { ModelLoader } from './modelLoader.js'

// import { createUI } from './ui.js'  // TODO: Add UI later
const stats = new Stats()
document.body.appendChild( stats.dom )

const renderer = new THREE.WebGLRenderer()
renderer.setSize( window.innerWidth, window.innerHeight )
document.body.appendChild( renderer.domElement )
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setClearColor(0x62c1e5, 1) // Sky blue background
const scene = new THREE.Scene()
const physics = new Physics(scene);
const player = new Player(scene);
const modelloader = new ModelLoader();
modelloader.loadModels( (models) => {
   player.tool.setMesh(models.pickaxe)
} )

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
camera.position.set(-32 , 16 , -32)

const controls = new OrbitControls( camera, renderer.domElement )
controls.target.set(16,0,16) 
controls.update() 
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.screenSpacePanning = false
controls.minDistance = 1
controls.maxDistance = 500
controls.maxPolarAngle = Math.PI / 2

const world = new World()
world.generate()
scene.add( world )
const fog = new THREE.Fog(0x80a0e0 , 25 , 100)
scene.fog = fog;
const light1 = new THREE.DirectionalLight( ) 
function setupLights() {

light1.position.set(50,50,50)
light1.shadow.camera.left = -50
light1.shadow.camera.right = 50
light1.shadow.camera.bottom = -50
light1.shadow.camera.top = 50
light1.shadow.camera.near = 0.1
light1.shadow.camera.far = 200// soft white light
light1.shadow.bias = -0.001
light1.castShadow = true
light1.shadow.mapSize = new THREE.Vector2(2048 , 2048)
scene.add( light1 )
scene.add( light1.target )
const skyColor = 0xB1E1FF;    // A light blue
const groundColor = 0xB97A20;  // A brownish, earthy color
const intensity = 0.25;
const hemiLight = new THREE.HemisphereLight(skyColor, groundColor, intensity);
scene.add(hemiLight);

//const shadowhelper = new THREE.CameraHelper( light1.shadow.camera )
//scene.add( shadowhelper )

const light3 = new THREE.AmbientLight( 0x404040 ) // soft white light
scene.add( light3 )

}

function onMouseDown(event){
if(player.controls.isLocked && player.selectedCoords ){
  if(player.activeBlockID === Blocks.empty.id){
    world.removeBlock(
      player.selectedCoords.x , player.selectedCoords.y , player.selectedCoords.z
    )
    player.tool.startAnimation();
}

else{
 world.addBlock(
      player.selectedCoords.x , player.selectedCoords.y , player.selectedCoords.z, player.activeBlockID
    )
}

}
}
document.addEventListener('mousedown' , onMouseDown)
let previoustime  = performance.now();
function animate() {
  
  let  currenttime = performance.now();
  let dt = (currenttime - previoustime)/1000 ;
  requestAnimationFrame( animate )
  player.update(world);
  physics.update(dt , player , world);
  world.update(player);
  light1.position.copy(player.position)
  light1.position.sub(new THREE.Vector3(-50, -50, -50))
  light1.target.position.copy(player.position)
  controls.update()
  renderer.render( scene, player.controls.isLocked ? player.Camera : camera)
  stats.update()

previoustime = currenttime;

}                                         

window.addEventListener( 'resize', () => {            
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    player.Camera.aspect = window.innerWidth / window.innerHeight
    player.Camera.updateProjectionMatrix()

    renderer.setSize( window.innerWidth, window.innerHeight )
}   )   


setupLights() 
createUI(world,player)
animate()





