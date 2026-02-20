USERS: Add your `.glb` car models in this folder.
When you add a model (e.g., `porsche911.glb`), go to `public/config/cars.json` and add an entry:
{
  "id": "porsche911",
  "name": "Porsche 911 GT3",
  "url": "/assets/cars/porsche911.glb",
  "mapping": {
    "bodyPaintMeshes": ["Paint", "BodySurface"],
    "rimMeshes": ["Rim_FL", "Rim_FR", "Rim_RL", "Rim_RR"],
    "doorLeft": ["DoorLeftParentNode"]
  }
}
If names aren't mapped properly, the parts won't animate or color correctly. Check your GLTF node names using a viewer like https://gltf-viewer.donmccurdy.com/.
