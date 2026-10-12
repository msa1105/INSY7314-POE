/* Meta Open Source, 2024
 * Passing Props to a Component
 * React Documentation
 * https://react.dev/learn/passing-props-to-a-component
 * Accessed: 12 October 2026
 */

/* MDN Contributors, 2026
 * CSS width property
 * MDN Web Docs
 * https://developer.mozilla.org/en-US/docs/Web/CSS/width
 * Accessed: 12 October 2026
 */

export default function ProgressBar({ step, totalSteps }) {
  const width = (step / totalSteps) * 100 + '%'

  return (
    <div className="progress-bar">
      <p className="progress-bar__text">Step {step} of {totalSteps}</p>
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width }} />
      </div>
    </div>
  )
}
