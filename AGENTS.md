# 2D Spill - Project Instructions

## Om prosjektet
Et 2D hinderløype-spill for barn med et lekent design.
Spilleren er en rund figur som styres med W, A, S og D.
Røde firkanter er farlige hindere som sender spilleren tilbake til start.
Gullfirkanten på andre siden fullfører nivået og åpner for neste nivå.
ESC åpner en grå, litt gjennomsiktig meny med valg for å fortsette og bytte spillerfarge.

## Hvem du jobber med
Den som jobber med dette prosjektet er et barn og trenger derfor litt ekstra assistanse.
Forklar valg enkelt og konkret, og hjelp til med neste steg i stedet for bare å peke på feil.
Still ofte spørsmål for å sjekke forståelse og retning, men ikke still for mange spørsmål på en gang.
Spør helst 1-2 korte spørsmål om gangen.

## Kodebase-oversikt
Les `README.agent` for en fullstendig orientering om arkitektur, komponenter, typer, logikk og kjente bugs - uten å måtte lese all kildekode.

## Tech stack
- React with Vite
- pnpm for package management
- Jest for testing
- Styling: Tailwind CSS
- Language: Norwegian (UI text in Norwegian)
- Do not use Next.js

## Responsive design
The app must work in desktop and mobile browsers.

## Code guidelines
- Write and run tests incrementally (TDD) - tests should fail before implementing functionality. Use Jest.
- Prefer reasonably short functions.
- Avoid duplicated code.
- Prefer good variable and function/component names over comments. Use comments to explain concepts.

## Review process (after implementing 1-5 passing tests for a coherent concept)
Let a subagent with a fresh context run the review.

### Phase 1: Look for errors and potential problems
Review the code for bugs. Follow the testing guidelines above.

### Phase 2: Refactor
This should not change behavior - run tests to verify.
- Factor out code duplication.
- Improve naming of concepts.
- Break up code into more manageable pieces.

### Phase 3: Future proofing
A common experience with vibed code is that it might look nice and be understandable, but that it somehow resists changing in the future. Look for signs of this and improve the code if not found by the previous phases.

# Commit after implementing a prompt
- The commit message should start with a short summary of what has been done.
- The prompt should be included at the end of the commit message.
- Never change the git history.
