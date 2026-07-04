defmodule VoxWeb.FederationController do
  @moduledoc """
  Relay-to-relay ingress. A push is accepted only if:

    * federation is enabled (a `:closed` relay rejects everything — sealed island),
    * the `X-Relay-Sig` verifies against the claimed `X-Relay-Pubkey` (no forgery),
    * `X-Relay-Ts` is fresh (replay protection),
    * the trust `Policy` accepts that relay (open/allowlist/tofu; origin-bound; revocable).

  We never read the envelope (E2E sealed); the recipient verifies the real sender
  from the sealed content. This is a trust layer AROUND the opaque pipe.
  """
  use VoxWeb, :controller
  alias Vox.Federation.Policy

  @ts_window_s 300

  # GET /federation/identity — this relay's public fingerprint.
  def identity(conn, _params) do
    if Vox.Federation.closed?() do
      forbidden(conn)
    else
      json(conn, %{relay_pubkey: Vox.RelayIdentity.pubkey_hex()})
    end
  end

  # POST /federation/push
  def push(conn, %{"to" => to, "envelope" => envelope} = params) do
    pub = header(conn, "x-relay-pubkey")
    origin = header(conn, "x-relay-origin")

    cond do
      Vox.Federation.closed?() ->
        forbidden(conn)

      # Cheap per-SOURCE-IP flood cap BEFORE any crypto or the origin fetch. Key
      # rotation can't bypass an IP bound, and this shields the SSRF-shaped
      # origin lookup in Policy.check from unauthenticated amplification.
      not Vox.RateLimiter.allow?({:fed_ip, client_ip(conn)}, ip_limit()) ->
        rate_limited(conn)

      # Cheap crypto: valid, fresh signature over the claimed pubkey.
      not sig_ok?(conn, to, params) ->
        conn |> put_status(401) |> json(%{error: "unauthorized relay"})

      # Signed ≠ not-abusive: cap each authenticated peer's push rate too.
      not Vox.RateLimiter.allow?({:fed_peer, pub}, peer_limit()) ->
        rate_limited(conn)

      # Expensive: trust policy (may reverse-fetch the origin). Now behind both
      # rate limits + a verified signature.
      Policy.check(pub, origin) != :ok ->
        conn |> put_status(401) |> json(%{error: "unauthorized relay"})

      # On a guarded relay, only accept pushes addressed to an ACTUAL local member
      # — otherwise any peer can fill the store with inboxes for pubkeys we don't
      # host (storage-exhaustion). Open relays bound this via rate limit + retention.
      Vox.Membership.gated?() and not Vox.Membership.member?(to) ->
        conn |> put_status(404) |> json(%{error: "unknown recipient"})

      true ->
        case Vox.Delivery.deliver(to, params["from"] || "", envelope, params["id"], params["ephemeral"] || false) do
          {:ok, _} ->
            json(conn, %{ok: true})

          {:error, reason} ->
            # Do NOT ack a failed delivery: a 502 tells the sending relay to retry
            # (its durable outbox), so a transient local failure never silently
            # drops the message.
            conn |> put_status(502) |> json(%{error: inspect(reason)})
        end
    end
  end

  def push(conn, _), do: conn |> put_status(400) |> json(%{error: "bad push"})

  defp sig_ok?(conn, to, params) do
    pub = header(conn, "x-relay-pubkey")
    ts = header(conn, "x-relay-ts")
    sig = header(conn, "x-relay-sig")
    mid = params["id"]

    is_binary(pub) and is_binary(ts) and is_binary(sig) and fresh?(ts) and
      Vox.RelayIdentity.verify(pub, "#{pub}|#{ts}|#{to}|#{mid}", sig)
  end

  defp rate_limited(conn), do: conn |> put_status(429) |> json(%{error: "rate limited"})

  defp ip_limit, do: Application.get_env(:vox, :federation_ip_rate_limit, 240)
  defp peer_limit, do: Application.get_env(:vox, :federation_rate_limit, 120)

  defp client_ip(conn) do
    case get_req_header(conn, "x-forwarded-for") do
      [xff | _] -> xff |> String.split(",") |> hd() |> String.trim()
      _ -> conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  defp forbidden(conn), do: conn |> put_status(403) |> json(%{error: "federation disabled"})

  defp header(conn, name) do
    case get_req_header(conn, name) do
      [v | _] -> v
      _ -> nil
    end
  end

  defp fresh?(ts) do
    case Integer.parse(ts) do
      {t, _} -> abs(System.system_time(:second) - t) <= @ts_window_s
      _ -> false
    end
  end
end
