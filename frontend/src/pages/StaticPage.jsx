export default function StaticPage({ title, body }) {
  return (
    <div className="static-page">
      <div className="container static-page__card">
        <span className="eyebrow">Legal</span>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
    </div>
  );
}
