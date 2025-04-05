import { NextRequest } from "next/server";
import MainController from "@/controllers/post";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/").pop()!;
    const post = await MainController.getById(id);
    return Response.json(post);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/").pop()!;
    const result = await MainController.completeIt(id);
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
