/**
 * TimelineSection.jsx — Section 3
 * Plane is left-center. 3-step workflow appears on the right.
 */

const STEPS = [
  {
    number: '01',
    title:  'Connect your accounts',
    desc:   'Link all your social profiles in under two minutes. One dashboard, every platform.',
  },
  {
    number: '02',
    title:  'Create and schedule',
    desc:   'Draft posts, pick your publish times, let SocialPilot handle the rest automatically.',
  },
  {
    number: '03',
    title:  'Analyze and grow',
    desc:   'Read your performance data, understand what resonates, and double down on it.',
  },
];

export default function TimelineSection() {
  return (
    <section className="sp-section sp-timeline">
      <div className="sp-timeline__content">
        <p className="sp-eyebrow">HOW IT WORKS</p>
        <h2 className="sp-section-title">The route<br />to success</h2>

        <div className="sp-timeline__steps">
          {STEPS.map((step) => (
            <div key={step.number} className="sp-timeline__step">
              <span className="sp-timeline__number">{step.number}</span>
              <div className="sp-timeline__text">
                <h3 className="sp-timeline__step-title">{step.title}</h3>
                <p className="sp-timeline__step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
