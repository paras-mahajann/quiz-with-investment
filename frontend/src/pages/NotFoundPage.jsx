import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="auth-wrapper">
      <section className="auth-card">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link className="btn btn-primary" to="/">
          Back Home
        </Link>
      </section>
    </div>
  );
}

export default NotFoundPage;
