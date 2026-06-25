// Small helpers for two-way binding in TSX (no v-model directive needed).

type FieldEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

/** Wire a text/select/textarea value to a setter. */
export const onText =
  (set: (value: string) => void) =>
  (e: Event): void =>
    set((e.target as FieldEl).value)

/** Wire a numeric input value to a setter. */
export const onNum =
  (set: (value: number) => void) =>
  (e: Event): void =>
    set(Number((e.target as HTMLInputElement).value))

/** Only fire when the click lands on the element itself (backdrop), not children. */
export const onSelf =
  (fn: () => void) =>
  (e: MouseEvent): void => {
    if (e.target === e.currentTarget) fn()
  }
