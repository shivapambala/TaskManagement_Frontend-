import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="empty" style={{ minHeight: '100vh' }}>
      <h1 className="big-404">404</h1>
      <h3>We can’t find that page</h3>
      <p>The link may be broken or the page may have moved.</p>
      <Link to="/" className="btn btn-primary btn-md">Back to dashboard</Link>
    </div>
  );
}
