import type { FocusEventHandler, InputHTMLAttributes } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Checkbox, Select, Slider } from 'radix-ui'

import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'
const selectTriggerClass =
  'flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[placeholder]:text-muted-foreground'

type FieldAdapter<T> = {
  state: { value: T; meta: { errors: readonly unknown[] } }
  handleChange: (value: T) => void
  handleBlur: () => void
}

export type SelectOption<T extends string | boolean> = {
  value: T
  label: string
}

export function FieldError({ errors = [] }: { errors?: readonly unknown[] }) {
  if (errors.length === 0) return null
  return (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {errors
        .map((error) =>
          typeof error === 'string'
            ? error
            : ((error as { message?: string }).message ?? 'Invalid value'),
        )
        .join(', ')}
    </p>
  )
}

type FormInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'onBlur'
> & {
  field: FieldAdapter<string>
  label: string
  trailingText?: string
}

export function FormInput({
  field,
  label,
  trailingText,
  className,
  ...inputProps
}: FormInputProps) {
  const errors = field.state.meta.errors
  return (
    <div>
      <label className="relative block pt-1">
        <Input
          {...inputProps}
          className={cn(
            'peer h-14 px-4 pt-5 pb-2 text-base placeholder:opacity-0 focus:placeholder:opacity-100 md:text-base',
            className,
          )}
          placeholder={inputProps.placeholder ?? ' '}
          value={field.state.value}
          onChange={(event) => field.handleChange(event.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={errors.length > 0}
          aria-label={label}
        />
        <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 px-1 text-base leading-none text-muted-foreground transition-all peer-focus:top-1 peer-focus:bg-background peer-focus:text-sm peer-focus:text-foreground peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:text-foreground">
          {label}
        </span>
      </label>
      <div className="flex justify-between">
        <FieldError errors={errors} />
        {trailingText ? (
          <span className="ml-auto mt-1 text-xs text-muted-foreground">
            {trailingText}
          </span>
        ) : null}
      </div>
    </div>
  )
}

type FormSelectFieldProps<T extends string | boolean> = {
  field: FieldAdapter<T>
  label: string
  options: Array<SelectOption<T>>
  hideLabel?: boolean
}

export function FormSelectField<T extends string | boolean>({
  field,
  label,
  options,
  hideLabel = false,
}: FormSelectFieldProps<T>) {
  return (
    <div>
      {hideLabel ? null : <span className={labelClass}>{label}</span>}
      <RadixSelect
        label={label}
        value={String(field.state.value)}
        onValueChange={(value) => {
          const selected = options.find(
            (option) => String(option.value) === value,
          )
          if (selected) field.handleChange(selected.value)
        }}
        onBlur={field.handleBlur}
        options={options.map((option) => ({
          value: String(option.value),
          label: option.label,
        }))}
        invalid={field.state.meta.errors.length > 0}
      />
      <FieldError errors={field.state.meta.errors} />
    </div>
  )
}

export function CheckboxField({
  field,
  label,
}: {
  field: FieldAdapter<boolean>
  label: string
}) {
  return (
    <span className="flex items-center gap-3">
      <span className="text-sm font-medium">{label}</span>
      <Checkbox.Root
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        onBlur={field.handleBlur}
        aria-label={label}
        className="flex size-5 cursor-pointer items-center justify-center rounded border border-input bg-background text-primary shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      >
        <Checkbox.Indicator>
          <Check className="size-3.5" />
        </Checkbox.Indicator>
      </Checkbox.Root>
    </span>
  )
}

type RangeFieldProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'min' | 'max' | 'step'
> & {
  field: FieldAdapter<number>
  label: string
  suffix?: string
}

export function RangeField({
  field,
  label,
  suffix = '%',
  ...props
}: RangeFieldProps) {
  return (
    <div>
      <span className={labelClass}>
        {label}: {field.state.value}
        {suffix}
      </span>
      <Slider.Root
        min={Number(props.min ?? 0)}
        max={Number(props.max ?? 100)}
        step={Number(props.step ?? 1)}
        value={[field.state.value]}
        onValueChange={([value]) => field.handleChange(value)}
        onBlur={field.handleBlur}
        aria-label={label}
        className="relative flex h-9 w-full touch-none select-none items-center"
      >
        <Slider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <Slider.Range className="absolute h-full bg-teal-500 dark:bg-teal-400" />
        </Slider.Track>
        <Slider.Thumb className="block size-5 rounded-full border-2 border-teal-500 bg-white shadow-md outline-none focus-visible:ring-3 focus-visible:ring-teal-500/30 dark:border-teal-400 dark:bg-slate-950" />
      </Slider.Root>
      <FieldError errors={field.state.meta.errors} />
    </div>
  )
}

export function SelectField({
  label,
  value,
  options,
  onValueChange,
  className,
}: {
  label: string
  value: string
  options: Array<SelectOption<string>>
  onValueChange: (value: string) => void
  className?: string
}) {
  return (
    <RadixSelect
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      className={className}
    />
  )
}

function RadixSelect({
  label,
  value,
  options,
  onValueChange,
  onBlur,
  invalid = false,
  className,
}: {
  label: string
  value: string
  options: Array<SelectOption<string>>
  onValueChange: (value: string) => void
  onBlur?: FocusEventHandler<HTMLButtonElement>
  invalid?: boolean
  className?: string
}) {
  const validOptions = options.filter(
    (option, index, allOptions) =>
      option.value !== '' &&
      allOptions.findIndex((candidate) => candidate.value === option.value) ===
        index,
  )

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={cn(selectTriggerClass, className)}
        aria-label={label}
        aria-invalid={invalid}
        onBlur={onBlur}
      >
        <Select.Value placeholder={`Select ${label.toLowerCase()}`} />
        <Select.Icon>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 opacity-100 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
        >
          <Select.Viewport className="bg-white p-1 dark:bg-slate-950">
            {validOptions.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer select-none items-center rounded-md bg-white py-1.5 pr-8 pl-2 text-sm outline-none focus:bg-slate-100 focus:text-slate-950 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:bg-slate-950 dark:focus:bg-slate-800 dark:focus:text-slate-50"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-2">
                  <Check className="size-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
