import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class PickupBlock {
    mesh: THREE.Mesh;
    body: CANNON.Body;

    constructor(
        scene: THREE.Scene, 
        world: CANNON.World, 
        position: THREE.Vector3, 
        material: CANNON.Material
    ) {
        const size = 1.0;

        // 1. Visual Mesh (Three.js)
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.7 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // 2. Physics Body (Cannon.js)
        // Reverting to Box for stable stacking on floor.
        // Slightly reduced size (0.48) to prevent sticking/clipping with walls.
        const shape = new CANNON.Box(new CANNON.Vec3(size / 2 * 0.95, size / 2 * 0.95, size / 2 * 0.95));
        this.body = new CANNON.Body({
            mass: 5, 
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: material
        });
        this.body.angularDamping = 0.5; // Normal damping for box behavior

        // 3. UserData linking (Crucial for Player.ts interaction)
        this.mesh.userData = {
            isPickupable: true,
            physicsBody: this.body
        };

        // 4. Add to world
        scene.add(this.mesh);
        world.addBody(this.body);
    }

    // Update position/rotation from physics body to visual mesh
    update() {
        this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
        this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
    }
}