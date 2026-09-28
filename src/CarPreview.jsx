import { useEffect, useRef } from "react";
import * as THREE from "three";

const SHAPES = {
  model3: { length: 4.7, width: 1.86, height: 1.3, cabin: 0.86, nose: 0.68 },
  modely: { length: 4.75, width: 1.92, height: 1.55, cabin: 1.05, nose: 0.62 },
  models: { length: 5.02, width: 1.96, height: 1.28, cabin: 0.8, nose: 0.78 },
  modelx: { length: 5.04, width: 2, height: 1.62, cabin: 1.08, nose: 0.66 },
  cybertruck: { length: 5.5, width: 2.02, height: 1.65, cabin: 1, nose: 0.72, angular: true },
};

function roundedBox(width, height, depth, radius = .18) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y); shape.lineTo(x + width - radius, y); shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius); shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius); shape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: radius * .45, bevelThickness: radius * .45, bevelSegments: 3 });
  geometry.center(); return geometry;
}

export default function CarPreview({ textureCanvas, textureRevision, model, autoRotate }) {
  const mount = useRef(null);
  const state = useRef({ yaw: -.65, pitch: .22, dragging: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    const host = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xddddda);
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    camera.position.set(7, 3.4, 7);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const world = new THREE.Group(); scene.add(world);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x77776f, 2.6); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 4); key.position.set(4, 7, 5); key.castShadow = true; scene.add(key);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: 0x000000, opacity: .16 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.92; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(20, 30, 0xc7c7c1, 0xd2d2cc); grid.position.y = -.91; scene.add(grid);
    const resize = () => { const { width, height } = host.getBoundingClientRect(); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    let frame; const animate = () => { frame = requestAnimationFrame(animate); if (autoRotate && !state.current.dragging) state.current.yaw += .003; world.rotation.y = state.current.yaw; world.rotation.x = state.current.pitch; renderer.render(scene, camera); }; animate();
    const down = (e) => { state.current.dragging = true; state.current.lastX = e.clientX; state.current.lastY = e.clientY; renderer.domElement.setPointerCapture(e.pointerId); };
    const move = (e) => { if (!state.current.dragging) return; state.current.yaw += (e.clientX-state.current.lastX)*.008; state.current.pitch = Math.max(-.1, Math.min(.55,state.current.pitch+(e.clientY-state.current.lastY)*.005)); state.current.lastX=e.clientX;state.current.lastY=e.clientY; };
    const up = () => { state.current.dragging = false; };
    renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointermove",move);renderer.domElement.addEventListener("pointerup",up);
    host._three = { scene, world, renderer, camera };
    return () => { cancelAnimationFrame(frame); observer.disconnect(); renderer.dispose(); host.removeChild(renderer.domElement); delete host._three; };
  }, [autoRotate]);

  useEffect(() => {
    const world = mount.current?._three?.world; if (!world || !textureCanvas) return;
    while (world.children.length) { const child=world.children.pop(); child.geometry?.dispose(); child.material?.dispose(); }
    const s = SHAPES[model]; const texture = new THREE.CanvasTexture(textureCanvas); texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=8;
    const paint = new THREE.MeshPhysicalMaterial({ map:texture, roughness:.34, metalness:.18, clearcoat:.75, clearcoatRoughness:.2 });
    const glass = new THREE.MeshPhysicalMaterial({ color:0x27302e, roughness:.08, metalness:.25, transmission:.15 });
    const dark = new THREE.MeshStandardMaterial({ color:0x151716, roughness:.5, metalness:.55 });
    const body = new THREE.Mesh(roundedBox(s.length,.64,s.width,.22),paint); body.position.y=-.15;body.castShadow=true;world.add(body);
    const hood = new THREE.Mesh(roundedBox(s.length*.27,.18,s.width*.9,.11),paint);hood.rotation.z=-.035;hood.position.set(s.length*.34,.23,0);world.add(hood);
    const cabinGeometry = s.angular ? new THREE.CylinderGeometry(s.width*.53,s.width*.7,s.cabin*2.15,4,1,false,Math.PI/4) : new THREE.SphereGeometry(1,48,24);
    const cabin = new THREE.Mesh(cabinGeometry,glass); if(s.angular){cabin.rotation.z=Math.PI/2;cabin.scale.set(1,.9,1)}else{cabin.scale.set(s.length*.27,s.cabin*.72,s.width*.72)} cabin.position.set(-s.length*.06,.53,0);cabin.castShadow=true;world.add(cabin);
    const roof = new THREE.Mesh(roundedBox(s.length*.34,.08,s.width*.72,.08),paint);roof.position.set(-s.length*.12,s.cabin*.76,0);world.add(roof);
    for(const x of [-s.length*.31,s.length*.31]) for(const z of [-s.width*.52,s.width*.52]) { const tire=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.22,32),dark);tire.rotation.x=Math.PI/2;tire.position.set(x,-.48,z);tire.castShadow=true;world.add(tire);const rim=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.235,10),new THREE.MeshStandardMaterial({color:0xaeb2ad,metalness:.8,roughness:.25}));rim.rotation.x=Math.PI/2;rim.position.copy(tire.position);world.add(rim); }
    const lightMat=new THREE.MeshStandardMaterial({color:0xe9ffda,emissive:0xcfffbe,emissiveIntensity:1.5}); for(const z of [-s.width*.34,s.width*.34]){const lamp=new THREE.Mesh(new THREE.BoxGeometry(.09,.13,.36),lightMat);lamp.position.set(s.length*.505,.02,z);world.add(lamp)}
    world.rotation.y=state.current.yaw;
    return () => texture.dispose();
  }, [textureCanvas, textureRevision, model]);

  return <div ref={mount} className="three-canvas absolute inset-0 cursor-grab active:cursor-grabbing" aria-label="Interactive 3D vehicle preview" />;
}
