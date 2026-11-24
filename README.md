# Kolekta prototype

## Project files

Upload the whole project folder, keeping its folder structure. `index.html` is
the entry page; it loads the styles, scripts, and images from the folders beside
it.

```text
index.html
css/
  styles.css
js/
  state.js
  views.js
  actions.js
  helpers.js
  assignee.js
  maps.js
  barangay-map-page.js
  images.js
  sample-data.js
  main.js
assets/
  images/
```

## Where the JavaScript functions are organized

- `state.js` holds the shared app state, schedules, and route-stop data.
- `views.js` builds the resident and barangay official screens.
- `actions.js` handles schedule edits, reports, and announcements.
- `barangay-map-page.js` renders the collection map, route markers, and status
  controls.
- `maps.js` supports the report-location maps.
- `helpers.js` contains shared rendering and utility functions.
- `assignee.js` manages driver and crew fields.
- `images.js` and `sample-data.js` load prototype images and sample reports.
- `main.js` starts the app.

## Publish with GitHub Pages

1. Create an empty repository on GitHub.
2. In VS Code, open this project folder in a terminal and run:

   ```sh
   git init
   git add index.html README.md css js assets
   git commit -m "Add Kolekta prototype"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

3. On GitHub, open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select
   `main` and `/ (root)`, then save.
5. Open the Pages URL shown there. It will usually look like
   `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

The map uses online Leaflet and Esri map resources, so visitors need an internet
connection. This prototype keeps changes in the current browser session; it
does not yet synchronize data between different users or devices.
