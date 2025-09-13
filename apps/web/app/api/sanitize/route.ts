import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@toolgate/core";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const res = analyze(String(text ?? ""));
  return NextResponse.json(res);
}
