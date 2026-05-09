# Domain Context: FokusMode

## Glossary

### Calendar Segments
Logical divisions of a 24-hour day used to organize focus sessions in the calendar's month view.
- **Morning**: 05:00 - 11:59.
- **Afternoon**: 12:00 - 17:59.
- **Evening**: 18:00 - 04:59 (next day).

### Day Box
The visual container for a single date in the Monthly Calendar view.

### Smart Placement
A layout logic for sessions within a Day Box that adapts based on session density, assuming a **6-row capacity** (2 rows per segment):
- **Segment Budget**: Each logical segment (Morning, Afternoon, Evening) is allocated 2 rows of vertical space.
- **Low Segment Density (1-2 sessions)**: Sessions occupy full-width rows (1 per row).
- **Mid Segment Density (3-5 sessions)**: Sessions utilize a balanced grid across the 2-row budget:
  - 3 sessions: Row 1 (2 cols), Row 2 (1 col).
  - 4 sessions: Row 1 (2 cols), Row 2 (2 cols).
  - 5 sessions: Row 1 (3 cols), Row 2 (2 cols).
- **High Segment Density (6+ sessions)**: Row 1 (3 cols), Row 2 (2 cols + overflow indicator).
- **Segment Independence**: Column splitting and row usage are calculated independently for each segment.
- **Auto-Expansion (Dynamic Budgeting)**: The total 6-row capacity is divided equally among active segments:
  - 1 active segment: 6-row budget.
  - 2 active segments: 3-row budget each.
  - 3 active segments: 2-row budget each.
- **Priority Layout**: Within any budget, sessions occupy full-width rows first. If the number of sessions exceeds the row budget, they transition to a column-based grid.
