defmodule Vox.Membership do
  @moduledoc """
  Guarded membership for private/organization relays.

  When `:membership_mode` is `:invite`, only pubkeys on the members allowlist may
  connect. New members join by redeeming a one-time **enroll token** an admin
  issued out-of-band — the "specific way to enter the network". `:open` (default)
  lets anyone with a valid keypair connect (public relay).
  """
  import Ecto.Query
  alias Vox.Repo

  @doc "Is membership gated on this relay?"
  def gated?, do: Application.get_env(:vox, :membership_mode, :open) == :invite

  @doc "May this pubkey connect? (Always true when not gated.)"
  def allowed?(pubkey), do: not gated?() or member?(pubkey)

  def member?(pubkey), do: Repo.exists?(from m in "members", where: m.pubkey == ^pubkey)

  @doc "Admin: add a member directly."
  def add(pubkey) do
    Repo.insert_all("members", [%{pubkey: pubkey, added_ts: now()}],
      on_conflict: :nothing,
      conflict_target: [:pubkey]
    )

    :ok
  end

  @doc "Admin: list member pubkeys."
  def list_members, do: Repo.all(from m in "members", select: m.pubkey)

  @doc "Admin: remove a member."
  def remove_member(pubkey) do
    Repo.delete_all(from m in "members", where: m.pubkey == ^pubkey)
    :ok
  end

  @doc "Admin: list issued tokens with their used state."
  def list_tokens do
    Repo.all(from t in "enroll_tokens", select: %{token: t.token, used: not is_nil(t.used_ts)})
  end

  @doc "Admin: mint a one-time enroll token to hand to a prospective member."
  def create_token do
    token = Base.url_encode64(:crypto.strong_rand_bytes(18), padding: false)
    Repo.insert_all("enroll_tokens", [%{token: token, created_ts: now()}])
    token
  end

  @doc """
  Redeem a token for `pubkey` (single-use, atomic, and time-limited). Returns
  :ok or :error. A token older than the TTL can no longer be redeemed, so a
  leaked-but-unused token doesn't stay valid forever.
  """
  def redeem(token, pubkey) do
    cutoff = now() - ttl_ms()

    {count, _} =
      Repo.update_all(
        from(t in "enroll_tokens",
          where: t.token == ^token and is_nil(t.used_ts) and t.created_ts > ^cutoff
        ),
        set: [used_ts: now(), used_by: pubkey]
      )

    if count == 1 do
      add(pubkey)
      :ok
    else
      :error
    end
  end

  # Enroll tokens expire after this window (default 7 days).
  defp ttl_ms, do: Application.get_env(:vox, :enroll_token_ttl_ms, 7 * 24 * 60 * 60 * 1000)

  defp now, do: System.system_time(:millisecond)
end
