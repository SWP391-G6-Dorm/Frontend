export async function loginWithGoogle() {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'placeholder' }),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  return await response.json();
}
