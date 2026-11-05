import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import '../../components/stepper.component.ts'
import { UIStepper, UIStep } from '../../components/stepper.component.ts'

describe('UIStepper and UIStep component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  it('renders stepper with steps and sets active step correctly', async () => {
    const stepper = document.createElement('ui-stepper') as UIStepper
    stepper.innerHTML = `
      <ui-step step="1" label="Account Details"></ui-step>
      <ui-step step="2" label="Organization Setup"></ui-step>
      <ui-step step="3" label="Confirmation"></ui-step>
    `
    container.appendChild(stepper)
    await stepper.updateComplete

    const steps = stepper.querySelectorAll<UIStep>('ui-step')
    expect(steps.length).toBe(3)
    expect(steps[0].active).toBe(true)
    expect(steps[1].active).toBe(false)
    expect(steps[2].active).toBe(false)
  })

  it('switches active step and marks completed steps on click', async () => {
    const stepper = document.createElement('ui-stepper') as UIStepper
    stepper.innerHTML = `
      <ui-step step="1" label="Account Details"></ui-step>
      <ui-step step="2" label="Organization Setup"></ui-step>
      <ui-step step="3" label="Confirmation"></ui-step>
    `
    container.appendChild(stepper)
    await stepper.updateComplete

    const steps = stepper.querySelectorAll<UIStep>('ui-step')
    steps[1].click()
    await stepper.updateComplete

    expect(stepper.activeStep).toBe(1)
    expect(steps[0].completed).toBe(true)
    expect(steps[1].active).toBe(true)
    expect(steps[2].active).toBe(false)
  })
})
