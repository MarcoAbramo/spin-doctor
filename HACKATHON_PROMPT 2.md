# Hackathon-Prompt: „Spin Doctor“ – ein satirisches Idle-Game

Arbeitstitel: **Spin Doctor – Pressesprecher der Republik Superbia**

---

## 0. So arbeitest du

- Du hast **2 Stunden**. Lies diesen Prompt komplett, lege dann eine Task-Liste an (max. 12 Punkte, entlang der Phasen in Abschnitt 8) und leg los.
- Stelle keine Rückfragen, außer du bist wirklich blockiert. Triff sinnvolle Default-Entscheidungen und halte die wichtigen kurz als ADR in `docs/adr/` fest.
- **`main` ist immer spielbar.** Lieber wenige Features, die funktionieren, als viele halbe. Wenn die Zeit knapp wird, kürze beim Polish, nie am spielbaren Build.
- Arbeite in Feature-Branches, committe klein und oft (Conventional Commits) und merge jede fertige Phase per Squash nach `main`.
- Schreibe Code, Kommentare, Commit-Messages, Issues und Doku auf **Englisch**, denn es soll ein internationales Open-Source-Projekt werden. Spieltexte schreibst du zuerst auf **Deutsch**, aber von Anfang an über i18n-Dateien (`locales/de.json`).
- Wo Aufgaben unabhängig voneinander sind (z. B. Spieltexte schreiben vs. Kern-Loop bauen), darfst du Subagents parallel einsetzen.

---

## 1. Das Spiel in einem Satz

Ein mobile-first Idle-Game im Browser: Du bist der frisch eingestellte Pressesprecher des fiktiven, machthungrigen Präsidenten Magnus Rekord und musst jeden Skandal schönreden. Dabei siehst du zu, wie du mit jedem Upgrade die Demokratie der Republik Superbia ein Stück weiter aushöhlst.

Die Pointe ist die Mechanik selbst: Das Spiel belohnt dich für genau die Machttechniken, die es kritisiert. Der Humor ist trocken und ironisch, im Geist von „Yes Minister“, „Veep“ oder der „heute-show“, also klug statt plump.

---

## 2. Leitplanken für die Satire (verbindlich, gehören auch in CONTRIBUTING.md)

1. **Alles ist fiktiv:** Land, Präsident, Parteien, Medien und Figuren. Keine echten Namen, Fotos, Karikaturen oder erfundenen Zitate realer Personen, keine echten Parteien oder Marken.
2. **Ziel der Satire sind Machttechniken und der Abbau von Institutionen:** Ablenkungsmanöver, Loyalitätstests, Medien als Feindbild, Rekordbehauptungen, Vetternwirtschaft, Dekrete, Umbesetzung von Gerichten. Das sind Techniken, die man weltweit aus den Nachrichten kennt.
3. **Nach oben treten, nie nach unten:** keine Witze über Wählergruppen, Minderheiten, Herkunft, Religion, Aussehen oder Behinderungen.
4. **Aktuelles darf inspirieren**, wird aber immer fiktionalisiert und verallgemeinert.
5. **Lexikon-Karten** (siehe 4.5) sind sachlich, parteipolitisch neutral und nennen eine Quelle. Jede neue Karte bekommt das Label `needs-fact-check`.

---

## 3. Welt & Story

- **Republik Superbia** (lat. *superbia* = Hochmut).
- **Präsident Magnus Rekord:** Hält alles, was er tut, für einen Weltrekord und postet bevorzugt ohne Absprache.
- **Du:** der neue Pressesprecher (Name frei wählbar). Dein Vorgänger hat nach drei Tagen gekündigt – per Brieftaube, weil sein Handy konfisziert wurde.
- **Dr. Frieda Nachfrage:** investigative Journalistin beim kleinen, unabhängigen „Superbia-Boten“. Stellt immer die eine Frage zu viel.
- **Konstantin Rekord:** Neffe des Präsidenten, Minister für Alles.
- **Die Opposition:** tagt in einem Kellerraum ohne WLAN, den ihr das Innenministerium zugewiesen hat.

**Storyline in Akten** (im MVP nur Akt 1, der Rest wird zu Issues):

- **Akt 1 – „Die ersten 100 Tage“:** Das Onboarding ist die Story. Erster Auftrag: Erkläre der Presse, warum der Geburtstag des Präsidenten ab sofort ein dreitägiger Nationalfeiertag ist – „als Sparmaßnahme“.
- **Akt 2 – „Der große Skandal“** (Issue)
- **Akt 3 – „Die Wahl“** (Issue): mehrere Enden je nach Spielwerten, z. B. Whistleblower-Ende, „Ewiger Pressesprecher“, „Demokratie gerettet (trotz dir)“.
- **Prestige „Neue Amtszeit“** (Issue): Der Präsident ändert die Verfassung für eine weitere Amtszeit. Das setzt den Fortschritt zurück und gibt einen dauerhaften „Personenkult“-Bonus.

---

## 4. Gameplay (MVP)

### 4.1 Ressourcen & Werte

- **Spin:** die Hauptwährung. Entsteht durch Tippen („Statement abgeben“) und idle durch Generatoren.
- **Umfragewerte** (0–100 %): Multiplikator auf die Spin-Produktion. Sie steigen durch Spin-Aktionen und fallen durch Skandale.
- **Demokratie-Index** (100 → 0): sinkt mit bestimmten Upgrades. Wird als Balken angezeigt, der optisch zerbröckelt. Beeinflusst später die Enden und schaltet Lexikon-Karten frei.

### 4.2 Generatoren

Die Kosten steigen um den Faktor 1,15 pro Kauf. Die Werte unten sind Startwerte fürs Balancing.

| # | Generator | Grundkosten | Spin/s |
|---|-----------|------------:|-------:|
| 1 | Praktikant mit Diensthandy | 15 | 0,1 |
| 2 | Talkshow-Dauergast | 100 | 1 |
| 3 | Bot-Farm im Keller | 1.100 | 8 |
| 4 | Hofberichterstatter-Zeitung | 12.000 | 47 |
| 5 | Staatssender „Jubel-TV“ | 130.000 | 260 |
| 6 | Ministerium für Wahrheitspflege | 1,4 Mio. | 1.400 |

Jeder Generator bekommt einen lustigen Flavor-Text und eine kleine Animation in der Szene. Meilensteine bei 10, 25, 50 und 100 Stück verdoppeln jeweils die Produktion.

### 4.3 Upgrades (mind. 8 im MVP)

Beispiele:

- **Framing-Seminar:** Tippen ×2
- **Whataboutism-Grundkurs:** Praktikanten ×2
- **Rekordbehauptungs-Generator:** Jede Zahl in Pressemitteilungen wird „die größte aller Zeiten“. Umfragewerte +5
- **Pressekonferenzen nur für Lieblingsjournalisten:** Spin ×1,5, Demokratie −10, schaltet die Karte „Pressefreiheit“ frei
- **Richter nach Loyalität auswählen:** Spin ×2, Demokratie −15, schaltet „Gewaltenteilung“ frei
- **Wahlkreise kreativ neu zeichnen:** Umfragewerte +10, Demokratie −10, schaltet „Wahlkreiszuschnitt“ frei
- **Faktencheck-Abteilung „umstrukturieren“:** Skandale werden seltener bemerkt, Demokratie −5
- **Neffe wird Minister für Alles:** alle Generatoren ×1,25, Demokratie −5

### 4.4 Offline-Fortschritt & Speichern

- Beim Wiederkommen gibt es Offline-Einkommen, gedeckelt auf 8 Stunden, mit einem Popup wie: „Während du weg warst, hat der Präsident 14-mal gepostet. Dein Team hat 3,2 Mio. Spin erzeugt.“
- Autosave alle 10 Sekunden und bei `visibilitychange` in localStorage. Das Save-Schema ist versioniert und hat Migrationen. Dazu kommt ein Export und Import des Spielstands als Text-Code.

### 4.5 Lexikon

- Im MVP gibt es 3 Karten: **Pressefreiheit**, **Gewaltenteilung** und **Wahlkreiszuschnitt (Gerrymandering)**.
- Jede Karte hat 3–5 sachliche Sätze: wozu es die Institution gibt, ein historisches Beispiel und eine Quelle (z. B. bpb.de).
- Freigeschaltet wird eine Karte durch das jeweilige Upgrade. Gesammelt werden die Karten in einem eigenen Lexikon-Tab.

---

## 5. Sidequests: Quest-Engine + je 1 Beispiel

Die **Quest-Engine** liegt datengetrieben in `packages/shared`. Quests sind typisierte Definitionen (JSON bzw. TS mit Zod-Schema), bestehend aus Trigger, Schritten, Bedingungen und Belohnungen. Neue Quests müssen ohne Code-Änderung hinzukommen können, denn das ist die Grundlage für Community-Beiträge.

1. **Story-Quest mit NPC – „Die Brücke ins Nichts“:** Dr. Frieda Nachfrage fragt nach einer Brücke, die nirgendwo hinführt, aber 400 Mio. gekostet hat.
   - 3 Dialogrunden mit je einer Auswahl: Dementieren / Ablenken mit Hundevideo / Gegenfrage stellen / die Wahrheit sagen.
   - Die Antworten wirken sich auf Umfragewerte und Demokratie-Index aus.
   - Der Dialog erscheint als Sprechblasen mit Tipp-Animation.
2. **Minispiel – „Schlagzeilen-Swipe“ (20 s):** Schlagzeilen fallen von oben.
   - Negative wischt man nach links („ablenken“), positive nach oben („verstärken“).
   - Es gibt einen Combo-Zähler, und die Belohnung skaliert mit der Punktzahl.
3. **Zufallsereignis – „Der Präsident hat gepostet“:** Alle 3–8 Minuten schiebt sich ein Handy ins Bild, darauf ein absurder Post.
   - Die Posts kommen aus einem Pool von mindestens 12 Texten, z. B. „Die Sonne geht dank mir jetzt früher auf. Gern geschehen!“
   - Wer innerhalb von 8 Sekunden auf „Einordnen“ tippt, bekommt einen Spin-Bonus. Sonst gibt es einen Skandal-Debuff für 60 Sekunden.
4. **Daily Quests:** 3 tägliche Aufgaben aus einem Pool, z. B. „Überstehe 3 Skandale“ oder „Gib 200 Statements ab“.
   - Reset um Mitternacht Ortszeit, dazu ein Streak-Zähler.
   - Im MVP laufen sie clientseitig. Die Server-Validierung wird ein Issue.

---

## 6. Grafik, Feel & Mobile

- **Stil:** Cartoon 2D mit knalligen Farben, Squash & Stretch und viel „Juice“:
  - fliegende Zahlen beim Tippen und Partikel
  - leichter Screenshake bei Skandalen
  - federnde Buttons und Konfetti bei Meilensteinen
  - Vibration über `navigator.vibrate` (abschaltbar)
- **Assets:** freie CC0-Packs von Kenney (kenney.nl).
  - Der Nutzer legt sie vorab in `apps/client/public/assets/vendor/kenney/` ab. Prüfe, was dort vorhanden ist, und baue darauf auf.
  - Fehlt etwas, nutze saubere Platzhalter (Pixi Graphics) mit festen Dateinamen, damit sie später austauschbar sind, und leg ein Issue an.
  - Alle Asset-Quellen kommen in `ASSETS.md`.
- **Szene (PixiJS):** Der Hauptbildschirm ist der Pressesaal.
  - In der Mitte steht das Rednerpult, es ist das Tipp-Ziel.
  - Im Hintergrund hängt ein fiktives, stilisiertes Präsidenten-Portrait.
  - Gekaufte Generatoren erscheinen nach und nach als animierte Elemente im Raum.
- **UI:** Menüs, Texte und Dialoge sind ein HTML/CSS-Overlay (Preact) über dem Pixi-Canvas. Das bringt bessere Textdarstellung, Barrierefreiheit und besseres Touch-Handling. Unten gibt es eine Tab-Leiste: Generatoren / Upgrades / Quests / Lexikon / Einstellungen.
- **Mobile-Anforderungen:**
  - Hochformat, Safe-Area-Insets, Touch-Ziele ≥ 44 px
  - kein Doppeltipp-Zoom und nichts, was nur per Hover funktioniert
  - `devicePixelRatio` auf 2 begrenzen und das Rendering pausieren, wenn der Tab versteckt ist
  - 60 fps auf Mittelklasse-Handys, initiales JS-Bundle < 300 kB gzip (ohne Assets)
  - `prefers-reduced-motion` respektieren
- **Sound:** CC0-Sounds (z. B. Kenney-Audio-Packs), standardmäßig leise, mit Mute-Schalter.
- **PWA** (vite-plugin-pwa): Manifest, Icons, Vollbild, Hochformat, offline startbar, Update-Hinweis bei neuer Version.

---

## 7. Technik & Infrastruktur

### 7.1 Stack

- **Monorepo** mit pnpm-Workspaces, TypeScript im strict-Modus überall, aktuelle Node-LTS.
- **`apps/client`:** Vite, PixiJS (aktuelle Major-Version), Preact für das Overlay, eine MIT-lizenzierte Tween-Library.
- **`apps/server`:** Fastify, Drizzle ORM, PostgreSQL, Zod-Validierung.
  - Im MVP nur das Grundgerüst: Healthcheck, DB-Verbindung, erste Migration (Tabelle `players`), OpenAPI-Doku.
  - Cloud-Save und alles Weitere werden Issues.
- **`packages/shared`:** Balancing-Formeln, Typen, Zod-Schemas und die Quest-Engine.
  - Die Spiel-Simulation besteht aus **reinen, deterministischen Funktionen** (`tick(state, dt)`).
  - Die Simulation darf weder DOM noch Pixi kennen. So kann der Server später dieselbe Logik zur Cheat-Prüfung nutzen.
- **Große Zahlen:** eigene Formatierung (1,2 Mio., 3,4 Mrd., danach a/b/c…). Der Wechsel auf eine Big-Number-Library wird als Issue vorgemerkt.
- **Tooling:** Biome (Lint + Format), Vitest (Unit-Tests für Simulation, Balancing und Quest-Engine), Lefthook + commitlint.

### 7.2 Docker & Hosting

- **`docker-compose.yml`** für die lokale Entwicklung: postgres, server und client mit Hot Reload. Ein einziger Befehl (`pnpm dev` bzw. `docker compose up`) startet alles.
- **`docker-compose.prod.yml`** für den VPS:
  - Caddy als Reverse-Proxy mit automatischem HTTPS; Caddy liefert auch den statischen Client aus.
  - Der Server stellt die API bereit, Postgres läuft mit Volume.
  - Konfiguration über `.env` mit Vorlage `.env.example`. Keine Secrets ins Repo.
- **Dockerfiles:** Multi-Stage, kleine Images, Non-root-User.
- **Deployment** per GitHub Actions (Images nach GHCR, Deploy per SSH) wird ein Issue. Im MVP wird es nur in der Doku beschrieben.

### 7.3 Git & GitHub (ausgelegt auf ein großes Open-Source-Projekt)

- **GitHub Flow:** `main` ist geschützt und immer deploybar.
  - Gearbeitet wird in Branches `feat/…`, `fix/…`, `chore/…`, `docs/…` und `content/…` (für neue Quests, Events und Texte).
  - Gemergt wird nur per Pull Request mit grüner CI, als Squash-Merge.
- **Conventional Commits**, per commitlint erzwungen. **release-please** erzeugt Changelog, SemVer-Tags und GitHub-Releases.
- **CI (GitHub Actions)** bei jedem PR:
  - Lint, Typecheck und Tests
  - Build von Client und Server sowie Docker-Build
  - Validierung aller Content-Dateien gegen das Zod-Schema
  - Dazu Dependabot für Dependencies und Actions.
- **Repo-Dateien:**
  - `README.md` mit Pitch, Screenshot/GIF-Platzhalter, Quickstart und Architekturdiagramm in Mermaid
  - `LICENSE` (MIT für den Code) und `LICENSE-ASSETS` (CC BY 4.0 für eigene Grafiken und Texte)
  - `ASSETS.md`
  - `CONTRIBUTING.md` mit Workflow, Commit-Regeln, den Satire-Leitplanken aus Abschnitt 2 und der Anleitung „So schreibst du eine neue Quest“
  - `CODE_OF_CONDUCT.md` (Contributor Covenant) und `SECURITY.md`
  - `.github/ISSUE_TEMPLATE/` (Bug, Feature, Content-Vorschlag), `.github/pull_request_template.md`, `CODEOWNERS`
  - `.editorconfig` und `docs/adr/`
- **`CLAUDE.md`** für künftige Claude-Code-Sessions: Architektur, wichtige Befehle, Konventionen und die Satire-Leitplanken.
- **GitHub einrichten, wenn die `gh` CLI angemeldet ist:**
  - Repo anlegen und pushen
  - Labels anlegen: `good first issue`, `help wanted`, `content`, `needs-fact-check`, `backend`, `story`, `minigame`, `polish`, `a11y`
  - Milestones und Issues anlegen, Branch-Schutz für `main` per Ruleset setzen
- **Wenn `gh` nicht angemeldet ist:** Leg alles als idempotentes Skript `scripts/bootstrap-github.sh` an und halte den Backlog zusätzlich in `docs/backlog.md` fest.

---

## 8. Zeitplan (2 Stunden)

| Zeit | Phase | Ergebnis |
|------|-------|----------|
| 0:00–0:15 | 0 – Fundament | Monorepo, Tooling, CI, Lizenzen, Grund-Doku, `CLAUDE.md`, erster Commit |
| 0:15–0:50 | 1 – Kern-Loop | Simulation mit Tests, Pixi-Szene, Overlay, Tippen, Generatoren, Upgrades, Offline-Fortschritt, Speichern; auf dem Handy spielbar |
| 0:50–1:25 | 2 – Story & Quests | Akt-1-Intro, Quest-Engine, die 4 Beispiel-Quests, Demokratie-Index, 3 Lexikon-Karten |
| 1:25–1:45 | 3 – Juice & PWA | Effekte, Sounds, PWA, Performance-Check |
| 1:45–2:00 | 4 – Server & Abschluss | Server-Grundgerüst + Docker Compose, fertige README, Issues angelegt, Tag `v0.1.0` |

Zum Testen auf dem Handy: Starte den Dev-Server mit `--host` und öffne die URL im selben WLAN.

---

## 9. Backlog – als GitHub-Issues anlegen

Jedes Issue bekommt eine Beschreibung, Akzeptanzkriterien, Labels und einen Milestone. Mindestens diese:

**Milestone v0.2 – Backend**
- Cloud-Save mit anonymem Account (Geräte-Token, später optional mit Konto verknüpfbar)
- Serverseitige Prüfung von Spielständen und Offline-Fortschritt mit der Shared-Simulation (Anti-Cheat)
- Leaderboards (z. B. höchste Umfragewerte, meiste überstandene Skandale)
- Serverseitige Daily- und Weekly-Quests mit gemeinsamem Seed für alle Spieler
- Deployment-Pipeline zum VPS (GHCR + SSH) inkl. Postgres-Backups
- Datenschutzfreundliche, selbst gehostete Statistik ohne Cookies

**Milestone v0.3 – Story & Inhalte**
- Akt 2 „Der große Skandal“ und Akt 3 „Die Wahl“ mit mehreren Enden
- Neuer Wert „Gewissen“ des Pressesprechers, der Dialogoptionen und Enden beeinflusst (z. B. Whistleblower-Ende)
- Prestige-System „Neue Amtszeit“ mit Personenkult-Bonus
- Weitere NPCs (Oppositionsführerin, Hofberichterstatter, Neffe Konstantin) und Story-Quests
- Weitere Minispiele (Pressekonferenz-Ausweich-Quiz, Talkshow-Rhythmusspiel, Flucht vor dem Faktencheck)
- Weekly Quests und Achievements
- Weitere Lexikon-Karten (Rechtsstaat, Amtszeitbegrenzung, Vetternwirtschaft, Propaganda)
- Content-Pipeline: Die Community reicht neue Events und Quests als JSON-PRs ein, inspiriert von aktuellen Ereignissen, aber immer fiktionalisiert

**Milestone v0.4 – Polish & Plattform**
- Englische Übersetzung und i18n für weitere Sprachen
- Barrierefreiheit (Screenreader-Unterstützung im Overlay, Farbenblind-Modus, reduzierte Bewegung)
- Eigene Illustrationen und Animationen (CC BY 4.0) statt Platzhaltern
- Big-Number-Library für späte Spielphasen
- E2E-Tests mit Playwright in Handy-Emulation, Lighthouse-CI mit Performance-Budget
- Einstellungsmenü, Sounddesign, bessere Save-Export- und Import-Funktion

---

## 10. Definition of Done für den Hackathon

- Das Spiel läuft auf dem Handy im Browser, ist als PWA installierbar und in 30 Sekunden verständlich.
- Kern-Loop, Akt-1-Intro, die 4 Beispiel-Quests und die 3 Lexikon-Karten funktionieren.
- Tests und CI sind grün, `main` ist sauber, der Tag `v0.1.0` ist gesetzt.
- Der Backlog ist als Issues angelegt (oder als Skript + `docs/backlog.md`).
- Die README erklärt, wie man das Spiel startet und wie man beiträgt.
- Zum Schluss schreibst du eine kurze Zusammenfassung: was fertig ist, was fehlt und welche Issues als Nächstes am meisten bringen.
