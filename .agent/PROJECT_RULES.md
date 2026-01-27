# 🛡️ Project Rules & Strict Guidelines - OlympicHub

This document contains mandatory rules and established logic for the OlympicHub project. These rules must be followed strictly by the AI assistant.

## 1. Rule of Immutable Approvals
> [!IMPORTANT]
> Once a feature, UI layout, or script logic has been implemented according to user instructions and has been **explicitly approved**, it becomes **IMMUTABLE**.
> 
> **Do NOT modify, refactor, or attempt to "improve" an approved feature without a direct and explicit request from the user.** This is to prevent regression and loss of working code.

## 2. Continuous Learning & Knowledge Persistence
The AI assistant must "remember" and learn from every correction and success in this project. All established logic—especially those derived from external documents like Excel files—must be preserved in the implementation.

## 3. Established Logic & UI "Locked" States

### 🏠 RoomsStep Editor Layout (Approved)
- **Structure**: Two-pane/Two-card layout.
- **Card 1 (Left/Top)**: Basic Information (Name, Code, Category, Sqm, View), Bedding (Osnovni, Pomoćni) and Min Occupancy.
- **Card 2 (Right/Bottom)**: Occupancy Rules (Standard, Max ADL, Max CHD, Max Total) and "Pravila i Opcije" checkboxes.
- **Notation**: Use labels like **1/2**, **2/2**, **2/2+1** in the occupancy table where:
    - First number = Number of adults.
    - Second number = Number of basic beds (Osnovni Kreveti).
    - `+X` = Additional children or occupants.

### 📅 CapacityStep Integration
- Room cards must remain consistent with the `RoomsStep` design (Grid/List views, Glass styling).

## 4. Lesson Learned Log
- **Occupancy Table Generation**: Do not allow `undefined` values for bed counts during editing, as it breaks the table rendering. Default to `0` or `1` appropriately.
- **Number Inputs**: Use `onChange` logic that allows users to clear the input field (empty string) without immediately snapping back to 0, but ensure a valid number is stored for logic processing.
- **ADL/CHD Distinctions**: Always use Emerald for CHD and Blue for ADL in labels for visual clarity.
