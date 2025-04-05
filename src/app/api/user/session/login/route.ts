import Users from '@/controllers/user';
import { NextRequest, NextResponse } from 'next/server';

const userInstance = Users.getInstances();

/**
 * @param {NextRequest} req
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

    let result = await userInstance.login(username, password);
    if (result.username === "system") {
      return NextResponse.json({ message: "The Password or Username is Incorrect" }, { status: 401 });
    }
    const tokenFunction = await userInstance.createAccessToken(result._id.toString());
    const token = tokenFunction.newToken;

    // Create a new response instance
    const response = new NextResponse(JSON.stringify({ token }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Set cookies manually
    response.cookies.set('refreshtoken', tokenFunction.refreshToken, {
      path: '/',
      secure: true,
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return response;

}
