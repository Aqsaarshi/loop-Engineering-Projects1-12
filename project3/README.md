# The Morning Brief with a Memory

A beginner-friendly Node.js project that demonstrates persistent memory using a simple marker-based format.

## Project structure

```
morning-brief/
│  morning-brief.js   – the main script
│  progress.md        – persistent memory (spine) of the system
│  example.js         – contains example TODO comments
│  README.md          – this file
│  package.json       – npm config
```

## How it works

### The `progress.md` file (persistent memory / "spine")

`progress.md` is the project's memory. It uses a very simple, reliable format with two markers:

- `RECORDED_TODOS_START` – marks the beginning of the recorded TODO list
- `RECORDED_TODOS_END` – marks the end of the recorded TODO list

All TODOs found during runs are stored between these two markers. The script **only** reads the content between these markers to determine which TODOs were already recorded. This makes the memory simple, reliable, and easy to inspect.

Example `progress.md`:

```
# Morning Brief Progress

## Recorded TODOs

RECORDED_TODOS_START
TODO: set up project scaffolding
TODO: add logging functionality
TODO: implement user authentication
RECORDED_TODOS_END

## Run History

### 2026-08-30

New TODOs found:
- set up project scaffolding
- add logging functionality
- implement user authentication
```

### How the script uses the memory

1. **Read** the content between `RECORDED_TODOS_START` and `RECORDED_TODOS_END` in `progress.md`.
2. **Parse** the TODO items (remove the `TODO:` prefix).
3. **Scan** all `.js` files in the project for `// TODO:` comments.
4. **Compare** the currently found TODOs against the previously recorded ones.
5. **Record only NEW TODOs** that weren't previously seen.
6. **Add a dated entry** to the Run History section.

### Running the script

```cmd
cd E:\loop-Engineering-Projects\morning-brief
node morning-brief.js
```

The script will:

1. Read the previous TODOs from `progress.md`.
2. Scan for current TODOs in the project.
3. Output how many new TODOs were found.
4. Update `progress.md` with any new items.

### Expected test results

#### TEST 1 – First run (empty memory)

Start with empty `progress.md` (only markers present).

Expected output:

```
Morning brief completed.
New TODOs recorded: ["set up project scaffolding","add logging functionality","implement user authentication"]
```

Afterwards `progress.md` will contain the 3 TODOs between the markers.

#### TEST 2 – Second run (no changes)

Run the script again **without** changing any TODO comments.

Expected output:

```
Morning brief completed.
New TODOs recorded: []
```

All TODOs are already in memory, so zero new items are recorded. This is the most important success condition.

#### TEST 3 – Third run (add one new TODO)

Add exactly one new TODO comment to `example.js`:

```js
// TODO: add deployment script
```

Run the script again.

Expected output:

```
Morning brief completed.
New TODOs recorded: ["add deployment script"]
```

It must NOT repeat the original 3 TODOs.

### Scheduling on Windows (optional)

The script can be scheduled to run once per day using Windows Task Scheduler:

1. Press **Win + R**, type `taskschd.msc`, press **Enter**.
2. Click **Create Basic Task…** in the right pane.
3. Name it "Morning Brief" and click **Next**.
4. Choose **Daily** and click **Next**.
5. Set the start time and click **Next**.
6. Select **Start a program** and click **Next**.
7. **Program/script**: `cmd.exe`
8. **Add arguments**: `/C node E:\loop-Engineering-Projects\morning-brief\morning-brief.js`
9. Click **Finish**.

The script will now run automatically each day. The safety guard (1‑minute lock) prevents duplicate runs if the task fires multiple times quickly.

## Success condition

The project is successful only if:

- **Run 1:** 3 new TODOs recorded.
- **Run 2:** 0 new TODOs recorded (no repetition).
- **Run 3:** 1 new TODO recorded.

If old TODOs appear again during Run 2 or Run 3, the project is NOT complete.

The key success condition is: **Run the project twice, and the second run must clearly build on the first run without repeating information that was already recorded.**