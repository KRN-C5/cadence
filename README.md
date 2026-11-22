# Cadence

### A self-winding treat roller that paces itself.

A concept product and website for dogs that are home alone. Cadence is a treat toy with **no batteries and no app**. The dog's own rolling winds a spring, and a governor releases one portion at a time.

Built for the **Happy While Away** hackathon.

<p align="center">
  <img src="docs/demo.gif" alt="Cadence concept video: a golden retriever nudges the roller and a treat appears in the slot" width="640" />
</p>

<p align="center">
  <a href="docs/cadence-demo.mp4"><b>Watch the full concept video</b></a>
  &nbsp;·&nbsp;
  <a href="docs/cadence-pitch-deck.pdf"><b>Read the pitch deck</b></a>
</p>

> The product images, the video and the numbers in this project are **concept renders and design targets**, not photographs or test results of a finished product.

---

## The product

<p align="center">
  <img src="docs/product-views.jpg" alt="Nine views of the Cadence roller: gauge cap, treat slot and fill cap" width="100%" />
</p>

| Part | What it does |
| --- | --- |
| **Gauge cap** | A watch-style dial shows how much energy is left in the spring |
| **Ribbed outer shell** | Soft-touch TPE shell, easy to grip and nudge |
| **Treat slot** | One sealed pocket lines up with the slot, and one portion falls |
| **Cartridge, rotor, regulator** | The rotor swings as the toy rolls and winds the spring. A governor lets it out slowly |
| **Fill cap** | Twist to open, sealed to keep |

**Design targets:** up to about 4 hours of release per fill, with a portion every 10 to 15 minutes, powered only by play.

---

## The idea in one comparison

Cadence is set against the rolling slow-feeder ball sold today.

| | Rolling slow-feeder ball | Cadence |
| --- | --- | --- |
| Treat release | Falls out as fast as the dog rolls it | Sealed pockets, one freed at a time |
| Pacing | Set by how hard the dog rolls | A governor holds each portion to 10 to 15 minutes |
| Power | None | Self-winds from the dog's own play |
| What is rewarded | Rolling until the ball is empty | Play winds the spring that funds the next treat |
| Built for | Mealtime fun | Dogs left alone for hours |

The full reasoning, the engagement comparison, the business model and the roadmap are in the **[pitch deck (PDF)](docs/cadence-pitch-deck.pdf)**. The editable file is [`docs/cadence-pitch-deck.pptx`](docs/cadence-pitch-deck.pptx).

---

## The website

An interactive single-page site that tells the product story.

- **Film and movement:** scroll-driven scenes of the toy rolling, with a treat sliding out of the slot
- **Mechanism:** a 3D model that pulls apart part by part as you scroll, and opens to any part you tap
- **Object:** a gallery of concept renders
- **Sizes:** Small, Medium and Large
- **Reservation checkout:** a clean order form with searchable country, state and city dropdowns

### Built with

- **Next.js** and **React** with TypeScript
- **Tailwind CSS**
- **Three.js** through **React Three Fiber** for the 3D mechanism and movement scenes
- **country-state-city** for the location search
- **Google Sheets** through **Google Apps Script** for storing orders
- Deployed on **Vercel**

---

## How reservations are stored

No payment is taken. Every reservation is a request for the first production run.

When someone presses **Place reservation**:

1. The form checks the details in the browser.
2. The server checks them again, then forwards the order to a private Google Apps Script web address.
3. The script adds a new row to a **Google Sheet** that only the owner can open.

So **every person who places a reservation is saved in the sheet automatically**, and the data is available on the backend for follow-up. Each row holds:

`Date` · `Order ID` · `Name` · `Email` · `Phone` · `Address` · `City` · `State` · `Country` · `PIN / Postal code` · `Size` · `Quantity` · `Notes`

The server only tells the visitor the reservation succeeded after the sheet confirms the row was written. The web address and the shared secret live in environment variables and are never exposed in the browser or committed to this repository.

---

## Run it locally

```bash
git clone https://github.com/KRN-C5/cadence.git
cd cadence
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To save reservations, create a `.env.local` file in the project root:

```bash
SHEET_WEBHOOK_URL=your-google-apps-script-web-app-url
SHEET_SECRET=your-shared-secret
```

Then deploy the Apps Script that appends rows to your own sheet. Without these two values, the checkout reports that reservations are unavailable instead of pretending to save.

---

## Project structure

```
app/                     pages and the /api/order route
components/              site sections (Hero, Film, Mechanism, Plates, Checkout…)
components/three/        3D roller model and scenes
lib/                     shared helpers and order validation
public/assets/           images and brand files
docs/                    demo video, product views and the pitch deck
```

---

## Notes

- Specifications, timings and prices are **design targets and proposals**, not tested numbers or market-tested prices.
- Dry kibble or small treats only, and supervise play.

---

## Author

**Kiran** — [LinkedIn](https://www.linkedin.com/in/krn-c5/) · [GitHub](https://github.com/KRN-C5)
