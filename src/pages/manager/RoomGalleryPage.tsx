import { Navigate, useParams } from 'react-router-dom';

/** @deprecated SCR-32 merged into SCR-31 tab `gallery` */
export default function RoomGalleryPage() {
  const { id } = useParams();
  return <Navigate to={`/manager/rooms/${id}/edit?tab=gallery`} replace />;
}
