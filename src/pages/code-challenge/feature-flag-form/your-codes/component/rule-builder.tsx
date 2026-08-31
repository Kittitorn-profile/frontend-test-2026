import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Braces, GripVertical, Plus } from 'lucide-react'

import { SelectField } from '#/components/form'
import { Button } from '#/components/ui/button'
import { DeleteIconButton } from '#/components/ui/delete-icon-button'
import { Input } from '#/components/ui/input'

import type {
  ConditionGroup,
  ConditionNode,
  ConditionOperator,
  RuleNode,
} from '../schema'

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals To' },
  { value: 'not_equals', label: 'Not Equals To' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than_or_equal', label: 'Less Than Equal To' },
  { value: 'greater_than_or_equal', label: 'Greater Than Equal To' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'in_list', label: 'In a List' },
  { value: 'present', label: 'Present' },
  { value: 'not', label: 'Not' },
]

const COMBINATOR_OPTIONS = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
]

function createId() {
  return globalThis.crypto.randomUUID()
}

function createCondition(): ConditionNode {
  return {
    id: createId(),
    type: 'condition',
    attribute: 'custom',
    customAttribute: '',
    operator: 'equals',
    value: '',
  }
}

function createGroup(): ConditionGroup {
  return {
    id: createId(),
    type: 'group',
    combinator: 'AND',
    children: [createCondition()],
  }
}

export function RuleBuilder({
  value,
  onChange,
  showErrors = false,
}: {
  value: ConditionGroup
  onChange: (value: ConditionGroup) => void
  showErrors?: boolean
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    const nextValue = moveNode(value, String(active.id), String(over.id))
    if (nextValue !== value) onChange(nextValue)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <ConditionGroupEditor
        group={value}
        onChange={onChange}
        depth={0}
        showErrors={showErrors}
      />
    </DndContext>
  )
}

const GROUP_DROP_PREFIX = 'group-drop:'

type NodeLocation = {
  parentId: string
  index: number
  node: RuleNode
}

function findNodeLocation(
  group: ConditionGroup,
  nodeId: string,
): NodeLocation | undefined {
  for (let index = 0; index < group.children.length; index += 1) {
    const node = group.children[index]
    if (node.id === nodeId) return { parentId: group.id, index, node }
    if (node.type === 'group') {
      const nested = findNodeLocation(node, nodeId)
      if (nested) return nested
    }
  }
  return undefined
}

function containsGroup(node: RuleNode, groupId: string): boolean {
  if (node.type === 'condition') return false
  if (node.id === groupId) return true
  return node.children.some((child) => containsGroup(child, groupId))
}

function removeNode(group: ConditionGroup, nodeId: string): ConditionGroup {
  if (group.children.some((child) => child.id === nodeId)) {
    return {
      ...group,
      children: group.children.filter((child) => child.id !== nodeId),
    }
  }

  return {
    ...group,
    children: group.children.map((child) =>
      child.type === 'group' ? removeNode(child, nodeId) : child,
    ),
  }
}

function insertNode(
  group: ConditionGroup,
  parentId: string,
  index: number,
  node: RuleNode,
): ConditionGroup {
  if (group.id === parentId) {
    const children = [...group.children]
    children.splice(index, 0, node)
    return { ...group, children }
  }

  return {
    ...group,
    children: group.children.map((child) =>
      child.type === 'group' ? insertNode(child, parentId, index, node) : child,
    ),
  }
}

function findGroup(
  group: ConditionGroup,
  groupId: string,
): ConditionGroup | undefined {
  if (group.id === groupId) return group
  for (const child of group.children) {
    if (child.type === 'group') {
      const nested = findGroup(child, groupId)
      if (nested) return nested
    }
  }
  return undefined
}

function moveNode(
  root: ConditionGroup,
  activeId: string,
  overId: string,
): ConditionGroup {
  const source = findNodeLocation(root, activeId)
  if (!source) return root

  const isGroupDrop = overId.startsWith(GROUP_DROP_PREFIX)
  const targetGroupId = isGroupDrop
    ? overId.slice(GROUP_DROP_PREFIX.length)
    : findNodeLocation(root, overId)?.parentId
  if (!targetGroupId || containsGroup(source.node, targetGroupId)) return root

  const targetGroup = findGroup(root, targetGroupId)
  if (!targetGroup) return root

  let targetIndex = targetGroup.children.length
  if (!isGroupDrop) {
    const target = findNodeLocation(root, overId)
    if (!target) return root
    targetIndex = target.index
    if (source.parentId === target.parentId && source.index < target.index) {
      targetIndex = target.index
    }
  }

  const withoutActive = removeNode(root, activeId)
  return insertNode(withoutActive, targetGroupId, targetIndex, source.node)
}

function ConditionGroupEditor({
  group,
  onChange,
  depth,
  showErrors,
}: {
  group: ConditionGroup
  onChange: (group: ConditionGroup) => void
  depth: number
  showErrors: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${GROUP_DROP_PREFIX}${group.id}`,
  })

  const updateChild = (index: number, child: RuleNode) => {
    const children = [...group.children]
    children[index] = child
    onChange({ ...group, children })
  }

  const removeChild = (index: number) => {
    onChange({
      ...group,
      children: group.children.filter((_, childIndex) => childIndex !== index),
    })
  }

  return (
    <div
      className={
        depth === 0
          ? 'space-y-4 rounded-xl border border-indigo-300 bg-background/70 p-4 dark:border-indigo-800'
          : 'space-y-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-3 dark:border-indigo-900 dark:bg-indigo-950/20'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-36">
          <SelectField
            label="Condition group operator"
            value={group.combinator}
            options={COMBINATOR_OPTIONS}
            onValueChange={(combinator) =>
              onChange({ ...group, combinator: combinator as 'AND' | 'OR' })
            }
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              ...group,
              children: [...group.children, createCondition()],
            })
          }
        >
          <Plus /> Rule
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({ ...group, children: [...group.children, createGroup()] })
          }
        >
          <Braces /> Group
        </Button>
      </div>

      <SortableContext
        items={group.children.map((child) => child.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`min-h-12 space-y-2 rounded-lg transition-colors ${
            isOver
              ? 'bg-teal-100/70 ring-2 ring-teal-400 dark:bg-teal-950/30'
              : ''
          }`}
        >
          {group.children.map((child, index) => (
            <SortableRuleNode
              key={child.id}
              child={child}
              index={index}
              depth={depth}
              canRemove={group.children.length > 1}
              showErrors={showErrors}
              onUpdate={updateChild}
              onRemove={removeChild}
            />
          ))}
          {group.children.length === 0 ? (
            <div className="rounded-lg border border-dashed border-teal-400 p-4 text-center text-xs text-muted-foreground">
              Drop a rule or group here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableRuleNode({
  child,
  index,
  depth,
  canRemove,
  showErrors,
  onUpdate,
  onRemove,
}: {
  child: RuleNode
  index: number
  depth: number
  canRemove: boolean
  showErrors: boolean
  onUpdate: (index: number, child: RuleNode) => void
  onRemove: (index: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: child.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid grid-cols-[28px_minmax(0,1fr)_36px] items-start gap-2 ${
        isDragging ? 'z-10 opacity-50' : ''
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="flex size-7 shrink-0 self-center cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        aria-label={`Drag ${child.type}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        {child.type === 'group' ? (
          <ConditionGroupEditor
            group={child}
            onChange={(next) => onUpdate(index, next)}
            depth={depth + 1}
            showErrors={showErrors}
          />
        ) : (
          <ConditionEditor
            condition={child}
            showErrors={showErrors}
            onChange={(next) => onUpdate(index, next)}
          />
        )}
      </div>
      <DeleteIconButton
        className="self-center justify-self-center"
        disabled={!canRemove}
        onClick={() => onRemove(index)}
        aria-label="Remove condition"
      />
    </div>
  )
}

function ConditionEditor({
  condition,
  onChange,
  showErrors,
}: {
  condition: ConditionNode
  onChange: (condition: ConditionNode) => void
  showErrors: boolean
}) {
  return (
    <div className="grid gap-2 rounded-lg bg-muted/70 p-2 md:grid-cols-[minmax(130px,0.8fr)_minmax(170px,1fr)_minmax(180px,1.3fr)]">
      <FloatingInput
        label="Field"
        value={
          condition.attribute === 'custom'
            ? condition.customAttribute
            : condition.attribute
        }
        onChange={(value) =>
          onChange({
            ...condition,
            attribute: 'custom',
            customAttribute: value,
          })
        }
        invalid={showErrors && !condition.customAttribute.trim()}
      />
      <div className="pt-1">
        <SelectField
          label="Operator"
          value={condition.operator}
          options={OPERATOR_OPTIONS}
          className="h-14 px-4 text-base md:text-base"
          onValueChange={(operator) =>
            onChange({ ...condition, operator: operator as ConditionOperator })
          }
        />
      </div>
      <div className="md:mr-8">
        {condition.operator === 'present' || condition.operator === 'not' ? (
          <FloatingInput label="Value" value="" disabled />
        ) : (
          <FloatingInput
            label="Value"
            value={condition.value}
            invalid={showErrors && !condition.value.trim()}
            onChange={(value) => onChange({ ...condition, value })}
          />
        )}
      </div>
    </div>
  )
}

function FloatingInput({
  label,
  value,
  onChange,
  disabled = false,
  invalid = false,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
  invalid?: boolean
}) {
  return (
    <label className="relative block pt-1">
      <Input
        className="peer h-14 px-4 pt-5 pb-2 text-base placeholder:text-transparent md:text-base"
        aria-label={label}
        placeholder=" "
        value={value}
        disabled={disabled}
        aria-invalid={invalid}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 px-1 text-base leading-none text-muted-foreground transition-all peer-focus:top-1 peer-focus:bg-background peer-focus:text-sm peer-focus:text-foreground peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:text-foreground">
        {label}
      </span>
    </label>
  )
}
