defmodule Vox.Federation.Policy do
  @moduledoc """
  Trust policy for accepting a (signature-verified) federation push, per the
  operator's `:federation_policy` config:

    * `:open`      — accept any relay whose signature verifies (record it for visibility)
    * `:tofu`      — accept + record on first contact; honor revocation
    * `:allowlist` — accept only relays an operator explicitly added (and not revoked)

  A family/company relay wants `:allowlist`; a public volunteer relay wants
  `:open`. Revocation (`revoked_at`) is honored in every mode.
  """
  import Ecto.Query
  alias Vox.Repo

  @doc """
  Decide whether to accept a push signed by `relay_pubkey` claiming `origin`.

  The signature already proved possession of `relay_pubkey`. On FIRST contact we
  also bind pubkey↔origin: fetch `<origin>/federation/identity` and confirm it
  serves the same pubkey — so a relay can't lie about *which* origin it is
  (you're trusting DNS+TLS, the web's existing root). Once bound, later pushes
  short-circuit. Revocation and allowlist are honored on top.
  """
  def check(relay_pubkey, origin \\ nil) do
    cond do
      revoked?(relay_pubkey) ->
        :error

      # Already bound (verified before) — accept per policy.
      known?(relay_pubkey) ->
        if policy() == :allowlist, do: :ok, else: :ok

      # Unknown relay: allowlist never auto-accepts; open/tofu bind via origin.
      policy() == :allowlist ->
        :error

      true ->
        case verify_origin(relay_pubkey, origin) do
          :ok ->
            record(relay_pubkey, origin)
            :ok

          :error ->
            :error
        end
    end
  end

  # Reverse-fetch the claimed origin's identity and confirm it vouches for this key.
  defp verify_origin(_pubkey, nil), do: :error
  defp verify_origin(_pubkey, ""), do: :error

  defp verify_origin(pubkey, origin) do
    with true <- safe_origin?(origin),
         url = String.trim_trailing(origin, "/") <> "/federation/identity",
         {:ok, %{status: 200, body: %{"relay_pubkey" => ^pubkey}}} <-
           Req.get(url, retry: false, redirect: false, receive_timeout: 5_000) do
      :ok
    else
      _ -> :error
    end
  rescue
    _ -> :error
  end

  # Guard the origin reverse-fetch against SSRF: only http(s) to a PUBLIC host.
  # Blocks loopback/private/link-local/ULA targets (127.0.0.1, 169.254/16,
  # 10|172.16|192.168, ::1, fc00::/7, fe80::/10) and redirects. Operators can
  # allow private origins for local federation testing via config.
  # (Residual: DNS-rebinding TOCTOU — Req re-resolves; acceptable for a v1 guard.)
  defp safe_origin?(origin) when is_binary(origin) do
    case URI.parse(origin) do
      %URI{scheme: s, host: h} when s in ["http", "https"] and is_binary(h) and h != "" ->
        allow_private?() or public_host?(h)

      _ ->
        false
    end
  end

  defp safe_origin?(_), do: false

  defp allow_private?, do: Application.get_env(:vox, :federation_allow_private_origins, false)

  defp public_host?(host) do
    charlist = String.to_charlist(host)

    resolved =
      case :inet.getaddr(charlist, :inet) do
        {:ok, ip} -> {:ok, ip}
        _ -> :inet.getaddr(charlist, :inet6)
      end

    case resolved do
      {:ok, ip} -> not private_ip?(ip)
      _ -> false
    end
  end

  defp private_ip?({10, _, _, _}), do: true
  defp private_ip?({127, _, _, _}), do: true
  defp private_ip?({0, _, _, _}), do: true
  defp private_ip?({169, 254, _, _}), do: true
  defp private_ip?({192, 168, _, _}), do: true
  defp private_ip?({172, b, _, _}) when b >= 16 and b <= 31, do: true
  defp private_ip?({0, 0, 0, 0, 0, 0, 0, 1}), do: true
  defp private_ip?({a, _, _, _, _, _, _, _}) when a >= 0xFC00 and a <= 0xFDFF, do: true
  defp private_ip?({a, _, _, _, _, _, _, _}) when a >= 0xFE80 and a <= 0xFEBF, do: true
  defp private_ip?(_), do: false

  defp policy, do: Application.get_env(:vox, :federation_policy, :open)

  @doc "Operator action: explicitly trust a peer relay (for :allowlist)."
  def allow(relay_pubkey, origin \\ nil), do: record(relay_pubkey, origin)

  @doc "Operator action: trust a peer by ORIGIN — fetches + binds its key."
  def allow_origin(origin) do
    with true <- safe_origin?(origin),
         url = String.trim_trailing(origin, "/") <> "/federation/identity",
         {:ok, %{status: 200, body: %{"relay_pubkey" => pub}}} <-
           Req.get(url, retry: false, redirect: false, receive_timeout: 5_000) do
      record(pub, origin)
      {:ok, pub}
    else
      _ -> :error
    end
  rescue
    _ -> :error
  end

  @doc "Operator: list known peer relays and their trust state."
  def list_relays do
    Repo.all(
      from k in "known_relays",
        select: %{pubkey: k.relay_pubkey, origin: k.origin, revoked: not is_nil(k.revoked_at)}
    )
  end

  @doc "Operator action: revoke trust in a peer relay."
  def revoke(relay_pubkey) do
    Repo.update_all(
      from(k in "known_relays", where: k.relay_pubkey == ^relay_pubkey),
      set: [revoked_at: System.system_time(:millisecond)]
    )

    :ok
  end

  defp known?(relay_pubkey) do
    Repo.exists?(
      from k in "known_relays",
        where: k.relay_pubkey == ^relay_pubkey and is_nil(k.revoked_at)
    )
  end

  defp revoked?(relay_pubkey) do
    Repo.exists?(
      from k in "known_relays",
        where: k.relay_pubkey == ^relay_pubkey and not is_nil(k.revoked_at)
    )
  end

  defp record(relay_pubkey, origin) do
    Repo.insert_all(
      "known_relays",
      [%{relay_pubkey: relay_pubkey, origin: origin, first_seen: System.system_time(:millisecond)}],
      on_conflict: :nothing,
      conflict_target: [:relay_pubkey]
    )

    :ok
  end
end
