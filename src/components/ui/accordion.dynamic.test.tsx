import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

function GrowingForm() {
  const [count, setCount] = useState(1)

  return (
    <Accordion type="multiple" defaultValue={['fields']}>
      <AccordionItem value="fields">
        <AccordionTrigger>Параметры рецепта</AccordionTrigger>
        <AccordionContent>
          {Array.from({ length: count }, (_, index) => (
            <label key={index}>
              Поле {index + 1}
              <input />
            </label>
          ))}
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            Добавить поле
          </button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

describe('AccordionContent with dynamically added form fields', () => {
  it('does not lock the inner height to the initially measured content', () => {
    const { container } = render(<GrowingForm />)

    for (let index = 0; index < 3; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Добавить поле' }))
    }

    expect(screen.getAllByRole('textbox')).toHaveLength(4)

    const content = container.querySelector('[data-slot="accordion-content"]')
    expect(content).toHaveAttribute('data-state', 'open')
    expect(content?.firstElementChild).not.toHaveClass(
      'h-(--radix-accordion-content-height)',
    )
  })
})
