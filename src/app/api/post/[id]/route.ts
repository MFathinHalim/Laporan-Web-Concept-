import { NextRequest, NextResponse } from "next/server";
import MainController from "@/controllers/post";
import { headers } from "next/headers";
import Users from "@/controllers/user";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/").pop()!;
    const post = await MainController.getById(id);
    return Response.json(post);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 404 });
  }
}

const userInstance = Users.getInstances();

export async function PATCH(request: NextRequest) {
  const headersList: any = await headers();
    const authHeader = headersList.get("authorization");
    const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
    if (!token) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // Check token validity (replace `checkAccessToken` with your actual function)
    const checkToken = await userInstance.checkAccessToken(token);
    if (!checkToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

  try {
    const id = request.nextUrl.pathname.split("/").pop()!;
    //@ts-ignore
    const result = await MainController.completeIt(id, checkToken);
    return Response.json(result);
  } catch (err: any) {
    console.error(err)
    return Response.json({ error: err.message }, { status: 400 });
  }
}
