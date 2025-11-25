import { GLTFLoader } from "three/examples/jsm/Addons.js";

export class ModelLoader {
   loader = new GLTFLoader();

   models = {
    pickaxe : undefined
   }

   /**
    * @param {(object) => ()} onLoad
    */
   loadModels(onLoad) {

    this.loader.load('/Textures/pickaxe.glb' , (model) => {
        console.log('Pickaxe model loaded:', model);
        this.models.pickaxe = model.scene;
        console.log('Pickaxe scene:', model.scene);
        onLoad(this.models);
    }, undefined, (error) => {
        console.error('Error loading pickaxe model:', error);
    })
   }
}