import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (body.email === 'bad@test.local') {
      return HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: 'u1',
          fullName: 'Customer',
          email: body.email ?? 'c@test.local',
          role: 'CUSTOMER',
        },
      },
    });
  }),

  http.get('/api/v1/managers/damage-reports', () =>
    HttpResponse.json({
      success: true,
      data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 },
    }),
  ),
];
