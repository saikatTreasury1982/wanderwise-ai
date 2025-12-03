import { NextRequest, NextResponse } from 'next/server';
import { getTripNoteById, updateTripNote, deleteTripNote } from '@/app/lib/services/trip-notes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const note = await getTripNoteById(Number(noteId));
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching trip note:', error);
    return NextResponse.json({ error: 'Failed to fetch trip note' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const body = await request.json();
    const note = await updateTripNote(Number(noteId), body);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating trip note:', error);
    return NextResponse.json({ error: 'Failed to update trip note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const success = await deleteTripNote(Number(noteId));
    if (!success) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip note:', error);
    return NextResponse.json({ error: 'Failed to delete trip note' }, { status: 500 });
  }
}