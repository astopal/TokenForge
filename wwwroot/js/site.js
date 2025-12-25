(function () {
    const tokensJsonInput = document.getElementById("tokensJson");
    const tokenList = document.getElementById("tokenList");
    const tokenChips = document.getElementById("tokenChips");
    const addBtn = document.getElementById("addTokenBtn");

    const editor = document.getElementById("templateEditor");
    const templateHidden = document.getElementById("templateHidden");

    if (!tokensJsonInput || !tokenList || !tokenChips || !addBtn || !editor || !templateHidden) return;

    let isDraggingToken = false;

    let tokens = normalizeTokens(safeParse(tokensJsonInput.value));

    editor.textContent = templateHidden.value || "";

    renderAll();
    syncTemplateToHidden();
    saveTokens(); // ensure correct casing

    // Block dropping text into inputs etc. (capture)
    document.addEventListener("dragover", (e) => {
        if (!isInsideEditor(e.target)) e.preventDefault();
    }, true);

    document.addEventListener("drop", (e) => {
        if (!isInsideEditor(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    addBtn.addEventListener("click", () => {
        tokens.push({
            Id: cryptoId(),
            Name: "",
            Value: ""
        });
        renderAll();
        saveTokens();
    });

    function renderAll() {
        renderTokenRows();
        renderChips();
    }

    function renderTokenRows() {
        tokenList.innerHTML = "";

        tokens.forEach(t => {
            const row = document.createElement("div");
            row.className = "token-row";

            row.innerHTML = `
        <div class="token-col">
          <label>Name</label>
          <input data-field="Name" data-id="${t.Id}" value="${escapeAttr(t.Name)}" placeholder=" " />
        </div>
        <div class="token-col">
          <label>Value</label>
          <input data-field="Value" data-id="${t.Id}" value="${escapeAttr(t.Value ?? "")}" placeholder=" " />
        </div>
        <div class="token-col token-actions">
          <button type="button" class="btn danger" data-remove="${t.Id}">Remove</button>
        </div>
      `;

            tokenList.appendChild(row);
        });

        tokenList.querySelectorAll("input[data-field]").forEach(inp => {
            inp.addEventListener("input", () => {
                const id = inp.getAttribute("data-id");
                const field = inp.getAttribute("data-field");
                const tok = tokens.find(x => x.Id === id);
                if (!tok) return;

                tok[field] = inp.value; // Name / Value
                renderChips();          // update chips instantly
                refreshBubbles();       // update bubbles label + placeholder
                saveTokens();
            });

            // extra safety: prevent drop into inputs
            inp.addEventListener("drop", (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        tokenList.querySelectorAll("button[data-remove]").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-remove");
                tokens = tokens.filter(t => t.Id !== id);
                removeBubblesById(id);
                renderAll();
                saveTokens();
                syncTemplateToHidden();
            });
        });
    }

    function renderChips() {
        tokenChips.innerHTML = "";

        tokens.forEach(t => {
            const chip = document.createElement("div");
            chip.className = "token";
            chip.draggable = true;

            const label = (t.Name || "Token").trim() || "Token";
            chip.textContent = label;
            chip.title = makePlaceholderFromName(t.Name);

            chip.dataset.id = t.Id;

            chip.addEventListener("dragstart", e => {
                isDraggingToken = true;
                e.dataTransfer.setData("text/plain", t.Id);
                e.dataTransfer.effectAllowed = "copy";
            });

            chip.addEventListener("dragend", () => {
                setTimeout(() => (isDraggingToken = false), 0);
            });

            chip.addEventListener("click", () => {
                if (isDraggingToken) return;
                insertBubble(t.Id);
                editor.focus();
                syncTemplateToHidden();
            });

            tokenChips.appendChild(chip);
        });
    }

    // ONLY editor accepts drop
    editor.addEventListener("dragover", e => e.preventDefault());

    editor.addEventListener("drop", e => {
        e.preventDefault();
        e.stopPropagation();
        const id = e.dataTransfer.getData("text/plain");
        insertBubble(id);
        editor.focus();
        syncTemplateToHidden();
    });

    editor.addEventListener("input", syncTemplateToHidden);

    const form = editor.closest("form");
    if (form) form.addEventListener("submit", () => {
        syncTemplateToHidden();
        saveTokens();
    });

    function insertBubble(tokenId) {
        const t = tokens.find(x => x.Id === tokenId);
        if (!t) return;

        const span = document.createElement("span");
        span.className = "bubble";
        span.setAttribute("contenteditable", "false");
        span.dataset.id = t.Id;
        span.dataset.ph = makePlaceholderFromName(t.Name);
        span.textContent = (t.Name || "Token").trim() || "Token";

        const space = document.createTextNode(" ");

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            editor.appendChild(span);
            editor.appendChild(space);
            return;
        }

        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(space);
        range.insertNode(span);

        range.setStartAfter(space);
        range.setEndAfter(space);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function refreshBubbles() {
        editor.querySelectorAll(".bubble").forEach(b => {
            const id = b.dataset.id;
            const t = tokens.find(x => x.Id === id);
            if (!t) return;

            b.textContent = (t.Name || "Token").trim() || "Token";
            b.dataset.ph = makePlaceholderFromName(t.Name);
        });
        syncTemplateToHidden();
    }

    function removeBubblesById(id) {
        editor.querySelectorAll(`.bubble[data-id="${cssEscape(id)}"]`).forEach(b => b.remove());
    }

    function syncTemplateToHidden() {
        const clone = editor.cloneNode(true);
        clone.querySelectorAll(".bubble").forEach(b => {
            const ph = (b.dataset.ph || "").trim();
            b.replaceWith(document.createTextNode(ph));
        });
        templateHidden.value = clone.textContent || "";
    }

    function saveTokens() {
        tokensJsonInput.value = JSON.stringify(tokens);
    }

    function makePlaceholderFromName(name) {
        return "{{" + slug(name || "") + "}}";
    }

    function slug(s) {
        s = String(s || "").trim().toLowerCase();
        if (!s) return "token";

        let out = "";
        let lastUnderscore = false;

        for (const ch of s) {
            const ok = (ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9");
            if (ok) {
                out += ch;
                lastUnderscore = false;
            } else {
                if (!lastUnderscore) {
                    out += "_";
                    lastUnderscore = true;
                }
            }
        }

        out = out.replace(/^_+|_+$/g, "");
        return out || "token";
    }

    function isInsideEditor(el) {
        if (!el) return false;
        const node = el.nodeType === 3 ? el.parentElement : el; // text node fix
        return node === editor || editor.contains(node);
    }

    function normalizeTokens(arr) {
        // accept {id,name,value} or {Id,Name,Value}
        return (arr || []).map(x => ({
            Id: x.Id ?? x.id ?? cryptoId(),
            Name: x.Name ?? x.name ?? "Token",
            Value: x.Value ?? x.value ?? ""
        }));
    }

    function safeParse(s) {
        try { return JSON.parse(s || "[]"); } catch { return []; }
    }

    function cryptoId() {
        return (crypto?.randomUUID?.() || ("t" + Math.random().toString(16).slice(2)));
    }

    function escapeAttr(s) {
        return String(s ?? "").replaceAll('"', "&quot;");
    }

    function cssEscape(s) {
        return String(s).replace(/"/g, '\\"');
    }
})();

async function copyOutput() {
    const out = document.getElementById("outputArea");
    if (!out) return;

    const text = out.value || "";
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        out.focus();
        out.select();
        document.execCommand("copy");
    }
}