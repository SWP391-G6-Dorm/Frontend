import { Navigate, useParams } from 'react-router-dom';

/** @deprecated SCR-33 merged into SCR-31 tab `status` */
export default function RoomStatusPage() {
  const { id } = useParams();
  return <Navigate to={`/manager/rooms/${id}/edit?tab=status`} replace />;
}
