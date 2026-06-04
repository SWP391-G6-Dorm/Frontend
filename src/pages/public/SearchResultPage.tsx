import { useSearchParams } from 'react-router-dom';
import RoomListingPage from './RoomListingPage';

// SCR-09 — Search Result
// Reuses RoomListingPage with active filter chips shown.
// Entity: Room · Property — same as SCR-07, with active filter display.
// This component is a thin wrapper that shows active filter chips on top.

export default function SearchResultPage() {
  // SearchResultPage delegates to RoomListingPage
  // URL search params are passed through automatically.
  return <RoomListingPage />;
}
