import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function readThemeColor(varName, fallbackHsl) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallbackHsl;
  const [h, s, l] = raw.split(' ').map(v => parseFloat(v));
  return new THREE.Color(`hsl(${h}, ${s}%, ${l}%)`);
}

function buildGeometry(shape) {
  const d = shape.dims;
  switch (shape.type) {
    case 'sphere': return new THREE.SphereGeometry(Math.max(d.r, 0.01), 24, 16);
    case 'cylinder': return new THREE.CylinderGeometry(Math.max(d.r, 0.01), Math.max(d.r, 0.01), Math.max(d.h, 0.01), 24);
    case 'cone': return new THREE.ConeGeometry(Math.max(d.r, 0.01), Math.max(d.h, 0.01), 24);
    case 'pyramid': return new THREE.ConeGeometry(Math.max(Math.max(d.w, d.dep) / Math.SQRT2, 0.01), Math.max(d.h, 0.01), 4);
    case 'torus': return new THREE.TorusGeometry(Math.max(d.R, 0.01), Math.max(d.r, 0.01), 16, 32);
    case 'hemisphere': return new THREE.SphereGeometry(Math.max(d.r, 0.01), 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    case 'prism': {
      const geom = new THREE.CylinderGeometry(Math.max(d.w, 0.01) / 2, Math.max(d.w, 0.01) / 2, Math.max(d.dep, 0.01), 3);
      geom.rotateY(Math.PI / 6);
      geom.scale(1, Math.max(d.h, 0.01) / Math.max(d.w, 0.01), 1);
      return geom;
    }
    case 'box':
    default: return new THREE.BoxGeometry(Math.max(d.w, 0.01), Math.max(d.h, 0.01), Math.max(d.dep, 0.01));
  }
}

const MIN_DIST = 2, MAX_DIST = 30;
const touchDist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
const touchMid = (touches) => ({ x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 });

export default function Composite3DViewer({ shapes, t }) {
  const containerRef = useRef(null);
  const stateRef = useRef({});
  const rebuildRef = useRef(() => {});

  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth, height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(4, 3, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const group = new THREE.Group();
    scene.add(group);

    const target = new THREE.Vector3(0, 0, 0);
    let targetDist = camera.position.distanceTo(target);
    let rotating = false, panning = false, pinching = false, lastX = 0, lastY = 0;
    let velX = 0, velY = 0;
    let pinchStartDist = 0, pinchStartTargetDist = 0, pinchMid = { x: 0, y: 0 };

    const panBy = (dx, dy) => {
      const panSpeed = 0.002 * camera.position.distanceTo(target);
      const camRight = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
      const camUp = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
      const offset = camRight.multiplyScalar(-dx * panSpeed).add(camUp.multiplyScalar(dy * panSpeed));
      camera.position.add(offset);
      target.add(offset);
      camera.lookAt(target);
    };

    const onContextMenu = (e) => e.preventDefault();
    const onDown = (e) => {
      if (e.button === 2 || e.shiftKey) panning = true; else rotating = true;
      velX = 0; velY = 0;
      lastX = e.clientX; lastY = e.clientY;
    };
    const onUp = () => { rotating = false; panning = false; };
    const onMove = (e) => {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (rotating) {
        velX = dx * 0.01; velY = dy * 0.01;
        group.rotation.y += velX;
        group.rotation.x += velY;
      } else if (panning) {
        panBy(dx, dy);
      }
      lastX = e.clientX; lastY = e.clientY;
    };
    const onWheel = (e) => {
      e.preventDefault();
      targetDist = THREE.MathUtils.clamp(targetDist + e.deltaY * 0.01, MIN_DIST, MAX_DIST);
    };

    // Touch: one finger rotates, two fingers pinch-zoom and pan together
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        pinching = false;
        rotating = true;
        velX = 0; velY = 0;
        lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        rotating = false;
        pinching = true;
        pinchStartDist = touchDist(e.touches);
        pinchStartTargetDist = targetDist;
        pinchMid = touchMid(e.touches);
      }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if (pinching && e.touches.length === 2) {
        const dist = touchDist(e.touches);
        const scale = pinchStartDist / Math.max(dist, 1);
        targetDist = THREE.MathUtils.clamp(pinchStartTargetDist * scale, MIN_DIST, MAX_DIST);

        const mid = touchMid(e.touches);
        panBy(mid.x - pinchMid.x, mid.y - pinchMid.y);
        pinchMid = mid;
      } else if (rotating && e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY;
        velX = dx * 0.01; velY = dy * 0.01;
        group.rotation.y += velX;
        group.rotation.x += velY;
        lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length === 0) { rotating = false; pinching = false; }
      else if (e.touches.length === 1) { pinching = false; rotating = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
    };

    renderer.domElement.addEventListener('mousedown', onDown);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);
    renderer.domElement.addEventListener('touchcancel', onTouchEnd);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);

      // Smooth zoom toward target distance
      const curDist = camera.position.distanceTo(target);
      if (Math.abs(curDist - targetDist) > 0.001) {
        const dir = new THREE.Vector3().subVectors(camera.position, target).normalize();
        const newDist = THREE.MathUtils.lerp(curDist, targetDist, 0.2);
        camera.position.copy(target).add(dir.multiplyScalar(newDist));
      }

      if (rotating || panning || pinching) {
        // active interaction — no idle spin, no inertia yet
      } else if (Math.abs(velX) > 0.0002 || Math.abs(velY) > 0.0002) {
        // inertial spin after release
        group.rotation.y += velX;
        group.rotation.x += velY;
        velX *= 0.92;
        velY *= 0.92;
      } else {
        group.rotation.y += 0.004;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    stateRef.current = { scene, camera, renderer, group };

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousedown', onDown);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      renderer.domElement.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const rebuild = () => {
      const { group } = stateRef.current;
      if (!group) return;
      [...group.children].forEach(child => {
        group.remove(child);
        child.geometry.dispose();
        child.material.dispose();
      });

      const primaryColor = readThemeColor('--primary', '217 91% 60%');
      const destructiveColor = readThemeColor('--destructive', '0 72% 58%');
      shapes.forEach((shape, i) => {
        const geometry = buildGeometry(shape);
        const isSubtract = shape.op === 'subtract';
        const material = new THREE.MeshStandardMaterial({
          color: isSubtract ? destructiveColor : primaryColor,
          transparent: isSubtract,
          opacity: isSubtract ? 0.4 : 0.9,
          wireframe: isSubtract,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = (i - (shapes.length - 1) / 2) * 2.2;
        group.add(mesh);
      });
    };
    rebuildRef.current = rebuild;
    rebuild();
  }, [shapes]);

  useEffect(() => {
    const onSkinChange = () => rebuildRef.current();
    window.addEventListener('skinchange', onSkinChange);
    return () => window.removeEventListener('skinchange', onSkinChange);
  }, []);

  return (
    <div>
      <div ref={containerRef} className="w-full" style={{ height: 280, cursor: 'grab' }} />
      <p className="text-[10px] text-center mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {t ? t('compositeControlsHint') : 'Drag to rotate · Shift/right-drag to pan · Scroll to zoom'}
      </p>
    </div>
  );
}