export function TileSkeletons({ count = 6 }) {
  return (
    <div className="tiles" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <div key={i} className="skel skel-tile" />)}
    </div>
  );
}

export function BlockSkeleton({ height = 200 }) {
  return <div className="skel" style={{ height }} aria-hidden="true" />;
}
