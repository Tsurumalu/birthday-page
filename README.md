# Birthday Gift Website

A personalized birthday gift website with a multi-edition segmented dial, inspired by editorial portfolio design.

## Features

- **Home chooser**: a large segmented dial with four colored editions
- **Theme switching**: rotating the dial changes the page background, title, and accent color in real time
- **Four independent pages**, each with its own color theme:
  - **The Card** — interactive flip birthday card (gold)
  - **Moments** — timeline of shared memories (rose)
  - **The Letter** — heartfelt message card (sage)
  - **The Wish** — clickable wish cards (midnight blue)
- Interactive dial controls: drag, touch, scroll wheel, arrow keys, left/right buttons, or click labels
- Ambient sound toggle (Web Audio API)
- Floating particle effects
- Scroll reveal animations
- Fully responsive
- No external dependencies (pure HTML/CSS/JS)

## Project Structure

```
birthday-gift/
├── index.html          # Home page — the edition dial (per-edition colour, texture, display type)
├── moments.html        # Moments edition (journey map / stamp collage)
├── message.html        # The Letter edition (desk room + locked letter)
├── games.html          # Games edition (arcade map)  → games-3d.html (3D island)
├── musics.html         # Music edition (in-car cassette player)
├── cards.html          # The Cards edition (leave a note)
├── place.html          # Detail page for a single moment (?place=<id>)
├── css/
│   └── style.css       # All styling + one theme block per edition
├── js/
│   └── main.js         # Dial logic, page interactions, sound, particles
├── assets/             # Images, models, audio
├── .gitignore
├── LICENSE
├── README.md
└── _config.yml         # GitHub Pages config
```

## Getting Started

### Run Locally

Just open `index.html` in your browser. Or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node
npx serve
```

Then visit `http://localhost:8000`.

### Deploy to GitHub Pages

1. **Create a new GitHub repository**
   - Go to [github.com/new](https://github.com/new)
   - Name it (e.g., `birthday-gift`)
   - Set to **Public** (required for free GitHub Pages)
   - Don't initialize with README (you already have one)

2. **Push your code**
   ```bash
   git init
   git add .
   git commit -m "Initial birthday gift site"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/birthday-gift.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repo **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Choose **main** branch and **/ (root)** folder
   - Click **Save**

4. **Wait 1-2 minutes**, then visit:
   ```
   https://YOUR_USERNAME.github.io/birthday-gift/
   ```

## Customization Guide

### Change Edition Names / Text

Edit `js/main.js` — find the `editions` array near the top:

```js
var editions = [
    {
        id: 'story',
        label: 'Moments',
        subtitle: 'The chapters of us, from the beginning.',
        page: 'moments.html',
        theme: 'theme-story',
        color: '#c8614a',          // wedge + label + particle tint on the dial
        icon: iconSvg('<rect .../>')
    },
    // ...
];
```

You can change labels, subtitles, icons, and colors here. The dial spreads the
editions evenly around the ring (order = clockwise from the top marker).

### Change Theme Colors

Edit `css/style.css` — each edition owns one block. Alongside the palette it
carries the chooser's display type and backdrop texture:

```css
.theme-story {
    --theme-primary: #c8614a;
    --theme-soft: #e39179;
    --theme-dim: rgba(200, 97, 74, 0.14);
    --theme-glow: rgba(200, 97, 74, 0.32);
    --theme-bg-start: #3a1410;
    --theme-bg-mid: #1b0f0e;
    --theme-bg-end: #0b0808;

    --home-display: 'Cormorant Garamond', Georgia, serif;
    --home-display-weight: 400;
    --home-display-case: none;
    --home-tex: repeating-linear-gradient(0deg, rgba(255,255,255,.032) 0 1px, transparent 1px 4px);
}
```

### Chooser Keyboard Shortcuts

`←` `→` turn the dial · `↵` enter the selected edition · `R` randomise.

### Add or Remove Editions

1. Update the `editions` array in `js/main.js`
2. Add matching CSS theme class in `css/style.css`
3. Create a new `.html` page for the edition
4. Add links to the new page in the navigation of every HTML file

### Add Photos

1. Place images in the `assets/` folder
2. Reference them in HTML:
   ```html
   <img src="assets/photo.jpg" alt="A memory" />
   ```
3. Or set them as backgrounds in CSS:
   ```css
   .card-front {
       background-image: url('../assets/photo.jpg');
   }
   ```

### Change the Birthday Music

The site uses Web Audio API to generate a soft ambient pad sound. To use a real music file instead:

1. Add your audio file to `assets/` (e.g., `assets/song.mp3`)
2. In `js/main.js`, replace the `createAmbientSound` function with:
   ```js
   var audio = new Audio('assets/song.mp3');
   audio.loop = true;
   audio.volume = 0.3;
   audio.play();
   ```

## Tech Stack

- HTML5
- CSS3 (Custom Properties, Grid, Flexbox, SVG, Animations)
- Vanilla JavaScript (ES5/ES6)
- Web Audio API
- Canvas API
- IntersectionObserver API

## License

MIT — see [LICENSE](LICENSE) file.
