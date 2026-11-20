# Sorpresa · estructura y puesta en marcha

```
cynthia/
 ├─ index.html        ← lo que ve ella (sin panel)
 ├─ admin.html        ← tu panel principal (solo para ti)
 ├─ css/style.css
 ├─ js/app.js         ← lógica compartida (render, música, película, minijuego)
 ├─ js/admin.js       ← panel + subida/publicación a GitHub
 ├─ data/config.json  ← TODO el contenido (textos, razones, rutas de fotos)
 ├─ img/  audio/  video/   ← se crean solos al subir archivos
 └─ README.md
```

## 1. Subir al repo
1. Crea un repositorio y sube la carpeta `cynthia/` (arrastrar y soltar en la web de GitHub sirve).
2. **Settings → Pages → Deploy from a branch → `main` / root**.
3. Enlaces: `https://USUARIO.github.io/REPO/cynthia/` (visor) y `.../cynthia/admin.html` (panel).

## 2. Crear el token (una sola vez)
GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate:
- Repository access: **solo el repo de la sorpresa**.
- Permissions → **Contents: Read and write**.

## 3. Conectar el panel
Abre `admin.html` → ✎ Editar → sección **9 · GitHub y publicar**. Usuario, repo y carpeta se rellenan solos en github.io; pega el token y pulsa **Probar conexión**. El token queda solo en tu navegador, nunca en el repo.

## 4. Flujo de trabajo
- Elegir una foto/MP3/video la **comprime y la sube como archivo** a `img/`, `audio/` o `video/`.
- Los textos se guardan como borrador local mientras editas.
- **🚀 Publicar** sube `data/config.json`. En ~1 min se ve en el enlace (Ctrl+F5).
- Cambiar `index.html`, `css/` o `js/` **no toca** `config.json` ni las fotos: ya no se pierde nada al actualizar el código.

## Sin token (modo manual)
Cada foto se descarga ya optimizada: súbela a `img/` desde GitHub. Con **⬇ Bajar config.json** reemplazas `data/config.json` a mano.

## Notas
- Con doble clic en el archivo no carga (`fetch` necesita servidor). Prueba local: `python -m http.server` dentro de la carpeta.
- Repo público = fotos y cartas visibles para quien vea el repo. Para algo privado usa repo privado + Netlify/Cloudflare Pages.
- Las fotos reemplazadas quedan en `img/`; bórralas desde GitHub si quieres liberar espacio.
- Límites del panel: audio 25 MB, video 50 MB.
