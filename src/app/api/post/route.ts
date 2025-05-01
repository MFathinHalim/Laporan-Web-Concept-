import MainController from "@/controllers/post";
import imagekit from "@/utils/imagekit";
async function streamToArray(stream: ReadableStream): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
} 
export async function POST(req: Request) {
  const formData = await req.formData();

  const title = formData.get("title") as string;
  const file = formData.get("image") as File | null;

  const rawLat = formData.get("lat");
  const rawLng = formData.get("lng");
  const address = formData.get("address") as string | undefined;

  const lat =
    rawLat && rawLat !== "" ? parseFloat(rawLat as string) : undefined;
  const lng =
    rawLng && rawLng !== "" ? parseFloat(rawLng as string) : undefined;

  let imageUrl = "";

  if (file) {
    // Convert stream to Buffer
    const buffer = Buffer.from(await streamToArray(file.stream()));
  
    const uploadResult = await imagekit.upload({
      file: buffer,
      fileName: `media-${Date.now()}.${file.type.split("/")[1]}`,
      useUniqueFileName: false,
      folder: "LaporanApp",
    });

    if (!uploadResult || !uploadResult.url) {
      throw new Error("Upload failed");
    }
  
    imageUrl = uploadResult.url;
  }
  
  const post = await MainController.post({
    title,
    image: imageUrl,
    location:
      lat !== undefined &&
      lng !== undefined &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      address
        ? {
            type: "Point",
            coordinates: [lng, lat], // GeoJSON format
            address,
          }
        : undefined,
  });

  return Response.json(post);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);

  const posts = await MainController.get(page, limit);
  return Response.json(posts);
}
