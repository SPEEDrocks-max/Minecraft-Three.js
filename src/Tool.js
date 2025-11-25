import * as THREE from 'three';

export class Tool extends THREE.Group{
    animate = false;
    animationAmplitude = 0.5;
    animationStart = 0;
    animationSpeed = 0.025;
    animationDuration = 500;
    animation = undefined;
    toolMesh = undefined;

get animationTime(){
return performance.now() - this.animationStart;
}

startAnimation(){
    if(this.animate) return;
    this.animate = true;
    this.animationStart = performance.now();
    clearTimeout(this.animation);
     this.animation = setTimeout( () => {
        this.animate = false;
    } , this.animationDuration)
}
update(){
    if(this.animate && this.toolMesh){
this.toolMesh.rotation.y = Math.sin(this.animationTime * this.animationSpeed) * this.animationAmplitude;
    }

   
}
    setMesh(mesh){
        this.clear();
        this.toolMesh = mesh;
        
        mesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        this.add(mesh);

        // Position and scale the tool relative to the camera
        this.position.set(0.4, -0.3, -0.5);
        this.scale.set(0.02, 0.02, 0.04);
        this.rotation.z = Math.PI / 2;
    }
}