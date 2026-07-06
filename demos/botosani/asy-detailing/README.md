# LimeSpark — Local Business Template

Un template premium, rapid și **complet reutilizabil** pentru business-uri locale.
Construit cu **HTML + CSS + Vanilla JS**. Fără React, fără build tools, fără dependențe.

Pentru un client nou modifici **doar 3 lucruri**:

1. `content.json` — toate textele și datele
2. `tokens.json` — toate culorile, fonturile, spacing-ul
3. `assets/` — imaginile

Nimic nu e hardcodat în `index.html`, `styles.css` sau `script.js`.

---

## 📁 Structură

```
template-detailing/
├── index.html      # scheletul semantic (nu conține text de business)
├── styles.css      # tot stilul, doar prin var(--...) din tokens
├── script.js       # motorul: încarcă JSON, generează secțiunile, interacțiuni
├── content.json    # ← EDITEZI: texte, servicii, recenzii, FAQ, contact...
├── tokens.json     # ← EDITEZI: culori, tipografie, spacing, radius, umbre
├── assets/         # ← ÎNLOCUIEȘTI: imagini (hero, before/after, galerie, avatare)
└── README.md
```

---

## 🚀 Cum îl rulezi

Fișierele JSON se încarcă prin `fetch`, deci **trebuie servit printr-un server local**
(nu merge deschis direct cu `file://`). Orice server static funcționează:

```bash
# Python
python3 -m http.server 8000

# sau Node
npx serve .
```

Apoi deschide `http://localhost:8000`.

---

## 🎨 Personalizare pentru un client nou

### 1. Culori & stil → `tokens.json`
Fiecare valoare devine automat o variabilă CSS. Convenția e simplă:
o valoare la `color.brand` devine `--color-brand`, `spacing.lg` devine `--spacing-lg` etc.

Vrei alt brand? Schimbă doar câteva valori:

```json
"color": {
  "brand": "#0B0B0C",       // butoane principale, accente ink
  "brand-contrast": "#FFFFFF",
  "accent": "#C7F94B",       // culoarea de highlight (LimeSpark)
  "bg": "#FBFBF9"            // fundalul paginii
}
```

Poți schimba și fontul dintr-o linie (`font.sans`), radius-ul colțurilor,
intensitatea umbrelor sau viteza animațiilor — totul se propagă în tot site-ul.

### 2. Conținut → `content.json`
Editezi textele, adaugi/ștergi servicii, recenzii, întrebări FAQ, poze în galerie.
`script.js` regenerează automat fiecare secțiune din listele din JSON — adaugi un
obiect în `services.items` și apare un card nou, fără să atingi HTML/CSS.

Câmpuri cheie de business:
```json
"business": {
  "name": "Lumen",
  "phone": "+40 712 345 678",
  "whatsapp": "40712345678",   // fără +, fără spații — pentru linkul wa.me
  "email": "contact@lumenstudio.ro",
  "mapsUrl": "https://maps.google.com/?q=..."
}
```

### 3. Imagini → `assets/`
Înlocuiește fișierele `.svg` cu pozele reale (`.jpg`/`.webp` recomandat).
Actualizează căile în `content.json` dacă schimbi denumirile.
Placeholder-ele livrate sunt SVG-uri generate, ca template-ul să arate complet din prima.

---

## 🔗 WhatsApp automat
Toate butoanele „Cere o ofertă” și butonul flotant generează automat un link
`https://wa.me/<număr>?text=<mesaj>` pe baza `business.whatsapp` și a mesajelor din
`content.json`. Un CTA se marchează în JSON cu `"action": "whatsapp"` (sau `"phone"`).

---

## 🧩 Secțiuni incluse
Hero · Servicii · Before/After (slider interactiv) · Proces · Beneficii ·
Galerie (cu lightbox) · Recenzii · FAQ (accordion) · CTA · Contact · Footer
· buton flotant WhatsApp.

## ✨ Interacțiuni
- Scroll reveal subtil (IntersectionObserver, respectă `prefers-reduced-motion`)
- Slider before/after cu drag & hover
- Accordion FAQ single-open
- Lightbox galerie
- Header care își schimbă starea la scroll
- Meniu mobil

---

## ♻️ Cum creezi un template nou pornind de aici
Copiază folderul (ex. `template-restaurant/`), apoi schimbă `content.json`,
`tokens.json` și `assets/`. Structura, CSS-ul și motorul JS rămân neatinse —
asta e ideea unui design system reutilizabil.

> Design de **LimeSpark Development**.
