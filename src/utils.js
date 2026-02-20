import * as THREE from 'three';

export function normalizeModelScale(model, targetLength = 5) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const length = Math.max(size.x, size.y, size.z);
  const scale = targetLength / length;

  model.scale.set(scale, scale, scale);

  // Center model
  const center = new THREE.Vector3();
  box.getCenter(center);
  center.multiplyScalar(scale);
  model.position.sub(center);
  // Keep it resting on Y=0
  model.position.y += (size.y * scale) / 2;

  return { scale, center };
}

export function findMeshByName(root, nameList) {
  let found = [];
  root.traverse((child) => {
    if (child.isMesh) {
      const matchName = nameList.some(name => child.name.toLowerCase().includes(name.toLowerCase()));

      let matchMat = false;
      if (child.material) {
        if (Array.isArray(child.material)) {
          matchMat = child.material.some(mat => nameList.some(n => mat.name && mat.name.toLowerCase().includes(n.toLowerCase())));
        } else {
          matchMat = nameList.some(n => child.material.name && child.material.name.toLowerCase().includes(n.toLowerCase()));
        }
      }

      if (matchName || matchMat) {
        found.push(child);
      }
    }
  });
  return found;
}

export function createPivotPoint(mesh, position) {
  if (!mesh) return null;
  const pivot = new THREE.Group();
  mesh.parent.add(pivot);
  pivot.position.copy(position);
  pivot.add(mesh);
  mesh.position.sub(position);
  return pivot;
}

export function autoGuessHinge(mesh, edge) {
  // edge: 'left', 'right', 'top', 'bottom', 'front', 'rear'
  const box = new THREE.Box3().setFromObject(mesh);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);

  const pivotPos = center.clone();

  switch (edge) {
    case 'left': pivotPos.x = box.max.x; break; // object left (from driver seat)
    case 'right': pivotPos.x = box.min.x; break;
    case 'top': pivotPos.y = box.max.y; break;
    case 'front': pivotPos.z = box.min.z; break;
    case 'rear': pivotPos.z = box.max.z; break;
  }

  return createPivotPoint(mesh, pivotPos);
}
