
import {
  getConversation,
  deleteConversation,
} from "../../../../tools/conversation-tool";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await getConversation({
      conversationId: id,
    });

    return Response.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("GET single conversation error:", error);

    return Response.json(
      {
        success: false,
        message: "Could not get conversation",
      },
      { status: 404 }
    );
  }
}



import mongoose from "mongoose";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    const result = await deleteConversation({
      conversationId: id,
    });

    return Response.json(result);
  } catch (error) {
    console.error("DELETE conversation error:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Could not delete conversation",
      },
      { status: 500 }
    );
  }
}
