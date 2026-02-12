
## Summary
https://github.com/bpmbpm/rdf-grapher/pull/385

This PR refactors all 4 Smart Design modules to comply with the file naming conventions defined in `file_naming.md`. These modules previously had UI functions mixed with business logic, which violates the requirement that UI functions should be in `_ui.js` files.

### Modules Refactored

#### 1. `3_sd_del_concept_individ` (initial commit)
- **Created `3_sd_del_concept_individ_ui.js`** containing modal window functions, event handlers, form builders, dropdown fillers, validation display, SPARQL display, and message functions
- **Refactored `3_sd_del_concept_individ_logic.js`** keeping only constants, state variables, and SPARQL/data functions

#### 2. `3_sd_create_new_individ` (22 UI functions - CRITICAL priority)
- **Created `3_sd_create_new_individ_ui.js`** containing:
  - Modal functions: `openNewIndividModal`, `closeNewIndividModal`
  - Event handlers: `onNewIndividTypeChange`, `onNewIndividTrigChange`, `onNewIndividConceptChange`, etc.
  - Form builders: `buildNewIndividForm`, `buildIndividTypeSelector`, `buildTrigSelectorForIndivid`, etc.
  - Dropdown fillers: `fillNewIndividTrigDropdown`, `fillNewIndividConceptDropdown`, `fillHasNextDropdown`, etc.
  - SPARQL display: `createNewIndividSparql`, `displayNewIndividIntermediateSparql`, `toggleNewIndividIntermediateSparql`
  - Message functions: `showNewIndividMessage`, `hideNewIndividMessage`
- **Refactored `3_sd_create_new_individ_logic.js`** keeping only constants (`NEW_INDIVID_TYPES`, `NEW_INDIVID_CONFIG`), state variables, and data functions

#### 3. `3_sd_create_new_concept` (15 UI functions)
- **Created `3_sd_create_new_concept_ui.js`** containing:
  - Modal functions: `openNewConceptModal`, `closeNewConceptModal`, `resetNewConceptForm`
  - Event handlers: `onNewConceptTypeChange`, `onNewConceptTypeSelect`, `onLabelInput`, `onParentChange`, etc.
  - Form builders: `buildNewConceptForm`, `buildConceptTypeSelector`, `buildLabelField`, `buildPredicateField`, `buildParentSelector`
  - SPARQL display: `createNewConceptSparql`, `displayNewConceptIntermediateSparql`, `toggleNewConceptIntermediateSparql`
  - Message functions: `showNewConceptMessage`, `hideNewConceptMessage`
- **Refactored `3_sd_create_new_concept_logic.js`** keeping only configuration, state variables, SPARQL constants, and data/validation functions

#### 4. `3_sd_create_new_trig` (10 UI functions)
- **Created `3_sd_create_new_trig_ui.js`** containing:
  - Modal functions: `openNewTrigModal`, `closeNewTrigModal`, `resetNewTrigForm`
  - Dropdown/form functions: `populateProcessConceptsWithDouble`, `updateNewTrigFields`
  - Event handler: `createNewTrig`
  - SPARQL display: `displayNewTrigIntermediateSparql`, `toggleNewTrigIntermediateSparql`
  - Message functions: `showNewTrigMessage`, `hideNewTrigMessage`
- **Refactored `3_sd_create_new_trig_logic.js`** keeping only SPARQL query constants and state variables

### Updated `index.html`
Added script tags for all 3 new `_ui.js` files (in correct load order after their respective `_logic.js` files):
- `3_sd/3_sd_create_new_concept/3_sd_create_new_concept_ui.js`
- `3_sd/3_sd_create_new_trig/3_sd_create_new_trig_ui.js`
- `3_sd/3_sd_create_new_individ/3_sd_create_new_individ_ui.js`

### File Naming Compliance

All Smart Design submodules now follow the convention:
- `_logic.js`: business logic, state variables, data functions, algorithms
- `_ui.js`: rendering, event handling, DOM interaction, modal management
- `_sparql.js`: SPARQL queries (where applicable)
