# Olympic Hub: Consultative Intelligence Manifesto

## Vision
The Olympic Hub is evolving from a search engine into a **Dynamic Travel Advisor**. It doesn't just find results; it understands the *intent* and *quality* of the experience.

## Core Pillars
1. **Contextual Awareness**: Understanding that a user looking for "Bansko" in January wants "Skiing", not just a hotel.
2. **Quality-Driven Pivoting**: If the quality of the experience (snow conditions, weather, safety) at the primary destination falls below a threshold, the system autonomously identifies and suggests "Twin Destinations".
3. **Similarity Engine**: Mapping destinations by pricing, vibe, and travel effort.
    - *Example*: Bansko (Bulgaria) is a "Twin" to Jahorina (Bosnia) and Borovets (Bulgaria).
4. **Intent Tracking**: Behavioral data (clicks, views, search terms) is used to categorize the user's current persona (Ski-expert, Tropical-escape, City-explorer).

## Technical Roadmap
- [x] **Phase 1: Reflex Engine** (Meka Zona basic reflexes).
- [x] **Phase 2: Intent Tracking** (Categorizing user intent based on views).
- [ ] **Phase 3: Condition Sensors** (Integration with Weather/Snow APIs for remote destinations).
- [ ] **Phase 4: Similarity Mapping** (Database of resort twins and price-equivalents).
- [ ] **Phase 5: Consultative Banner** (UI component that says "Don't go there, go here instead").

## Business Logic
If `Search(Destination_A)` and `Condition(Destination_A) == Poor`:
    `Find Twin(Destination_A) as Destination_B`
    `If Condition(Destination_B) == Excellent`:
        `Display PivotReflex(Destination_B)`

---
*Created on 2026-01-06 - Collaboratively between USER and AI.*
