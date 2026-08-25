# Salary form metadata refactor

## Suggested project structure

```text
sections/
└── salary-calculator-form/
    ├── SalaryCalculatorForm.tsx
    ├── DynamicSalaryFields.tsx
    └── metadata/
        ├── salaryFieldMetadata.ts
        └── salaryFieldConfigs.ts
```

## Responsibilities

### `salaryFieldMetadata.ts`
Contains the metadata model and generic helpers:

- field type (`number`, `checkbox`, `select`)
- contract visibility
- conditional visibility
- dynamic units
- default values
- simple Yup validation generation
- field-change side effects

### `salaryFieldConfigs.ts`
This is the file you normally edit when changing simple form fields.

It currently contains:

- `rateFieldConfigs`
- `taxFieldConfigs`
- `overtimeFieldConfigs`

Example:

```ts
{
  name: 'hasMultipleEmploymentRelationships',
  type: 'checkbox',
  labelId: 'taxes-and-deductions-multiple-employments',
  contracts: ['uop_monthly', 'uop_hourly'],
  defaultValue: false,
  validation: {
    required: true,
  },
}
```

Changing the contracts, label, order or visibility now requires only a metadata change.

### `DynamicSalaryFields.tsx`
Generic renderer. It converts metadata into the existing components:

- `FormikNumberField`
- `FomrikSelectField`
- MUI `Checkbox`

It should normally not contain business-specific salary rules.

### `SalaryCalculatorForm.tsx`
Keeps only the parts that are genuinely custom:

- Formik
- tabs/layout
- calendar and working-time calculations
- holiday calendar
- L4 picker
- vacation picker
- calculation preview
- save/reset/override dialogs

Rate, tax and overtime fields are rendered from metadata.

## Adding a new simple UI field

If the property already exists in `SalaryCalculatorValues`, normally you only add metadata:

```ts
{
  name: 'someExistingProperty',
  type: 'number',
  labelId: 'some-intl-id',
  contracts: ['uop_monthly'],
  unit: 'zł',
  defaultValue: 0,
  visibleWhen: values => values.ppkEnabled === true,
  validation: {
    required: true,
    min: 0,
    max: 100,
  },
}
```

The field is then automatically:

1. rendered,
2. hidden/shown according to metadata,
3. initialized for old records if missing,
4. included in simple Yup validation.

## Important limitation

A completely new business property cannot literally exist only in metadata.

If you invent a new value, for example:

```ts
specialTaxRelief: boolean
```

then `SalaryCalculatorValues` must still be extended because TypeScript and the calculation engine need to know that the property exists. If it must be persisted, the API/database model must also be updated.

Metadata eliminates repeated **form wiring**, not the domain model itself.

## Why calendar/L4/vacation remain custom

Those are not ordinary scalar form fields. They contain date-range components and cross-field behavior. Encoding them into metadata would make the configuration harder to understand than explicit React code.

## Intl

This refactor introduces no new intl IDs. It reuses the IDs already used by the current salary form.
