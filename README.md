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
├── index.html          # Home page with segmented dial chooser
├── card.html           # The Card edition (flip card)
├── moments.html        # Moments edition (timeline)
├── message.html        # The Letter edition (message card)
├── wish.html           # The Wish edition (clickable wish cards)
├── css/
│   └── style.css       # All styling + four theme variants
├── js/
│   └── main.js         # Dial logic, page interactions, sound, particles
├── assets/             # Place images, photos, or audio here
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
    { id: 'card', label: 'The Card', subtitle: '...', page: 'card.html', theme: 'theme-card', icon: '&#9825;', color: '#c9a06a', angle: 0 },
    // ...
];
```

You can change labels, subtitles, icons, and colors here.

### Change Theme Colors

Edit `css/style.css` — modify the theme blocks:

```css
.theme-card {
    --theme-primary: #d4a574;
    --theme-soft: #e8c79a;
    --theme-dim: rgba(212, 165, 116, 0.12);
    --theme-glow: rgba(212, 165, 116, 0.25);
    --theme-bg-start: #1a1510;
    --theme-bg-end: #0f0d0c;
}
```

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
