
import {
  getConversations,
  saveConversation,
} from "../../../tools/conversation-tool";

// GET: All conversations
export async function GET() {
  try {
    const conversations = await getConversations();

    return Response.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("GET conversations error:", error);

    return Response.json(
      {
        success: false,
        message: "Could not load conversations",
      },
      { status: 500 }
    );
  }
}

// POST: Save a message
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { conversationId, message, role } = body;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      !["user", "assistant"].includes(role)
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid input",
        },
        { status: 400 }
      );
    }

    const result = await saveConversation({
      conversationId,
      message: message.trim(),
      role,
    });

    return Response.json(result);
  } catch (error) {
    console.error("POST conversation error:", error);

    return Response.json(
      {
        success: false,
        message: "Could not save conversation",
      },
      { status: 500 }
    );
  }
}
