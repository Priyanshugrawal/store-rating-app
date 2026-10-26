import StoreBrowser from '../../components/StoreBrowser';

export default function MyRatings() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>My ratings</h1>
          <p className="muted">The stores you have scored. Change a score any time with Modify rating.</p>
        </div>
      </div>
      <StoreBrowser ratedByMe />
    </>
  );
}
