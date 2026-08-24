# SlotSync (Phase 1)

**SlotSync** is a Peer-to-Peer Tutoring Slot Negotiator web application. It connects students who need help with students (tutors) who have the time and knowledge to teach. 

This phase focuses on a lightweight, lightning-fast client-side application using a completely serverless `localStorage` database.

---

## Tech Stack

- **HTML5**: Semantic markup for accessible and SEO-friendly structure.
- **CSS3 (Vanilla)**: Custom styling using CSS variables, Flexbox, and CSS Grid. No external frameworks (like Tailwind or Bootstrap) were used to maintain maximum performance and customization.
- **JavaScript (Vanilla)**: Pure ES6+ JavaScript handling state management, UI rendering, routing, and a custom `localStorage` database abstraction.
- **Hosting/Deployment**: Netlify

---

## How to Run Locally (New Computer)

Because this app uses Vanilla JavaScript and `localStorage` as its database, you **do not** need a backend server, database server, or Node.js to run it! 

### Option 1: Direct File Execution (Simplest)
1. Clone or download this repository to your computer.
2. Open the `vanilla-tutorslot-app` folder.
3. Double click on `index.html` to open it in any modern web browser (Chrome, Edge, Firefox, Safari).
4. That's it!

### Option 2: Using a Local Web Server (Recommended)
If you want to avoid strict browser security policies related to `file://` protocols (though not strictly necessary for this app), you can serve it locally:

**Using Python:**
```bash
# Navigate to the app directory
cd path/to/peer-to-peer-tutoring-slot-negotiator/vanilla-tutorslot-app

# Start the server
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Using VS Code Live Server:**
1. Open the repository folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click on `vanilla-tutorslot-app/index.html` and select **"Open with Live Server"**.

---

## Deployment

This project is configured to be deployed easily on **Netlify**.
A `netlify.toml` file is included in the root directory to automatically route deployment to the `vanilla-tutorslot-app` folder.

1. Create a [Netlify](https://www.netlify.com/) account.
2. Click "Add new site" -> "Import an existing project".
3. Connect your GitHub repository.
4. Netlify will automatically detect the settings and deploy your site!

---

## Features Implemented

- **Role-based Dashboards**: Distinct interfaces and logic for Students and Tutors.
- **Dynamic Weekly Calendars**: Navigate week-by-week to set availability or book slots for specific dates.
- **Multi-Subject Support**: Tutors can select multiple subjects they are proficient in.
- **Group Sessions**: Tutors can define "Max Students per Slot" to allow multiple students to book the same time slot until capacity is reached.
- **Conflict Resolution**: The app prevents students from double-booking themselves and prevents tutors from double-booking slots.
- **Metrics**: Real-time tracking of "Hours Taught" and "Hours Learned".
