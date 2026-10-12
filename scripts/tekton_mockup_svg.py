#!/usr/bin/env python3
"""Tekton app layout reference — SVG mockup generator.

Renders the editor's anatomy (as shipped in src/) at 1440x900 using the exact
palette/type values from the code (Tekhne Ash family + brand blues + the
rendered artifact's blueprint palette). Output: design/mockups/*.svg.

The SVGs are design references: import into Penpot (File > import), embed in
specs, or open directly. Every coordinate mirrors the real app's geometry.
File layout (from src/App.tsx):
  AppHeader 0-44 · [rail | toolbar 44-92 · canvas band 92-816 · terminal 816-856
  · StatusFooter 856-900].
"""

BODY = "Plus Jakarta Sans, Inter, sans-serif"
MONO = "JetBrains Mono, monospace"

INK = "#141B3D"; INK_SOFT = "#455670"; NIGHT = "#17256D"; SLATE = "#566B8E"
CHROME_BG = "#111827"; PANEL_BG = "#1F2937"; DEEP_BG = "#0B0F1A"; INPUT_BG = "#0B121B"
BORDER = "#374151"; BORDER_SOFT = "#E3E8F1"

L_LOGO = (  # the Tekton mark (blueprint sheet) — paths from Resources/logo
    '<path fill="#1B3954" d="M121.1,405.34c-3.87,0-7-3.13-7-7c0-23.88-19.42-43.3-43.3-43.3s-43.3,19.42-43.3,43.3c0,3.87-3.13,7-7,7'
    's-7-3.13-7-7V113.66c0-31.6,25.7-57.3,57.3-57.3s57.3,25.7,57.3,57.3v284.68C128.1,402.21,124.97,405.34,121.1,405.34z'
    ' M70.8,341.04c17.27,0,32.79,7.68,43.3,19.81V113.66c0-23.88-19.42-43.3-43.3-43.3s-43.3,19.42-43.3,43.3v247.19C38.01,348.72,53.53,341.04,70.8,341.04z"/>'
    '<path fill="#1B3954" d="M491.5,455.64c-3.87,0-7-3.13-7-7V120.66H128.1v277.68c0,3.87-3.13,7-7,7s-7-3.13-7-7'
    'c0-23.88-19.42-43.3-43.3-43.3s-43.3,19.42-43.3,43.3c0,23.88,19.42,43.3,43.3,43.3h380.67c3.87,0,7,3.13,7,7s-3.13,7-7,7H70.8'
    'c-31.59,0-57.3-25.7-57.3-57.3c0-31.6,25.71-57.3,57.3-57.3c17.27,0,32.79,7.68,43.3,19.81V113.66c0-3.87,3.13-7,7-7h370.4'
    'c3.87,0,7,3.13,7,7v334.98C498.5,452.51,495.37,455.64,491.5,455.64z"/>'
    '<path fill="#1B3954" d="M227.3,235.68h-68.43c-3.87,0-7-3.13-7-7v-68.43c0-3.87,3.13-7,7-7h68.43c3.87,0,7,3.13,7,7v68.43'
    'C234.3,232.55,231.16,235.68,227.3,235.68z M165.87,221.68h54.43v-54.43h-54.43V221.68z"/>'
    '<path fill="#16ADE1" d="M286.53,405.73H234.7c-3.87,0-7-3.13-7-7s3.13-7,7-7h44.83V278.07H165.87v113.66h9.34c3.87,0,7,3.13,7,7'
    's-3.13,7-7,7h-16.34c-3.87,0-7-3.13-7-7V271.07c0-3.87,3.13-7,7-7h127.66c3.87,0,7,3.13,7,7v127.66C293.53,402.59,290.4,405.73,286.53,405.73z"/>'
    '<path fill="#1B3954" d="M368.23,409.04h-38.3c-3.87,0-7-3.13-7-7V271.07c0-3.87,3.13-7,7-7h38.3c3.87,0,7,3.13,7,7v130.98'
    'C375.23,405.91,372.1,409.04,368.23,409.04z M336.94,395.04h24.3V278.07h-24.3V395.04z"/>'
    '<path fill="#1B3954" d="M436.66,409.04h-38.3c-3.87,0-7-3.13-7-7V271.07c0-3.87,3.13-7,7-7h38.3c3.87,0,7,3.13,7,7v130.98'
    'C443.66,405.91,440.53,409.04,436.66,409.04z M405.36,395.04h24.3V278.07h-24.3V395.04z"/>'
    '<path fill="#1B3954" d="M67.81,314.87c-3.87,0-7-3.13-7-7V121.32c0-3.87,3.13-7,7-7s7,3.13,7,7v186.55C74.81,311.74,71.67,314.87,67.81,314.87z"/>'
    '<path fill="#16ADE1" d="M67.81,106.24c-1.85,0-3.65-0.75-4.95-2.05c-1.3-1.31-2.05-3.11-2.05-4.95c0-1.85,0.75-3.65,2.05-4.95'
    'c1.62-1.63,4.04-2.37,6.32-1.92c0.44,0.09,0.88,0.23,1.31,0.4c0.42,0.18,0.82,0.39,1.2,0.65c0.39,0.25,0.75,0.54,1.07,0.87'
    'c1.3,1.3,2.05,3.1,2.05,4.95c0,1.84-0.75,3.64-2.05,4.95c-0.32,0.32-0.68,0.61-1.07,0.87c-0.38,0.25-0.78,0.47-1.2,0.64'
    'c-0.43,0.18-0.87,0.31-1.31,0.4C68.73,106.19,68.27,106.24,67.81,106.24z"/>'
)

# rail icon glyphs (24x24 stroke boxes, lucide-inspired minimals)
GLYPHS = {
    "file-plus":  ('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 9v6M9 12h6"/>', False),
    "folder-open": ('<path d="M3 7h6l2 3h10v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"/>', False),
    "save":       ('<path d="M5 3h12l4 4v14H5z"/><rect x="8" y="15" width="8" height="5"/>', False),
    "braces":     ('<text x="12" y="17" font-size="13" font-weight="700" text-anchor="middle">{ }</text>', False),
    "layout-grid":('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/>'
                  '<rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>', False),
    "frame":      ('<path d="M8 2v20M16 2v20M2 8h20M2 16h20"/>', False),
    "shield-check": ('<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>', False),
    "palette":    ('<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2" fill="COLOR" stroke="none"/>'
                  '<circle cx="12" cy="8" r="1.2" fill="COLOR" stroke="none"/><circle cx="15.5" cy="10" r="1.2" fill="COLOR" stroke="none"/>', False),
    "file-code":  ('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M10 12l-2 2 2 2M14 12l2 2-2 2"/>', False),
    "download":   ('<path d="M12 4v10M8 10l4 4 4-4"/><path d="M4 19h16"/>', False),
    "minus":      ('<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>', False),
    "plus":       ('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>', False),
    "maximize":   ('<rect x="5" y="7" width="14" height="10" rx="2"/>', False),
    "rotate-ccw": ('<path d="M4 12a8 8 0 1 1 3 6"/><path d="M4 18v-6h6"/>', False),
    "cpu":        ('<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/>', False),
    "file-output":('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 13l3 3 3-3M12 8v8"/>', False),
    "check":      ('<path d="M5 13l4 4 10-11"/>', False),
    "exit":       ('<path d="M9 4h-3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3M14 8l4 4-4 4M18 12H9"/>', False),
    "x":          ('<path d="M6 6l12 12M18 6L6 18"/>', False),
}

def icon(name, x, y, size=20, color="#94A3B8", sw=2.0):
    inner, _ = GLYPHS[name]
    inner = inner.replace("COLOR", color)
    s = size / 24
    return (f'<g transform="translate({x},{y}) scale({s:.3f})" stroke="{color}" stroke-width="{sw / 1}" '
            f'fill="none" stroke-linecap="round" stroke-linejoin="round">{inner}</g>')

def T(x, y, s, size=12, weight=400, color="#FFFFFF", family=BODY, ls=0, caps=False, anchor="start", opacity=None):
    txt = s.upper() if caps else s
    esc = txt.replace("&", "&amp;").replace("<", "&lt;")
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    o = f' opacity="{opacity}"' if opacity is not None else ""
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" '
            f'fill="{color}" letter-spacing="{ls}"{a}{o}>{esc}</text>')

def R(x, y, w, h, fill, rx=0, stroke=None, sw=1, dashed=False, opacity=None):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    st += ' stroke-dasharray="5 5"' if dashed else ""
    op = f' opacity="{opacity}"' if opacity is not None else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{st}{op}/>'

STAGES = [
    ("1", "Signal", "Observe storefront behavior and operations"),
    ("2", "Analyze", "Prioritize evidence-backed opportunities"),
    ("3", "Prepare", "Build constrained change proposals"),
    ("4", "Approve", "Human decision and release gate"),
    ("5", "Measure", "Monitor performance and iterate"),
]
ROWS = [
    ("Customer actions", "WHAT SHOPPERS DO", None, None, [
        ("Browse and compare", "Explore mattress products and offers"),
        ("Consider options", "Review details and product information"),
        ("Experience page content", "Interact with the current storefront"),
        ("Continue shopping", "Only approved changes become visible"),
        ("Respond to experience", "Browse, convert, or abandon")]),
    ("Frontstage experience", "WHAT CUSTOMERS SEE", None, None, [
        ("Shopify storefront", "Product and collection pages"),
        ("Existing site experience", "Observable navigation and content"),
        ("Preview environment", "Proposed variants are not public"),
        ("Approved publication", "Published Shopify changes only"),
        ("Updated storefront", "Live experience measured")]),
    ("AI agent workflow", "AGENT-PREPARED WORK", "#F3F0FF", "— Line of interaction —", [
        ("Signal intake", "Receive approved behavioral and CRM signals"),
        ("Recommendation agent", "Rank friction points and opportunities"),
        ("Site operations agent", "Package component and content variants"),
        ("Hold for review", "No autonomous production publishing"),
        ("Evaluation support", "Summarize performance and next actions")]),
    ("Backstage human actions", "UX AND MERCHANDISING TEAMS", None, "— Line of visibility —", [
        ("UX and merchandising", "Set objectives and research questions"),
        ("Research and prioritization", "Validate signals and recommendation relevance"),
        ("Design and content review", "Inspect brand, UX and accessibility"),
        ("Human command", "Approve, revise, or reject change"),
        ("UX and commerce review", "Interpret results and decide next iteration")]),
    ("Supporting systems", "TOOLS AND INFRASTRUCTURE", "#EFF9F8", "— Line of internal interaction —", [
        ("Shopify DTC", "Storefront and CRM"),
        ("Analytics instrumentation", "Behavioral tracking and analysis"),
        ("Agent-ready design system", "Tokens, components, brand constraints"),
        ("Review and release workflow", "Approval surface and deployment path"),
        ("Monitoring and rollback", "Performance checks and reversibility")]),
    ("Evidence and data", "SIGNALS AND TRACEABILITY", "#F3F8FF", None, [
        ("Behavioral signals", "Views, journeys and drop-off events"),
        ("CRM + analytics", "Ranked, source-linked recommendations"),
        ("Change specification", "Variant, rationale and test brief"),
        ("Decision record", "Reviewer, status, rationale and version"),
        ("Experiment measures", "Conversion and operational velocity")]),
    ("Governance", "CONTROLS AND APPROVAL", "#FFF3E9", "— Control and accountability boundary —", [
        ("Data access boundaries", "Approved sources and privacy constraints"),
        ("Evidence traceability", "Every recommendation linked to signals"),
        ("Preflight checks", "Brand, accessibility and component rules"),
        ("Mandatory approval gate", "Explicit human sign-off before production"),
        ("Audit and rollback", "Review impact and revert if necessary")]),
    ("Service outcomes", "EXPECTED OR REPORTED VALUE", "#F0FBF4", None, [
        ("Opportunity visibility", "Find actionable storefront friction"),
        ("Prioritized work", "Less distance between insight and action"),
        ("Faster prototyping", "Reported page updates prepared in hours"),
        ("Controlled deployment", "Zero unreviewed agent changes published"),
        ("Continuous improvement", "Operational and conversion targets monitored")]),
]

BAND_TOP, BAND_H = 92, 724
TERM_Y, FOOT_Y, FOOT_H = 816, 856, 44

def board_default(panel_open=True, rail_expanded=False):
    out = [R(0, 0, 1440, 900, DEEP_BG)]

    # AppHeader
    out.append(R(0, 0, 1440, 44, CHROME_BG))
    out.append(f'<line x1="0" y1="44.5" x2="1440" y2="44.5" stroke="{BORDER}"/>')
    out.append(f'<g transform="translate(16,9) scale(0.043)">{L_LOGO}</g>')
    out.append(T(46, 27, "TEKTON", 12, 800, "#FFFFFF", ls=3))
    out.append(T(104, 27, "SERVICE BLUEPRINT STUDIO", 9, 700, "#6B7280", ls=2))
    out.append(R(216, 12, 1, 20, BORDER))
    out.append(R(230, 11, 172, 22, PANEL_BG, 6, BORDER))
    out.append(T(238, 25, "agentic-ai-ecommerce", 10, 400, "#94A3B8", MONO))
    out.append(T(1424, 25, "STANDALONE", 9, 400, "#6B7280", MONO, ls=2, anchor="end"))

    # rail
    rail_w = 240 if rail_expanded else 56
    out.append(R(0, 44, rail_w, 900 - 44, CHROME_BG))
    out.append(f'<line x1="{rail_w + 0.5}" y1="44" x2="{rail_w + 0.5}" y2="900" stroke="{BORDER}"/>')
    out.append(R(rail_w // 2 - 20, 52, 40, 40, "#FFFFFF", 8))
    out.append(f'<g transform="translate({rail_w // 2 - 13},{59}) scale(0.05)">{L_LOGO}</g>')
    out.append(R(rail_w // 2 - 14, 44 + 56, 28, 1, BORDER))

    groups = [
        ("DOCUMENT", [
            ("file-plus", "NEW BLUEPRINT", "Pick starter or example", False, False),
            ("folder-open", "OPEN BLUEPRINT", ".yaml or .json file", False, False),
            ("save", "SAVE", "Download current document", False, True),
            ("braces", "SAVE JSON", "Structured format (PIN payload)", False, True),
        ]),
        ("AUTHOR", [
            ("frame", "BLUEPRINT CANVAS", "The workspace", False, False),
            ("layout-grid", "VISUAL ARCHITECT", "The model: metadata, stages, lanes", True, False),
            ("palette", "THEME COLORS", "Live WCAG verdicts", False, False),
            ("file-code", "YAML SOURCE", "The headless layer", False, False),
        ]),
        ("SHIP", [
            ("shield-check", "CONTRAST LINT", "The WCAG 2.2 AA gate — check first", True, False),
            ("download", "EXPORT", "HTML + data layer", False, False),
        ]),
    ]
    y = 44 + 108
    for g_name, g_items in groups:
        out.append(T(14, y + 4, g_name, 9, 800, "#94A3B8", ls=1.8))
        y += 20
        for ic, label, hint, active, disabled in g_items:
            col_icon = "#94A3B8"
            if active:
                col_icon = "#3B82F6"
            if disabled:
                col_icon = "#4B5563"
            out.append(icon(ic, 16, y + 2, 20, col_icon))
            c_label = "#93C5FD" if active else ("#4B5563" if disabled else "#E2E8F0")
            out.append(T(46, y + 18, label, 11, 800, c_label, ls=0.4))
            out.append(T(46, y + 32, hint, 9, 400, "#64748B"))
            y += 48

    mx = rail_w
    main_w = 1440 - mx

    # toolbar
    out.append(R(mx, 44, main_w, 48, CHROME_BG))
    out.append(f'<line x1="{mx}" y1="92.5" x2="1440" y2="92.5" stroke="{BORDER}"/>')
    def pill(x, y, segs, active_idx):
        frag = []
        widths = [len(s) * 6.8 + 22 for s in segs]
        frag.append(R(x, y, sum(widths) + (len(segs) - 1) * 1, 30, PANEL_BG, 6, BORDER))
        cx = x + 1
        for i, s in enumerate(segs):
            w = widths[i]
            if i == active_idx:
                frag.append(R(cx, y + 1, w, 28, "#3B82F6", 4))
                frag.append(T(cx + w / 2, y + 20, s, 11, 600, "#FFFFFF", anchor="middle"))
            else:
                frag.append(T(cx + w / 2, y + 20, s, 11, 600, "#94A3B8", anchor="middle"))
            cx += w
        return frag
    cx = mx + 16
    for segs, ai in [(["Standalone"], 0), (["Data: YAML", "JSON"], 0), (["Build", "Preview"], 0)]:
        out.extend(pill(cx, 55, segs, ai))
        cx += sum(len(s) * 6.8 + 22 for s in segs) + 28
    out.append(T(1440 - 16, 74, "click a card to edit · Esc closes", 10, 400, "#6B7280", MONO, anchor="end"))

    # content band
    if panel_open:
        pw = 400
        px = mx
        out.append(R(px, BAND_TOP, pw, BAND_H, PANEL_BG))
        out.append(f'<line x1="{px + pw - 0.5}" y1="{BAND_TOP}" x2="{px + pw - 0.5}" y2="{BAND_TOP + BAND_H}" stroke="{BORDER}"/>')
        out.append(T(px + 20, BAND_TOP + 22, "VISUAL ARCHITECT", 10, 800, "#FFFFFF", ls=2.5))
        out.append(T(px + 20, BAND_TOP + 36, "Structure the blueprint: metadata, stages, and lanes.", 9, 400, "#6B7280"))
        out.append(R(px + pw - 16, BAND_TOP + 10, 1, 1, "#6B7280"))  # close affordance anchor
        out.append(icon("x", px + pw - 28, BAND_TOP + 12, 16, "#94A3B8", 2))
        out.append(f'<line x1="{px}" y1="{BAND_TOP + 46}" x2="{px + pw}" y2="{BAND_TOP + 46}" stroke="{BORDER}"/>')

        fy = BAND_TOP + 62
        out.append(T(px + 20, fy + 8, "DOCUMENT", 9, 800, "#94A3B8", ls=1.8))
        fy += 18
        def field(fy, label, help_text, value, h=30):
            lines = [T(px + 20, fy + 12, label, 11, 600, "#E2E8F0"),
                     T(px + 20, fy + 27, help_text, 9, 400, "#6B7280", anchor="start"),
                     R(px + 20, fy + 34, pw - 40, h, INPUT_BG, 7, "#2E4053"),
                     T(px + 30, fy + 54, value[:52], 12, 400, "#E2E8F0")]
            return lines, fy + 34 + h + 12
        lines, fy = field(fy, "Tagline", 'The short label above the title — designers call this the "eyebrow".', "Portfolio case study · Future-state service design")
        out.extend(lines)
        lines, fy = field(fy, "Title", "What this blueprint is called — it also becomes the saved file's name.", "AI Agentic Workflows in E-Commerce")
        out.extend(lines)
        lines, fy = field(fy, "Opening sentence", "Frames the service and the moment being designed for.", "Interactive service blueprint for an agentic DTC e-com", h=58)
        out.extend(lines)
        out.append(f'<line x1="{px + 20}" y1="{fy}" x2="{px + pw - 20}" y2="{fy}" stroke="{BORDER}"/>')
        fy += 16
        out.append(T(px + 20, fy + 10, "STAGES", 10, 800, "#94A3B8", ls=2))
        out.append(R(px + 174, fy, 66, 17, "#3B82F6", 99, opacity=0.14))
        out.append(T(px + 207, fy + 13, "5 STAGES", 9, 400, "#93C5FD", MONO, anchor="middle", caps=False))
        fy += 26
        stage_rows = [("Signal", "Observe storefront behavior"), ("Analyze", "Prioritize evidence-backed"),
                      ("Prepare", "Build constrained change"), ("Approve", "Human decision and release"),
                      ("Measure", "Monitor performance and")]
        for name, blurb in stage_rows:
            out.append(R(px + 20, fy, 360, 52, "#0F1B2D", 9, "#2E4053", opacity=0.55))
            out.append(T(px + 29, fy + 30, "⋮⋮", 10, 400, "#64748B"))
            out.append(R(px + 50, fy + 10, 116, 32, INPUT_BG, 7, "#2E4053"))
            out.append(T(px + 58, fy + 30, name, 11, 600, "#E2E8F0"))
            out.append(R(px + 172, fy + 10, 200, 32, INPUT_BG, 7, "#2E4053"))
            out.append(T(px + 180, fy + 30, blurb, 11, 400, "#E2E8F0"))
            out.append(T(px + 371, fy + 30, "×", 12, 400, "#64748B", anchor="end"))
            fy += 44
        out.append(R(px + 20, fy, 360, 30, "none", 8, "#4B5563", dashed=True))
        out.append(T(px + 200, fy + 20, "+ Add stage", 11, 400, "#94A3B8", anchor="middle"))
        canvas_x = mx + pw
    else:
        canvas_x = mx

    # canvas (light)
    canvas_w = 1440 - canvas_x
    out.append(R(canvas_x, BAND_TOP, canvas_w, BAND_H, "#F8FAFC"))
    gx = canvas_x + 20
    gy = BAND_TOP + 20
    gw = min(920, canvas_w - 20)
    out.append(R(gx, gy, gw, 640, "#FFFFFF", 12, "#DBE3EF"))
    COL_L, CELL_W, CELL_H, HEAD_H, DIV_H = 130, 154, 62, 56, 20
    out.append(R(gx, gy, COL_L, HEAD_H, "#161F4C", 12))
    out.append(T(gx + 10, gy + 24, "Service layer ↓", 8, 400, "#FFFFFF", opacity=0.9))
    out.append(T(gx + 10, gy + 40, "Stage →", 8, 400, "#FFFFFF", opacity=0.7))
    sx = gx + COL_L
    for (num, name, blurb) in STAGES:
        out.append(R(sx, gy, CELL_W, HEAD_H, "#EAF1FF"))
        out.append(T(sx + 8, gy + 12, "STAGE " + num, 7, 700, "#94A3B8", ls=1.5))
        out.append(T(sx + 8, gy + 32, name, 13, 800, NIGHT))
        out.append(T(sx + 8, gy + 46, blurb[:40], 8, 400, SLATE))
        sx += CELL_W
    out.append(f'<line x1="{gx}" y1="{gy + HEAD_H}" x2="{gx + gw}" y2="{gy + HEAD_H}" stroke="#E3E8F1"/>')

    y = gy + HEAD_H
    for (label, lbl_blurb, tint, divider, cards) in ROWS:
        if divider:
            out.append(R(gx, y, gw, DIV_H, "#182150"))
            out.append(T(gx + 14, y + 14, divider, 8, 700, "#FFFFFF", ls=2))
            y += DIV_H
        out.append(R(gx, y, COL_L, CELL_H, "#F0F4FA"))
        out.append(f'<line x1="{gx}" y1="{y + CELL_H}" x2="{gx + gw}" y2="{y + CELL_H}" stroke="#E3E8F1"/>')
        out.append(T(gx + 10, y + 28, label, 11, 800, INK))
        out.append(T(gx + 10, y + 44, lbl_blurb[:30], 7, 400, "#5E6D83"))
        cx = gx + COL_L
        for (t1, t2) in cards:
            if t1.startswith("Human command") and not panel_open:
                out.append(R(cx, y, CELL_W, CELL_H, "#FFFFFF", 0, "#3B82F6", 2))
            else:
                out.append(R(cx, y, CELL_W, CELL_H, tint or "#FFFFFF"))
            out.append(f'<line x1="{cx}" y1="{y}" x2="{cx}" y2="{y + CELL_H}" stroke="#E3E8F1"/>')
            out.append(T(cx + 10, y + 24, t1[:30], 10.5, 700, INK))
            out.append(T(cx + 10, y + 40, t2[:40], 8, 400, INK_SOFT))
            cx += CELL_W
        y += CELL_H

    # zoom cluster — bottom-center of the CANVAS
    zx = canvas_x + (canvas_w - 240) // 2
    zy = BAND_TOP + BAND_H - 34 - 14
    out.append(R(zx, zy, 240, 34, PANEL_BG, 8, BORDER, opacity=0.97))
    out.append(icon("minus", zx + 10, zy + 10, 14, "#E2E8F0", 1.8))
    out.append(icon("plus", zx + 34, zy + 10, 14, "#E2E8F0", 1.8))
    out.append(T(zx + 56, zy + 21, "100%", 10, 400, "#E2E8F0", MONO))
    out.append(icon("maximize", zx + 96, zy + 10, 14, "#E2E8F0", 1.8))
    out.append(icon("rotate-ccw", zx + 122, zy + 10, 14, "#E2E8F0", 1.8))
    out.append(icon("frame", zx + 148, zy + 10, 14, "#E2E8F0", 1.8))

    # docked terminal
    out.append(R(0, TERM_Y, 1440, FOOT_Y - TERM_Y, DEEP_BG))
    out.append(f'<line x1="0" y1="{TERM_Y + 0.5}" x2="1440" y2="{TERM_Y + 0.5}" stroke="{BORDER}"/>')
    out.append(T(44, TERM_Y + 26, "▸ AISTHEHKNE CONTRAST LINT", 10, 700, "#FFFFFF", MONO, ls=1))
    out.append(R(250, TERM_Y + 10, 104, 22, "#10B981", 99, opacity=0.16))
    out.append(T(274, TERM_Y + 25, "26 pairs passed", 10, 700, "#34D399"))
    out.append(T(382, TERM_Y + 25, "Target: WCAG 2.2 AA", 9, 400, "#6B7280", MONO))

    # status footer
    out.append(R(0, FOOT_Y, 1440, FOOT_H, CHROME_BG))
    out.append(f'<line x1="0" y1="{FOOT_Y + 0.5}" x2="1440" y2="{FOOT_Y + 0.5}" stroke="{BORDER}"/>')
    out.append(T(44, FOOT_Y + 27, "PHOENIX TEKTON · 2026 · BUILD 0.1.0", 10, 400, "#6B7280", MONO, ls=1))
    out.append(T(320, FOOT_Y + 27, "PORTFOLIO CASE STUDY · FUTURE-STATE", 10, 400, "#94A3B8", MONO, ls=1))
    lx = 876
    for (label, c, ic) in [("Engine · WASM", "#34D399", "cpu"), ("Format · Standalone", "#94A3B8", "file-output"),
                           ("Structure · Valid", "#34D399", "check"), ("WCAG AA · Pass", "#34D399", "shield-check")]:
        out.append(R(lx, FOOT_Y + 9, 148, 26, PANEL_BG, 99, opacity=0.85))
        out.append(f'<circle cx="{lx + 13}" cy="{FOOT_Y + 22}" r="3.5" fill="{c}"/>')
        out.append(icon(ic, lx + 22, FOOT_Y + 15, 12, "#94A3B8", 1.8))
        out.append(T(lx + 40, FOOT_Y + 26, label.upper(), 9, 700, "#E2E8F0", ls=0.8))
        lx += 156

    return "\n".join(out)


def wrap(board_svg, name):
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg width="1440" height="900" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg">'
            f'<title>phoenix-Tekton · {name}</title>{board_svg}</svg>')


if __name__ == "__main__":
    open("design/mockups/tekton-default.svg", "w").write(
        wrap(board_default(panel_open=True), "Default — panel open"))
    open("design/mockups/tekton-rail-expanded.svg", "w").write(
        wrap(board_default(panel_open=True, rail_expanded=True), "Rail expanded — panel open"))
    open("design/mockups/tekton-canvas-focus.svg", "w").write(
        wrap(board_default(panel_open=False), "Canvas focus — panel closed"))
    print("wrote 3 SVGs → design/mockups/")