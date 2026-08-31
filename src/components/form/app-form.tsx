import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import type { InputHTMLAttributes } from 'react'

import {
  CheckboxField as CheckboxControl,
  FormInput,
  FormSelectField,
  RangeField as RangeControl,
  SwitchField as SwitchControl,
} from './form-controls'
import type { SelectOption } from './form-controls'

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'onBlur'
> & {
  label: string
  trailingText?: string
}

function TextField(props: TextFieldProps) {
  const field = useFieldContext<string>()
  return <FormInput field={field} {...props} />
}

function CheckboxField({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  return <CheckboxControl field={field} label={label} />
}

function SwitchField({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  return <SwitchControl field={field} label={label} />
}

function SelectField({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string
  options: Array<SelectOption<string | boolean>>
  value?: string | boolean
  onValueChange?: (value: string | boolean) => void
}) {
  const field = useFieldContext<string | boolean>()
  return (
    <FormSelectField
      field={field}
      label={label}
      options={options}
      value={value}
      onValueChange={onValueChange}
    />
  )
}

function RangeField({
  label,
  min,
  max,
  step,
}: {
  label: string
  min?: number
  max?: number
  step?: number
}) {
  const field = useFieldContext<number>()
  return (
    <RangeControl field={field} label={label} min={min} max={max} step={step} />
  )
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    CheckboxField,
    SwitchField,
    SelectField,
    RangeField,
  },
  formComponents: {},
})

export { useFieldContext, useFormContext }
