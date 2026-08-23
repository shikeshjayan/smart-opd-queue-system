import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ opdId: string }> }) {
  await dbConnect();
  const { opdId } = await params;
  const { QueueEntryModel } = await import("@/lib/models");
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(async () => {
        try {
          const entries = await QueueEntryModel.find({ opdId })
            .sort({ tokenNumber: 1 })
            .lean();
          
          const nowServing = entries.find((e: any) => e.status === "in_consultation")?.tokenNumber 
            ?? entries.find((e: any) => e.status === "called")?.tokenNumber;
          
          const waiting = entries.filter((e: any) => e.status === "waiting");
          const nextTokens = waiting.slice(0, 5).map((e: any) => e.tokenNumber);

          const data = JSON.stringify({
            nowServing,
            nextTokens,
            waitingCount: waiting.length,
            totalTokens: entries.length,
            timestamp: new Date().toISOString()
          });

          controller.enqueue(`data: ${data}\n\n`);
        } catch (error) {
          console.error("SSE error:", error);
        }
      }, 10000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
