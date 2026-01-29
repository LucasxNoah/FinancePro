# FinancePro

FinancePro 💎
FinancePro is a sleek, dark-themed personal finance management dashboard built with vanilla JavaScript. It empowers users to track income, manage expenses across multiple profiles, and gain deep visual insights into their financial health through dynamic analytics and goal tracking.

🚀 Problem Statement
Managing finances often feels like a chore due to cluttered interfaces and a lack of immediate feedback. Users need a centralized platform that can:

Segment Data: Separate personal, work, or travel expenses into distinct profiles.

Visualize Habits: See where money is going through relative bar graphs rather than just lists of numbers.

Monitor "Survival": Understand how many days they can sustain their current lifestyle based on their balance and "burn rate".

Gamify Savings: Track progress toward specific goals with visual rewards like confetti.

✨ Features Implemented
Multi-Profile Architecture: Create and switch between multiple financial profiles; each profile maintains its own unique transactions and budgets.

Dynamic OLED Dashboard: A high-contrast UI that updates balances (Net, Income, Expenses) in real-time.

Intelligent History Filtering: Search by description and filter by category or transaction type instantly.

Visual Spend Analysis: Category-wise spending bars that scale relatively and include budget status badges.

Goal Tracker: Custom savings goal tracker with a progress bar and celebration animations upon completion.

Detailed Insights Modal: Provides analytics for Top Category, Daily Burn, Survival Days, and Savings Ratio.

Toast Notification System: Custom-built non-intrusive alerts for user feedback on actions like saving or switching profiles.

Persistent Storage: Uses browser localStorage to ensure data remains available after refreshing.

🛠 DOM Concepts Used
Dynamic Template Literals: Using backticks to inject complex HTML structures based on the current state.

Event Delegation & Handling: Use of addEventListener for input tracking, form submissions, and modal triggers.

Element Creation: Dynamically generating notification and toast elements using document.createElement.

Class Manipulation: Use of classList to handle modal visibility and state-driven styling.

Array Methods for UI: Using .map(), .filter(), and .reduce() to process financial data before rendering.

🏁 Steps to Run the Project
You can run FinancePro instantly without any local setup by visiting the hosted link:

Access the App: Open your browser and go to: https://lucasxnoah.github.io/FinancePro/

Use: Start by adding a transaction in the "New Entry" section or creating a new profile from the sidebar to organize your finances.

Local Alternative: If you wish to run it locally, clone the repository and open index.html in any modern web browser.

⚠️ Known Limitations
Browser Storage: Data is specific to the browser and device used; clearing browser cache will wipe the data.

Manual Entry: Currently requires manual entry of data; does not support automated bank synchronization.

30-Day Logic: "Survival Days" and "Daily Burn" are calculated based on a fixed 30-day monthly average.

Author: Aditya Singh

Tech Stack: HTML5, CSS3, Vanilla JavaScript.