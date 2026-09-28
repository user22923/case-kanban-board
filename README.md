# Case Kanban Board

A Salesforce full-stack project: a drag-and-drop Kanban board for Case management,
built with Lightning Web Components on top of a secure Apex controller — no
third-party libraries, no Aura, just LWC + Apex.

Cases are grouped into columns by their `Status` picklist value. Dragging a card to a
different column updates the Case's status on the server, with an optimistic UI
update that rolls back if the server call fails.

## Architecture

- **`caseKanbanBoard`** — the container. Wires to `CaseKanbanController.getBoardData`
  (cacheable Apex, returns the board's columns + cases in one round trip), renders one
  `caseKanbanColumn` per status, and owns the optimistic-update / rollback logic around
  the imperative `updateCaseStatus` call.
- **`caseKanbanColumn`** — a single status column. Handles `dragover`/`drop` and
  dispatches a `carddrop` custom event (`{ caseId, newStatus }`) up to the board.
- **`caseKanbanCard`** — a single draggable Case card. Sets the dragged Case id on
  `dataTransfer` and navigates to the record on click (`NavigationMixin`).
- **`CaseKanbanController`** — the only Apex class that touches `Case`. Reads with
  `WITH USER_MODE` (enforces FLS + sharing), validates the target status against the
  live picklist before writing, and runs every write through
  `Security.stripInaccessible(AccessType.UPDATABLE, ...)` before the `update` DML.

## Why no custom objects

Case's own `Status` picklist drives the board columns dynamically (via
`Schema.PicklistEntry` describe calls), so the board adapts automatically if the
picklist is customized in Setup — no custom objects or fields needed.

## Testing

- **Apex** (`CaseKanbanControllerTest`): board data shape, a successful status move,
  rejection of an invalid status value, rejection of missing/unknown case ids, and a
  restricted user (no object/field permissions) being blocked by `WITH USER_MODE`.
  100% pass rate, 90% class coverage / 95% org-wide.
- **LWC Jest** (`__tests__` folders in each component): column rendering per status,
  empty-state handling, the `carddrop` event payload, drag payload on `caseKanbanCard`,
  and on the board — wire data rendering, wire error handling, a successful drop
  (optimistic update + `updateCaseStatus` call + `refreshApex`), and rollback on a
  failed drop.

Run them with:

```bash
sf apex run test --target-org <alias> --class-names CaseKanbanControllerTest --code-coverage --wait 10
npm install
npm run test:unit
```

## Deploying

```bash
sf project deploy start --target-org <alias> --source-dir force-app
```

This also deploys a **Case Kanban** Lightning app (with a **Case Kanban Board** tab)
so the component is reachable from the App Launcher without any manual App Builder
setup. Open it with:

```bash
sf org open --target-org <alias> --path "/lightning/n/Case_Kanban_Board"
```
