# Bead Protocol Enforcement — Combined Review Plan

**Status**: Pending approval — no changes made yet  
**Artifacts**: 2 (rule file + hook addition)  
**Files touched on approval**: `.claude/rules/bead-protocol.md` (new), `.claude/settings.local.json` (edit), `.beads/beads.jsonl` (bead_044 open + close)

---

## Why two artifacts, not one

The rule file and the hook address different failure modes and must coexist without contradiction:

| Failure mode | Rule file | Hook |
|---|---|---|
| AI starts session and forgets the protocol | Catches it (loaded in context every session) | Cannot help — fires per-edit, not per-session |
| AI remembers the rule but skips the step | Cannot help — it's still advisory | Catches it — blocks the edit mechanically |
| AI opens a trivial bead just to unblock | Rule covers qualitative expectation | Hook cannot enforce — only checks `status==="open"` |
| AI opens a stale/wrong bead from prior session | Rule covers "one bead per task" | Hook cannot enforce — passes on any open bead |

Neither artifact covers the full space alone. Together they handle the realistic failure cases.

---

## Artifact 1 — Rule File

**Path**: `.claude/rules/bead-protocol.md`  
**Loaded**: automatically at the start of every Claude Code session

### Exact content that will be written:

```markdown
# Bead Protocol — Mandatory Compliance

Every file edit made by this agent must be covered by an open bead.

## The Rule (in order)

1. Before any Edit or Write, confirm a bead with `"status":"open"` exists in `.beads/beads.jsonl`
2. If none exists, open one with a meaningful title and scope — then edit
3. One bead per task — do not reuse or extend a bead from a prior task
4. Close the bead (mark `"status":"closed"`) only after the Stop Hook passes

## What counts as a valid open bead

An entry in `.beads/beads.jsonl` where:
- `"status"` is `"open"`
- `"title"` describes the actual work (not a placeholder like "work" or "bypass")

## Excluded paths — no bead required

- `.beads/beads.jsonl` — you must be able to open the bead
- `.claude/` — settings, rules, hooks, and memory files

## Why this exists

bead_039 and bead_040 were opened retroactively after edits were already made.
Retroactive beads defeat the audit trail. The bead must precede the work, not follow it.
The PreToolUse hook enforces the mechanical order; this rule covers the qualitative expectation.
```

---

## Artifact 2 — PreToolUse Hook

**File**: `.claude/settings.local.json`  
**Change**: add a `PreToolUse` array alongside the existing `PostToolUse` array

### What it does

Fires before every `Edit` or `Write` tool call. Reads `.beads/beads.jsonl` and looks
for any line where `status === "open"`. If none found, writes `[BEAD GUARD]` to stderr
and exits 1 — the tool call is cancelled. If found, exits 0 — the tool call proceeds.

### Readable form of the script

```javascript
var d = '';
process.stdin.on('data', function(c) { d += c; });
process.stdin.on('end', function() {
  try {
    var p = JSON.parse(d);
    // Claude Code delivers file_path at the top level for Edit/Write
    var f = p.file_path || (p.tool_input && p.tool_input.file_path) || '';

    // Excluded paths — always allow
    if (f.includes('beads.jsonl') || f.includes('.claude')) {
      process.exit(0);
    }

    var fs = require('fs');
    var beadsPath = 'C:/Users/sebmo/OneDrive/Documents/GitHub/ProsDispatch/.beads/beads.jsonl';
    var lines = fs.readFileSync(beadsPath, 'utf8').trim().split('\n');
    var ok = lines.some(function(l) {
      try { return JSON.parse(l).status === 'open'; } catch(e) { return false; }
    });

    if (!ok) {
      process.stderr.write(
        '\n[BEAD GUARD] Blocked: no open bead found.\n' +
        'Open a bead in .beads/beads.jsonl before editing source files.\n\n'
      );
      process.exit(1);
    }

    process.exit(0);
  } catch(e) {
    // Fail open — if beads.jsonl is unreadable, don't lock all editing
    process.exit(0);
  }
});
```

### Exact JSON addition to settings.local.json

The current `hooks` block gains a `PreToolUse` sibling:

```json
"hooks": {
  "PreToolUse": [
    {
      "matcher": "Edit|Write",
      "hooks": [
        {
          "type": "command",
          "command": "node -e \"var d='';process.stdin.on('data',function(c){d+=c}).on('end',function(){try{var p=JSON.parse(d),f=p.file_path||(p.tool_input&&p.tool_input.file_path)||'';if(f.includes('beads.jsonl')||f.includes('.claude')){process.exit(0);}var fs=require('fs'),lines=fs.readFileSync('C:/Users/sebmo/OneDrive/Documents/GitHub/ProsDispatch/.beads/beads.jsonl','utf8').trim().split('\\n'),ok=lines.some(function(l){try{return JSON.parse(l).status==='open'}catch(e){return false}});if(!ok){process.stderr.write('\\n[BEAD GUARD] Blocked: no open bead found.\\nOpen a bead in .beads/beads.jsonl before editing source files.\\n\\n');process.exit(1);}process.exit(0);}catch(e){process.exit(0);}});\""
        }
      ]
    }
  ],
  "PostToolUse": [
    ... existing hooks unchanged ...
  ]
}
```

---

## How the two artifacts interact (no contradictions)

| Concern | Rule file says | Hook does | Consistent? |
|---|---|---|---|
| When to check | Before any Edit or Write | Before any Edit or Write | Yes |
| What to check for | `status === "open"` | `status === "open"` | Yes |
| Excluded paths | `beads.jsonl` and `.claude/` | `includes('beads.jsonl')` or `includes('.claude')` | Yes |
| Bead quality | Meaningful title required | Not checked (only existence) | No gap — rule covers what hook cannot |
| One bead per task | Explicitly stated | Not enforced | No gap — rule covers what hook cannot |
| Failure on missing beads.jsonl | Not addressed | Fail open (exit 0) | Consistent — no conflict |

The rule covers qualitative expectations. The hook covers mechanical order. Neither contradicts the other; they are complementary layers.

---

## Known fragility — hardcoded absolute path

The hook script contains:
```
fs.readFileSync('C:/Users/sebmo/OneDrive/Documents/GitHub/ProsDispatch/.beads/beads.jsonl', ...)
```

This is an absolute path tied to one machine and one directory layout. If the repo moves,
is cloned to a different path, or runs on another machine, `readFileSync` will throw a
file-not-found error. The `catch(e) { process.exit(0) }` handler means this fails open —
the hook becomes silently inert and enforcement is lost with no warning.

**Future bead**: replace the hardcoded path with a relative resolution, e.g.:
```javascript
var path = require('path');
var beadsPath = path.join(__dirname, '..', '.beads', 'beads.jsonl');
// or derive from the file_path being edited:
// var beadsPath = path.join(f.split('.beads')[0], '.beads', 'beads.jsonl');
```
Until that bead is done, any machine or path change silently disables enforcement.

---

## Known gaps (honest)

1. **Bash tool writes**: `Edit` and `Write` tools are covered. A `Bash` command that writes a file via shell (`Set-Content`, `echo >`, etc.) bypasses both artifacts. Recommend deferring Bash coverage to a future bead.

2. **Trivial bead bypass**: The hook only checks that `status === "open"` exists. An agent could open a one-word bead to unblock itself. The rule addresses this qualitatively ("meaningful title") but neither artifact can machine-enforce it.

3. **Stale open bead from a prior session**: If a bead was accidentally left open, the hook passes. The rule addresses this with "one bead per task, do not reuse" but the hook cannot enforce it.

---

## Rollout order (after approval)

1. Open `bead_044` in `.beads/beads.jsonl` (excluded path — no bead needed for this step)
2. Write `.claude/rules/bead-protocol.md` (new file, excluded `.claude` path)
3. Edit `.claude/settings.local.json` — add `PreToolUse` block (excluded `.claude` path)
4. **Test 1**: Close bead_044 → attempt a dummy edit on any source file → expect `[BEAD GUARD]` block
5. **Test 2**: Re-open bead_044 → attempt same edit → expect it to proceed
6. **Test 3**: With no open bead, confirm `beads.jsonl` and `.claude/settings.local.json` are still writable
7. Close bead_044
8. Commit: `chore(governance): add PreToolUse bead-guard hook and bead-protocol rule`

---

## What approval means

Approving this plan authorizes exactly:
- One new file: `.claude/rules/bead-protocol.md`
- One JSON edit: add `PreToolUse` block to `.claude/settings.local.json`
- Two beads.jsonl edits: open and close bead_044

No source files. No build changes. No CI impact.
