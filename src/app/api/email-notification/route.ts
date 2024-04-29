import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const data = await req.json();

    console.log(data);

    return new NextResponse(null, {
      status: 200,
      statusText: "Success",
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      statusText: "Error",
    });
  }
}
