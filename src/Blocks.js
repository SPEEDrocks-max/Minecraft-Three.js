// block.js

import * as THREE from 'three';
import { materialAO } from 'three/tsl';

const textureLoader = new THREE.TextureLoader();

function loadtexture(path) {
    // FIX 2: Paths must be absolute from the 'public' folder.
    // I have removed the './'
    const texture = textureLoader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    // FIX 3: Add this to make pixel art sharp (no blur)
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const textures = {
    // All paths now start with '/'
    grass: loadtexture('/Textures/grass.png'),
    dirt: loadtexture('/Textures/dirt.png'),
    stone: loadtexture('/Textures/stone.png'),
    coalOre: loadtexture('/Textures/coal_ore.png'),
    IronOre: loadtexture('/Textures/iron_ore.png'),
    grassSide: loadtexture('/Textures/grass_path_side.jpg'),
    leaves: loadtexture('/Textures/leaves.png'),
    sand: loadtexture('/Textures/sand.png'),
    snow: loadtexture('/Textures/snow.png'),
    treetop: loadtexture('/Textures/tree_top.png'),
    treeside: loadtexture('/Textures/tree_side.png'),
}

export const Blocks = {
    empty: {
        id: 0,
        name: 'Empty'
    },
    grass: {
        id: 1,
        name: 'Grass',
        color: 0x559020,
        // This is correct (an array of 6 materials)
        material: [
            new THREE.MeshStandardMaterial({ map: textures.grassSide }),
            new THREE.MeshStandardMaterial({ map: textures.grassSide }),
            new THREE.MeshStandardMaterial({ map: textures.grass }),
            new THREE.MeshStandardMaterial({ map: textures.dirt }),
            new THREE.MeshStandardMaterial({ map: textures.grassSide }),
            new THREE.MeshStandardMaterial({ map: textures.grassSide }),
        ]
    },
    dirt: {
        id: 2,
        name: 'Dirt',
        color: 0x807020,
        // FIX 1: This is now a SINGLE OBJECT, not an array
        material: new THREE.MeshStandardMaterial({ map: textures.dirt }),
    },
    stone: {
        id: 3,
        name: 'Stone',
        color: 0x808080,
        scale: { x: 30, y: 30, z: 30 },
        scarcity: 0.5,
        // FIX 1: This is now a SINGLE OBJECT, not an array
        material: new THREE.MeshStandardMaterial({ map: textures.stone }),
    },
    coalOre: {
        id: 4,
        name: 'Coal Ore',
        color: 0x202020,
        scale: { x: 20, y: 20, z: 20 },
        scarcity: 0.8,
        // FIX 1: This is now a SINGLE OBJECT, not an array
        material: new THREE.MeshStandardMaterial({ map: textures.coalOre }),
    },
    IronOre: {
        id: 5,
        name: 'Iron Ore',
        color: 0x806060,
        scale: { x: 60, y: 60, z: 60 },
        scarcity: 0.7,
        // FIX 1: This is now a SINGLE OBJECT, not an array
        material: new THREE.MeshStandardMaterial({ map: textures.IronOre }),
    } ,

    Tree : {
       id : 6 , 
       name : 'Tree' ,
       material : [
        new THREE.MeshLambertMaterial({ map: textures.treeside }),
        new THREE.MeshLambertMaterial({ map: textures.treeside }),
        new THREE.MeshLambertMaterial({ map: textures.treetop }),
        new THREE.MeshLambertMaterial({ map: textures.treetop }),
        new THREE.MeshLambertMaterial({ map: textures.treeside }),
        new THREE.MeshLambertMaterial({ map: textures.treeside }),
       ]
    } , 
    Leaves : {
        id: 7 , 
        name : 'Leaves' ,
        material : new THREE.MeshLambertMaterial({map : textures.leaves})
    } ,
    Sand : {
        id: 8 , 
        name : 'Sand' ,
        material : new THREE.MeshLambertMaterial({map : textures.sand})
    } , 
    cloud : {
        id : 9 , 
        name : 'Cloud' ,
        material : new THREE.MeshLambertMaterial({
            color : 0xE8E9E3,
            transparent : true,
            opacity : 0.8,
            side: THREE.DoubleSide
        })
    }
}

export const resource = [
    Blocks.stone,
    Blocks.coalOre,
    Blocks.IronOre
]