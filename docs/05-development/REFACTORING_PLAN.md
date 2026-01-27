# PropertyWizard Refactoring Plan

## Current State
- Single file: `PropertyWizard.tsx` with **2946 lines** (155KB)
- Contains main wizard + 8 step components all in one file

## Target Structure

```
src/components/PropertyWizard/
├── index.tsx                    # Main PropertyWizard component (~300 lines)
├── PropertyWizard.styles.css    # Extracted CSS styles
├── types.ts                     # Shared types and interfaces
├── constants.ts                 # Mock data, step definitions
│
├── steps/                       # Step components
│   ├── BasicInfoStep.tsx        # (~130 lines)
│   ├── LocationStep.tsx         # (~110 lines)
│   ├── ContentStep.tsx          # (~450 lines) - has AI generation
│   ├── ImagesStep.tsx           # (~260 lines)
│   ├── RoomsStep.tsx            # (~400 lines)
│   ├── AmenitiesStep.tsx        # (~260 lines)
│   ├── RatesStep.tsx            # (~540 lines)
│   ├── PoliciesStep.tsx         # (~490 lines)
│   └── index.ts                 # Re-exports all steps
│
└── hooks/                       # Custom hooks (if needed)
    └── usePropertyWizard.ts     # State management logic
```

## Benefits
1. **Code splitting** - Each step can be lazy loaded
2. **Maintainability** - Easy to find and edit specific steps
3. **Testing** - Each step can be unit tested independently
4. **Performance** - Smaller bundle sizes with tree shaking

## Refactoring Steps

### Phase 1: Setup Structure (Low Risk)
1. Create `PropertyWizard/` directory
2. Create `types.ts` with shared interfaces
3. Create `constants.ts` with mock data and step definitions
4. Create `PropertyWizard.styles.css` with extracted styles

### Phase 2: Extract Steps (Medium Risk)
5. Extract `BasicInfoStep.tsx`
6. Extract `LocationStep.tsx`
7. Extract `ContentStep.tsx`
8. Extract `ImagesStep.tsx`
9. Extract `RoomsStep.tsx`
10. Extract `AmenitiesStep.tsx`
11. Extract `RatesStep.tsx`
12. Extract `PoliciesStep.tsx`

### Phase 3: Main Component (High Risk)
13. Create new `index.tsx` with imports
14. Test all functionality
15. Delete old `PropertyWizard.tsx`

## Estimated Effort
- **Phase 1**: 30 minutes
- **Phase 2**: 2 hours
- **Phase 3**: 1 hour
- **Total**: ~3.5 hours

## Notes
- This is a significant refactoring task
- Should be done carefully with proper testing
- Consider doing it over multiple sessions
