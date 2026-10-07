export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-heading" data-aos="fade-up"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-heading-action">{action}</div>}</div>
}
