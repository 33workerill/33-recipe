# Images and live preview

## Local image storage

IndexedDB database `33-recipe` is upgraded from version 1 to version 2. The existing `recipes` object store is retained. The new `images` store keeps `{ id, recipeId, blob }` records and has a non-unique `recipeId` index. `Recipe.assets` stores only `MediaAsset` metadata; image bytes are never encoded into recipe JSON or localStorage.

Image IDs equal their `MediaAsset.id`. The editor validates JPEG, PNG and WebP input up to 20 MB, decodes it with the browser, respects decoded orientation, and resizes the longest edge to at most 2400 pixels without cropping. PNG stays PNG; JPEG and WebP input are normalized to JPEG. HEIC/HEIF is rejected with a conversion hint when unsupported.

The recipe metadata and image Blob are written in the same IndexedDB transaction. A SHA-256 fingerprint prevents repeated imports of the same file into the same role from creating duplicate image records; step links can reuse the stored image. Cover replacement also removes the old image in that transaction. Removing a recipe deletes all images indexed to that recipe atomically. Duplicating a recipe generates new asset IDs and independent Blob copies. Object URLs are created only for the active recipe and revoked when its image set changes or the editor unmounts.

## Preview

`PreviewPanel` renders the current React recipe state. Physical layout is measured after fonts and images load; the shared DOM paginator places complete content, splits oversized text without loss, and checks every page before displaying it. All formats except Long Note have fixed boundaries. Screen zoom changes only the display. Six visual styles and Duplex sides share the same pagination engine. See `STYLES_AND_LAYOUTS.md` for the browser regression matrix.

Presentation settings and presets are stored separately from Recipe Data. The editor owns the shared settings in section 06 and updates the preview immediately. Changing the application's light/dark theme does not recolor the recipe page. Preview geometry is not a promise of file export, printer registration/duplex flip, or A4-to-A5 book imposition; those remain Phase 08.

## Backup and restore

The existing JSON backup contains recipes and media metadata only. It does not include image files. This is called out in Settings; keep source photos separately. Restoring a JSON backup whose photos are absent keeps valid metadata and presents an unavailable-image state rather than a broken preview. A portable archive will be addressed with the future export work.

## Recovery notes

The v1-to-v2 upgrade adds the image store without clearing the existing recipe store or changing the Recipe schema version. If storage is full or the browser rejects a write, the transaction fails and the UI reports the error instead of marking the image saved. Users can download JSON for recipe text and should keep their original photo files until a future image archive is available.
