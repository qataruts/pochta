defmodule Vox.Delivery do
  @moduledoc """
  Deliver a sealed envelope into a local recipient's inbox conversation. Shared
  by local sends (`InboxChannel`) and federated pushes (`FederationController`).
  The payload is opaque ciphertext (JSON-encoded for the durable store).
  """

  def deliver(to, from, envelope, id, ephemeral) do
    message = %Chat.Message{
      id: id || random_id(),
      sender_id: from,
      payload: Jason.encode!(envelope),
      kind: if(ephemeral, do: :ephemeral, else: :chat)
    }

    if ephemeral do
      # Live-only traffic — WebRTC call signaling, typing, presence — takes the
      # engine's DIRECT fan-out lane: straight to the recipient's online `:syn`
      # subscribers, with NO membership DB write, NO owner GenServer hop, NO seq.
      # The old path (create_conversation + inject) did a per-message DB write and
      # funnelled through the single writer, so a call's signaling burst serialized
      # and stalled (~44s). The recipient already subscribed their inbox on connect.
      Chat.broadcast_ephemeral(to, message)
    else
      # Durable messages: ensure the inbox exists (recipient may be offline) and go
      # through the ordered, persisted writer.
      :ok = Chat.create_conversation(to, [to])
      Chat.inject(to, message)
    end
  end

  def random_id, do: Base.encode16(:crypto.strong_rand_bytes(8), case: :lower)
end
