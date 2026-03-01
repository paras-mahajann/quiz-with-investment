import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="auth-wrapper">
      <section className="auth-card">
        <h1>Quiz With Investment</h1>
        <p>Choose your role to continue.</p>
        <div className="auth-actions">
          <Link className="btn btn-primary" to="/participant">
            Participant
          </Link>
          <Link className="btn btn-soft" to="/admin">
            Admin
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
