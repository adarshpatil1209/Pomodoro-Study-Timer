# Graph Report - pomo  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 957 nodes · 1392 edges · 89 communities (60 shown, 29 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b5e256d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- gray
- search
- slide_search_core.py
- color
- dependencies
- spacing
- TestTailwindConfigGenerator
- useAuth
- html-token-validator.py
- MainApp.jsx
- BM25
- TailwindConfigGenerator
- generate-slide.py
- DesignSystemGenerator
- fetch-background.py
- design_system.py
- icon/generate.py
- fontSize
- Stats.jsx
- TestShadcnInstaller
- extract-colors.cjs
- validate-asset.cjs
- card
- validate-tokens.cjs
- ShadcnInstaller
- .check_shadcn_config
- .generate_config_string
- inject-brand-context.cjs
- embed-tokens.cjs
- primitive
- patch
- test_tailwind_config_gen.py
- search
- supabase.js
- LandingPage.jsx
- logo/generate.py
- generate-tokens.cjs
- button
- ._base_config
- sync-brand-to-tokens.cjs
- _run
- BM25
- input
- semantic
- radius
- format_ascii_box
- useTimer.js
- shadow
- TodoList.jsx
- useStats.js
- design-tokens-starter.json
- $type
- lg
- padding-y
- radius
- xl
- md
- none
- MusicPlayer.jsx
- test_sync_brand_to_tokens.py
- main
- .__init__
- .temp_project
- vercel.json
- .test_add_components_no_config
- .test_list_installed_with_components
- .test_init_default_project_root
- .test_init_dry_run
- .test_check_shadcn_config_not_exists
- .test_get_installed_components_empty
- .test_add_components_no_components
- .test_add_fonts
- .test_recommend_plugins
- .test_recommend_plugins_nextjs
- .test_init_default_typescript
- .test_generate_javascript_config
- .test_generate_config_with_colors
- .test_generate_config_with_plugins
- .test_validate_config_valid
- .test_validate_config_no_content
- .test_write_config_creates_content
- .test_write_config_invalid_path
- .test_full_configuration_typescript
- .test_default_output_path_typescript
- .test_base_config_structure
- .test_default_content_paths_react
- .test_default_content_paths_vue
- format_output

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 58 edges
2. `TestTailwindConfigGenerator` - 35 edges
3. `ShadcnInstaller` - 34 edges
4. `TestShadcnInstaller` - 26 edges
5. `useAuth()` - 25 edges
6. `color` - 15 edges
7. `supabase` - 13 edges
8. `search_with_context()` - 12 edges
9. `gray` - 12 edges
10. `spacing` - 12 edges

## Surprising Connections (you probably didn't know these)
- `TestGeneratedConfigIsValidJs` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestTailwindConfigGenerator` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestShadcnInstaller` --uses--> `ShadcnInstaller`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_shadcn_add.py → .agents/skills/ui-styling/scripts/shadcn_add.py
- `_generate_intelligent_overrides()` --calls--> `search()`  [EXTRACTED]
  .agents/skills/ui-ux-pro-max/scripts/design_system.py → .agents/skills/ui-ux-pro-max/scripts/core.py
- `CalendarTodos()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/CalendarTodos.jsx → src/contexts/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (89 total, 29 thin omitted)

### Community 0 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 1 - "search"
Cohesion: 0.07
Nodes (42): BM25, detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection (+34 more)

### Community 2 - "slide_search_core.py"
Cohesion: 0.08
Nodes (36): format_context(), format_result(), main(), Format a single search result for display, Format contextual recommendations for display., BM25, calculate_pattern_break(), detect_domain() (+28 more)

### Community 3 - "color"
Cohesion: 0.05
Nodes (37): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+29 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (36): canvas-confetti, framer-motion, lucide-react, dependencies, canvas-confetti, framer-motion, lucide-react, react (+28 more)

### Community 5 - "spacing"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 6 - "TestTailwindConfigGenerator"
Cohesion: 0.06
Nodes (16): Test adding colors multiple times., Test adding full color palette., Test adding custom spacing., Test adding custom breakpoints., Test TailwindConfigGenerator class., Test generating TypeScript configuration., Test validating config with empty theme extensions., Test writing configuration to file. (+8 more)

### Community 7 - "useAuth"
Cohesion: 0.14
Nodes (20): App(), ClockLoader(), AuthContext, AuthProvider(), useAuth(), useRoom(), useTodos(), AuthPage() (+12 more)

### Community 8 - "html-token-validator.py"
Cohesion: 0.13
Nodes (24): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+16 more)

### Community 9 - "MainApp.jsx"
Cohesion: 0.13
Nodes (15): AIChat(), QUICK_QUESTIONS, EndOfDayModal(), formatHours(), getRandomQuote(), QUOTES, SessionBanner(), useSessionBanner() (+7 more)

### Community 10 - "BM25"
Cohesion: 0.11
Nodes (19): BM25, detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+11 more)

### Community 11 - "TailwindConfigGenerator"
Cohesion: 0.10
Nodes (12): main(), Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate Tailwind CSS configuration files., Validate configuration. Returns: Tuple of (valid, message) (+4 more)

### Community 12 - "generate-slide.py"
Cohesion: 0.15
Nodes (19): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+11 more)

### Community 13 - "DesignSystemGenerator"
Cohesion: 0.14
Nodes (11): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None., Generates design system recommendations from aggregated searches. (+3 more)

### Community 14 - "fetch-background.py"
Cohesion: 0.17
Nodes (17): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+9 more)

### Community 15 - "design_system.py"
Cohesion: 0.18
Nodes (16): _detect_page_type(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides(), persist_design_system(), Format a page-specific override file with intelligent AI-generated content. (+8 more)

### Community 16 - "icon/generate.py"
Cohesion: 0.20
Nodes (15): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+7 more)

### Community 17 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 18 - "Stats.jsx"
Cohesion: 0.14
Nodes (10): DAY_LABELS, formatHours(), parseWeekly(), Stats(), WeeklyChart(), CircularRing(), MODES, pad() (+2 more)

### Community 19 - "TestShadcnInstaller"
Cohesion: 0.14
Nodes (8): Test adding components in dry run mode., Test ShadcnInstaller class., Test adding all components without config., Test listing installed components without config., Test listing installed components when none exist., Test checking for existing shadcn config., Test getting installed components without config., TestShadcnInstaller

### Community 20 - "extract-colors.cjs"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 21 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 22 - "card"
Cohesion: 0.18
Nodes (13): $type, $value, border, padding, radius, shadow, border, card (+5 more)

### Community 23 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 24 - "ShadcnInstaller"
Cohesion: 0.20
Nodes (7): main(), Handle shadcn/ui component installation., ShadcnInstaller, Tests for shadcn_add.py, Test adding components that are already installed., Test initialization with custom project root., Test getting installed components when files exist.

### Community 25 - ".check_shadcn_config"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 26 - ".generate_config_string"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 27 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 28 - "embed-tokens.cjs"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 29 - "primitive"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 30 - "patch"
Cohesion: 0.18
Nodes (6): Test adding components with overwrite flag., Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 31 - "test_tailwind_config_gen.py"
Cohesion: 0.22
Nodes (8): Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs, parametrize

### Community 32 - "search"
Cohesion: 0.25
Nodes (10): detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search stack-specific guidelines, search() (+2 more)

### Community 33 - "supabase.js"
Cohesion: 0.27
Nodes (6): CalendarTodos(), ChatWidget(), attachDebugListeners(), ICE_SERVERS, useWebRTC(), supabase

### Community 34 - "LandingPage.jsx"
Cohesion: 0.18
Nodes (3): features, LandingPage(), steps

### Community 35 - "logo/generate.py"
Cohesion: 0.29
Nodes (9): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main(), Enhance the logo prompt with style and industry modifiers, Generate a logo using Gemini models with image generation Args: aspect_ratio:…, Generate multiple logo variants with different styles (+1 more)

### Community 36 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 37 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 38 - "._base_config"
Cohesion: 0.22
Nodes (6): Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 39 - "sync-brand-to-tokens.cjs"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 40 - "_run"
Cohesion: 0.28
Nodes (8): Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), CompletedProcess

### Community 41 - "BM25"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 42 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 43 - "semantic"
Cohesion: 0.25
Nodes (8): $type, $value, $type, $value, semantic, spacing, component, section

### Community 44 - "radius"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, default, full, default

### Community 45 - "format_ascii_box"
Cohesion: 0.25
Nodes (8): ansi_ljust(), format_ascii_box(), hex_to_ansi(), Convert hex color to ANSI True Color swatch (██) with fallback., Like str.ljust but accounts for zero-width ANSI escape sequences., Create a Unicode section separator: ├─── NAME ───...┤, Format design system as Unicode box with ANSI color swatches., section_header()

### Community 46 - "useTimer.js"
Cohesion: 0.48
Nodes (6): clearState(), playBell(), playSineFallback(), PRESETS, saveState(), useTimer()

### Community 47 - "shadow"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 48 - "TodoList.jsx"
Cohesion: 0.40
Nodes (3): getTodayStr(), SUBJECTS, TodoList()

### Community 49 - "useStats.js"
Cohesion: 0.60
Nodes (5): getTodayStr(), getYesterdayStr(), normalizeDateStr(), parseWeekly(), useStats()

### Community 50 - "design-tokens-starter.json"
Cohesion: 0.40
Nodes (4): component, dark, semantic, $schema

### Community 51 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, bg, bg, bg

### Community 52 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 53 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 54 - "radius"
Cohesion: 0.67
Nodes (4): radius, radius, $type, $value

### Community 55 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 56 - "md"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 57 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 58 - "MusicPlayer.jsx"
Cohesion: 0.67
Nodes (3): extractVideoId(), MusicPlayer(), PRESETS

## Knowledge Gaps
- **161 isolated node(s):** `$type`, `$value`, `$type`, `$value`, `$type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `primitive` connect `primitive` to `gray`, `spacing`, `radius`, `shadow`, `fontSize`, `design-tokens-starter.json`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `color` connect `gray` to `primitive`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `semantic` connect `semantic` to `design-tokens-starter.json`, `color`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$type`, `$value`, `$type` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `gray` be split into smaller, more focused modules?**
  _Cohesion score 0.05370101596516691 - nodes in this community are weakly interconnected._
- **Should `search` be split into smaller, more focused modules?**
  _Cohesion score 0.0653061224489796 - nodes in this community are weakly interconnected._